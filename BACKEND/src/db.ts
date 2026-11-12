import { DatabaseSync } from "node:sqlite";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));

export type DB = DatabaseSync;

export function openDb(path: string): DB {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");
  db.exec(readFileSync(join(here, "schema.sql"), "utf8"));
  return db;
}

/** Siguiente número de secuencia global (orden de cambios para sincronizar). */
export function nextSeq(db: DB): number {
  const row = db.prepare("UPDATE counters SET v = v + 1 WHERE name = 'server_seq' RETURNING v").get() as { v: number };
  return row.v;
}

/** Ejecuta fn dentro de una transacción. */
export function tx<T>(db: DB, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const out = fn();
    db.exec("COMMIT");
    return out;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

interface WebItem {
  type: "food" | "recipe";
  slug: string; name: string; cat: string; icon: string; unit?: string;
  per100: Record<string, number>;
  portions: { label: string; g: number }[];
}

/**
 * Carga alimentos y recetas desde los archivos de datos del sitio (web/assets/js),
 * usando el mismo código que calcula los valores en el navegador. Así cliente y
 * servidor usan exactamente los mismos números.
 */
export function loadWebItems(webJsDir: string): WebItem[] {
  const files = ["data/alimentos.js", "data/alimentos-cl.js", "data/recetas.js", "core.js", "nutrition.js"];
  const stub = { getItem: () => null, setItem: () => {} };
  const ctx: Record<string, unknown> = { console, localStorage: stub, location: {}, navigator: {}, window: { addEventListener() {} }, document: { addEventListener() {} } };
  vm.createContext(ctx);
  for (const f of files) {
    const p = join(webJsDir, f);
    if (!existsSync(p)) throw new Error("No se encontró " + p);
    // const/let de nivel superior no quedan en el contexto; se convierten a var
    vm.runInContext(readFileSync(p, "utf8").replace(/^(const|let) /gm, "var "), ctx, { filename: f });
  }
  return ctx.ITEMS as WebItem[];
}

/** Inserta o actualiza los alimentos; sube la revisión solo si cambian los valores. */
export function seedFoods(db: DB, webJsDir: string): number {
  const items = loadWebItems(webJsDir);
  const now = Date.now();
  const get = db.prepare("SELECT id, kcal, protein_g, carbs_g, fat_g FROM foods WHERE slug = ?");
  const ins = db.prepare(`INSERT INTO foods (slug, kind, name, category, icon, unit, kcal, protein_g, carbs_g, fat_g,
      fiber_g, sugar_g, sat_fat_g, sodium_mg, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id`);
  const upd = db.prepare(`UPDATE foods SET name=?, category=?, icon=?, unit=?, kcal=?, protein_g=?, carbs_g=?, fat_g=?,
      fiber_g=?, sugar_g=?, sat_fat_g=?, sodium_mg=?, revision = revision + 1, updated_at=? WHERE id=?`);
  const delPor = db.prepare("DELETE FROM portions WHERE food_id = ?");
  const insPor = db.prepare("INSERT OR REPLACE INTO portions (food_id, label, grams, sort) VALUES (?,?,?,?)");
  const delFts = db.prepare("DELETE FROM food_fts WHERE rowid = ?");
  const insFts = db.prepare("INSERT INTO food_fts (rowid, name, category) VALUES (?,?,?)");
  const r = (x: number | undefined) => (x == null || Number.isNaN(x) ? null : Math.round(x * 100) / 100);

  return tx(db, () => {
    let changed = 0;
    for (const it of items) {
      const n = it.per100;
      const vals = [r(n.kcal) ?? 0, r(n.p) ?? 0, r(n.c) ?? 0, r(n.f) ?? 0, r(n.fiber), r(n.sugar), r(n.satfat), r(n.sodium)];
      const kind = it.type === "recipe" ? "recipe" : "generic";
      const row = get.get(it.slug) as { id: number; kcal: number; protein_g: number; carbs_g: number; fat_g: number } | undefined;
      let id: number;
      if (!row) {
        id = (ins.get(it.slug, kind, it.name, it.cat, it.icon, it.unit || "g", ...vals, now) as { id: number }).id;
        changed++;
      } else {
        id = row.id;
        const same = row.kcal === vals[0] && row.protein_g === vals[1] && row.carbs_g === vals[2] && row.fat_g === vals[3];
        if (!same) { upd.run(it.name, it.cat, it.icon, it.unit || "g", ...vals, now, id); changed++; }
        delFts.run(id);
      }
      insFts.run(id, it.name, it.cat);
      delPor.run(id);
      it.portions.forEach((p, i) => insPor.run(id, p.label, p.g, i));
    }
    return changed;
  });
}
