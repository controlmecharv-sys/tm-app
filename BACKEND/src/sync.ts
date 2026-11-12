import { nextSeq, tx, type DB } from "./db.ts";

/*
 * Sincronización offline-first (docs/modelo-de-mejora.md, sección 4.5).
 * - Cada operación trae un op_id único: si llega dos veces, se aplica una sola vez.
 * - Conflictos: gana la escritura más reciente por fila (ts). Un borrado gana a una edición igual de reciente.
 * - Los borrados son lógicos y viajan a los otros dispositivos.
 * - Para alimentos de la base, el servidor recalcula kcal y macros: no confía en los del cliente.
 */

export type Entity = "food" | "exercise" | "weight" | "goals";
export interface Op {
  op_id: string;
  entity: Entity;
  type: "upsert" | "delete";
  id?: string;        // food / exercise
  day?: string;       // YYYY-MM-DD (food, exercise, weight)
  data?: Record<string, unknown>;
  ts: number;         // momento del cambio en el cliente (ms)
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MEALS = new Set(["desayuno", "almuerzo", "cena", "snacks"]);
const MAX_OPS = 500;

const num = (v: unknown, min: number, max: number): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : null;
const str = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.length > 0 && v.length <= max ? v : null;

class Reject extends Error {}

export function applyOps(db: DB, userId: string, ops: unknown): { applied: string[]; rejected: { op_id: string; reason: string }[] } {
  if (!Array.isArray(ops)) throw new Reject("ops debe ser una lista");
  if (ops.length > MAX_OPS) throw new Reject(`máximo ${MAX_OPS} operaciones por envío`);
  const applied: string[] = [];
  const rejected: { op_id: string; reason: string }[] = [];
  const seen = db.prepare("SELECT result FROM sync_ops WHERE user_id = ? AND op_id = ?");
  const mark = db.prepare("INSERT INTO sync_ops (user_id, op_id, result, applied_at) VALUES (?,?,?,?)");
  const foodBySlug = db.prepare("SELECT kcal, protein_g, carbs_g, fat_g FROM foods WHERE slug = ?");

  tx(db, () => {
    for (const raw of ops as Op[]) {
      const opId = str(raw?.op_id, 64);
      if (!opId) { rejected.push({ op_id: String(raw?.op_id ?? ""), reason: "op_id inválido" }); continue; }
      const prev = seen.get(userId, opId) as { result: string } | undefined;
      if (prev) {
        if (prev.result === "rejected") rejected.push({ op_id: opId, reason: "rechazada antes" });
        else applied.push(opId);
        continue;
      }
      try {
        // Un reloj adelantado no puede ganarle a cambios futuros
        const ts = Math.min(num(raw.ts, 0, Number.MAX_SAFE_INTEGER) ?? Date.now(), Date.now());
        const result = applyOne(db, userId, raw, ts, foodBySlug) ? "applied" : "stale";
        mark.run(userId, opId, result, Date.now());
        applied.push(opId);
      } catch (e) {
        if (!(e instanceof Reject)) throw e;
        mark.run(userId, opId, "rejected", Date.now());
        rejected.push({ op_id: opId, reason: e.message });
      }
    }
  });
  return { applied, rejected };
}

type Stmt = ReturnType<DB["prepare"]>;

/** Aplica una operación. Devuelve false si es más antigua que lo guardado (se ignora). */
function applyOne(db: DB, userId: string, op: Op, ts: number, foodBySlug: Stmt): boolean {
  const day = op.entity === "goals" ? null : str(op.day, 10);
  if (op.entity !== "goals" && (!day || !DAY_RE.test(day))) throw new Reject("day inválido");

  if (op.entity === "food" || op.entity === "exercise") {
    const id = str(op.id, 64);
    if (!id) throw new Reject("id inválido");
    const table = op.entity === "food" ? "meal_entries" : "workouts";
    const cur = db.prepare(`SELECT updated_at, deleted_at FROM ${table} WHERE user_id = ? AND id = ?`).get(userId, id) as
      { updated_at: number; deleted_at: number | null } | undefined;
    if (cur && (cur.updated_at > ts || (cur.deleted_at && cur.updated_at >= ts))) return false;
    const seq = nextSeq(db);

    if (op.type === "delete") {
      if (cur) db.prepare(`UPDATE ${table} SET deleted_at = ?, updated_at = ?, server_seq = ? WHERE user_id = ? AND id = ?`).run(ts, ts, seq, userId, id);
      else if (op.entity === "food") {
        // Borrado de algo que el servidor nunca vio: se guarda como lápida para que no reaparezca
        db.prepare(`INSERT INTO meal_entries (id, user_id, day, meal, label, kcal, protein_g, carbs_g, fat_g, updated_at, deleted_at, server_seq)
          VALUES (?,?,?,'snacks','',0,0,0,0,?,?,?)`).run(id, userId, day, ts, ts, seq);
      } else {
        db.prepare(`INSERT INTO workouts (id, user_id, day, label, minutes, kcal, updated_at, deleted_at, server_seq)
          VALUES (?,?,?,'',1,0,?,?,?)`).run(id, userId, day, ts, ts, seq);
      }
      return true;
    }

    const d = op.data || {};
    if (op.entity === "food") {
      const meal = str(d.meal, 20);
      if (!meal || !MEALS.has(meal)) throw new Reject("meal inválido");
      const label = str(d.name, 200);
      if (!label) throw new Reject("name inválido");
      const quick = d.quick ? 1 : 0;
      const slug = quick ? null : str(d.slug, 120);
      const grams = num(d.grams, 0, 20000);
      let kcal = num(d.kcal, 0, 20000), p = num(d.p, 0, 2000), c = num(d.c, 0, 4000), f = num(d.f, 0, 2000);
      const food = slug ? foodBySlug.get(slug) as { kcal: number; protein_g: number; carbs_g: number; fat_g: number } | undefined : undefined;
      if (food && grams != null) {
        const k = grams / 100;
        kcal = food.kcal * k; p = food.protein_g * k; c = food.carbs_g * k; f = food.fat_g * k;
      }
      if (kcal == null || p == null || c == null || f == null) throw new Reject("valores nutricionales inválidos");
      db.prepare(`INSERT INTO meal_entries (id, user_id, day, meal, slug, label, icon, qty, portion_label, portion_g, grams, unit,
          kcal, protein_g, carbs_g, fat_g, quick, updated_at, deleted_at, server_seq)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NULL,?)
        ON CONFLICT(user_id, id) DO UPDATE SET day=excluded.day, meal=excluded.meal, slug=excluded.slug, label=excluded.label,
          icon=excluded.icon, qty=excluded.qty, portion_label=excluded.portion_label, portion_g=excluded.portion_g,
          grams=excluded.grams, unit=excluded.unit, kcal=excluded.kcal, protein_g=excluded.protein_g, carbs_g=excluded.carbs_g,
          fat_g=excluded.fat_g, quick=excluded.quick, updated_at=excluded.updated_at, deleted_at=NULL, server_seq=excluded.server_seq`)
        .run(id, userId, day, meal, slug, label, str(d.icon, 16), num(d.qty, 0, 10000), str(d.portionLabel, 80),
          num(d.portionG, 0, 20000), grams, str(d.unit, 8), kcal, p, c, f, quick, ts, seq);
    } else {
      const label = str(d.name, 200);
      const minutes = num(d.minutes, 1, 1440), kcal = num(d.kcal, 0, 10000);
      if (!label || minutes == null || kcal == null) throw new Reject("ejercicio inválido");
      db.prepare(`INSERT INTO workouts (id, user_id, day, slug, label, icon, minutes, kcal, updated_at, deleted_at, server_seq)
        VALUES (?,?,?,?,?,?,?,?,?,NULL,?)
        ON CONFLICT(user_id, id) DO UPDATE SET day=excluded.day, slug=excluded.slug, label=excluded.label, icon=excluded.icon,
          minutes=excluded.minutes, kcal=excluded.kcal, updated_at=excluded.updated_at, deleted_at=NULL, server_seq=excluded.server_seq`)
        .run(id, userId, day, str(d.slug, 120), label, str(d.icon, 16), minutes, kcal, ts, seq);
    }
    return true;
  }

  if (op.entity === "weight") {
    const cur = db.prepare("SELECT updated_at FROM body_metrics WHERE user_id = ? AND metric = 'weight_kg' AND day = ?").get(userId, day) as
      { updated_at: number } | undefined;
    if (cur && cur.updated_at > ts) return false;
    const kg = op.type === "delete" ? 0 : num(op.data?.kg, 20, 400);
    if (op.type === "upsert" && kg == null) throw new Reject("peso inválido");
    const seq = nextSeq(db);
    db.prepare(`INSERT INTO body_metrics (user_id, day, metric, value, updated_at, deleted_at, server_seq) VALUES (?,?,'weight_kg',?,?,?,?)
      ON CONFLICT(user_id, metric, day) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at,
        deleted_at=excluded.deleted_at, server_seq=excluded.server_seq`)
      .run(userId, day, kg ?? 0, ts, op.type === "delete" ? ts : null, seq);
    return true;
  }

  if (op.entity === "goals") {
    const g = op.data || {};
    const kcal = num(g.kcal, 800, 8000), p = num(g.p, 0, 600), c = num(g.c, 0, 1200), f = num(g.f, 0, 400);
    if (kcal == null || p == null || c == null || f == null) throw new Reject("meta inválida");
    const cur = db.prepare("SELECT updated_at FROM goals WHERE user_id = ?").get(userId) as { updated_at: number } | undefined;
    if (cur && cur.updated_at > ts) return false;
    const data = JSON.stringify({ kcal, p, c, f, profile: g.profile && typeof g.profile === "object" ? g.profile : null });
    if (data.length > 2000) throw new Reject("meta demasiado grande");
    db.prepare(`INSERT INTO goals (user_id, data, updated_at, server_seq) VALUES (?,?,?,?)
      ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at, server_seq=excluded.server_seq`)
      .run(userId, data, ts, nextSeq(db));
    return true;
  }
  throw new Reject("entity desconocida");
}

/** Cambios del usuario con server_seq mayor a `since`, en el formato que usa el cliente. */
export function changesSince(db: DB, userId: string, since: number) {
  const foods = (db.prepare(`SELECT * FROM meal_entries WHERE user_id = ? AND server_seq > ? ORDER BY server_seq`).all(userId, since) as Record<string, any>[])
    .map(r => r.deleted_at ? { id: r.id, day: r.day, deleted: true } : {
      id: r.id, day: r.day, ts: r.updated_at,
      data: { meal: r.meal, slug: r.slug, name: r.label, icon: r.icon, qty: r.qty, portionLabel: r.portion_label, portionG: r.portion_g,
        grams: r.grams, unit: r.unit, kcal: r.kcal, p: r.protein_g, c: r.carbs_g, f: r.fat_g, ...(r.quick ? { quick: true } : {}) }
    });
  const exercises = (db.prepare(`SELECT * FROM workouts WHERE user_id = ? AND server_seq > ? ORDER BY server_seq`).all(userId, since) as Record<string, any>[])
    .map(r => r.deleted_at ? { id: r.id, day: r.day, deleted: true } : {
      id: r.id, day: r.day, ts: r.updated_at, data: { slug: r.slug, name: r.label, icon: r.icon, minutes: r.minutes, kcal: r.kcal }
    });
  const weights = (db.prepare(`SELECT day, value, deleted_at FROM body_metrics WHERE user_id = ? AND metric = 'weight_kg' AND server_seq > ?`).all(userId, since) as Record<string, any>[])
    .map(r => ({ day: r.day, kg: r.deleted_at ? 0 : r.value }));
  const g = db.prepare("SELECT data FROM goals WHERE user_id = ? AND server_seq > ?").get(userId, since) as { data: string } | undefined;
  const seq = (db.prepare("SELECT v FROM counters WHERE name = 'server_seq'").get() as { v: number }).v;
  return { foods, exercises, weights, goals: g ? JSON.parse(g.data) : null, seq };
}

export { Reject };
