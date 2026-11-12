import type { IncomingMessage, ServerResponse } from "node:http";
import type { DB } from "./db.ts";
import type { Config } from "./config.ts";
import {
  createLoginToken, verifyLoginToken, userFromSession, revokeSession, sendLoginEmail,
  validEmail, RateLimiter, CONSENT_VERSION, type User
} from "./auth.ts";
import { applyOps, changesSince, Reject } from "./sync.ts";

const MAX_BODY = 512 * 1024;

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

async function readJson(req: IncomingMessage): Promise<any> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new HttpError(413, "Solicitud demasiado grande");
    chunks.push(chunk);
  }
  if (!size) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new HttpError(400, "JSON inválido"); }
}

/** Crea el manejador HTTP. Separado del servidor para poder probarlo. */
export function createApp(db: DB, cfg: Config) {
  const linkByIp = new RateLimiter(20, 3600_000);
  const linkByEmail = new RateLimiter(5, 3600_000);
  const verifyByIp = new RateLimiter(30, 600_000);
  const syncByUser = new RateLimiter(60, 60_000);

  function send(res: ServerResponse, status: number, body?: unknown, extra: Record<string, string> = {}) {
    const data = body === undefined ? "" : JSON.stringify(body);
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra });
    res.end(data);
  }

  function requireUser(req: IncomingMessage): User {
    const u = userFromSession(db, req.headers.authorization);
    if (!u) throw new HttpError(401, "Sesión inválida o vencida");
    return u;
  }

  const ip = (req: IncomingMessage) =>
    (String(req.headers["x-forwarded-for"] || "").split(",")[0].trim()) || req.socket.remoteAddress || "?";

  return async function handle(req: IncomingMessage, res: ServerResponse) {
    const started = Date.now();
    const url = new URL(req.url || "/", "http://x");
    const origin = req.headers.origin;
    const cors: Record<string, string> = {};
    if (origin && cfg.allowedOrigins.includes(origin)) {
      cors["Access-Control-Allow-Origin"] = origin;
      cors["Vary"] = "Origin";
    }
    const route = `${req.method} ${url.pathname}`;
    try {
      if (req.method === "OPTIONS") {
        res.writeHead(204, { ...cors, "Access-Control-Allow-Methods": "GET,POST,DELETE",
          "Access-Control-Allow-Headers": "Authorization,Content-Type", "Access-Control-Max-Age": "86400" });
        return res.end();
      }

      switch (route) {
        case "GET /health":
          return send(res, 200, { ok: true }, cors);

        // ---------- Acceso por enlace al correo ----------
        case "POST /v1/auth/request": {
          const body = await readJson(req);
          const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
          if (!validEmail(email)) throw new HttpError(400, "Escribe un correo válido");
          if (body.consent !== true) throw new HttpError(400, "Debes aceptar el tratamiento de tus datos para crear la cuenta");
          if (!linkByIp.allow(ip(req)) || !linkByEmail.allow(email)) throw new HttpError(429, "Demasiados intentos. Espera unos minutos.");
          const t = createLoginToken(db, email, true);
          const link = `${cfg.appUrl}/login.html?token=${t}`;
          await sendLoginEmail(cfg, email, link);
          return send(res, 200, { sent: true, ...(cfg.devLinks ? { dev_link: link } : {}) }, cors);
        }
        case "POST /v1/auth/verify": {
          if (!verifyByIp.allow(ip(req))) throw new HttpError(429, "Demasiados intentos. Espera unos minutos.");
          const body = await readJson(req);
          const out = typeof body.token === "string" ? verifyLoginToken(db, body.token) : null;
          if (!out) throw new HttpError(400, "El enlace no es válido o ya venció. Pide uno nuevo.");
          return send(res, 200, { token: out.session, user: out.user }, cors);
        }
        case "POST /v1/auth/logout":
          revokeSession(db, req.headers.authorization);
          return send(res, 204, undefined, cors);

        // ---------- Cuenta ----------
        case "GET /v1/me": {
          const u = requireUser(req);
          return send(res, 200, { user: u, consent_version: CONSENT_VERSION }, cors);
        }
        case "GET /v1/me/export": {
          const u = requireUser(req);
          const q = (sql: string) => db.prepare(sql).all(u.id);
          return send(res, 200, {
            exported_at: new Date().toISOString(),
            user: db.prepare("SELECT id, email, created_at FROM users WHERE id = ?").get(u.id),
            consents: q("SELECT purpose, version, granted_at, revoked_at FROM consents WHERE user_id = ?"),
            goals: q("SELECT data, updated_at FROM goals WHERE user_id = ?"),
            meal_entries: q("SELECT day, meal, label, qty, portion_label, grams, kcal, protein_g, carbs_g, fat_g, updated_at FROM meal_entries WHERE user_id = ? AND deleted_at IS NULL ORDER BY day"),
            workouts: q("SELECT day, label, minutes, kcal, updated_at FROM workouts WHERE user_id = ? AND deleted_at IS NULL ORDER BY day"),
            weights: q("SELECT day, value AS kg FROM body_metrics WHERE user_id = ? AND deleted_at IS NULL ORDER BY day")
          }, { ...cors, "Content-Disposition": 'attachment; filename="tm-mis-datos.json"' });
        }
        case "DELETE /v1/me": {
          const u = requireUser(req);
          // Borrado inmediato y completo (en cascada): diario, peso, metas, sesiones y consentimientos
          db.prepare("DELETE FROM sync_ops WHERE user_id = ?").run(u.id);
          db.prepare("DELETE FROM users WHERE id = ?").run(u.id);
          return send(res, 204, undefined, cors);
        }

        // ---------- Sincronización ----------
        case "POST /v1/sync": {
          const u = requireUser(req);
          if (!syncByUser.allow(u.id)) throw new HttpError(429, "Demasiadas sincronizaciones seguidas");
          const body = await readJson(req);
          const since = Number.isInteger(body.since) && body.since >= 0 ? body.since : 0;
          const result = applyOps(db, u.id, body.ops ?? []);
          return send(res, 200, { ...result, changes: changesSince(db, u.id, since) }, cors);
        }

        // ---------- Alimentos ----------
        case "GET /v1/foods/search": {
          const q = (url.searchParams.get("q") || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
            .replace(/[^a-z0-9ñ ]/g, " ").trim();
          if (q.length < 2) return send(res, 200, { items: [] }, cors);
          const match = q.split(/\s+/).map(t => `"${t}"*`).join(" ");
          const items = db.prepare(`SELECT f.slug, f.name, f.category, f.icon, f.kcal, f.protein_g, f.carbs_g, f.fat_g
            FROM food_fts JOIN foods f ON f.id = food_fts.rowid WHERE food_fts MATCH ? ORDER BY bm25(food_fts, 10.0, 1.0) LIMIT 20`).all(match);
          return send(res, 200, { items }, { ...cors, "Cache-Control": "public, max-age=60" });
        }
      }
      throw new HttpError(404, "Ruta no encontrada");
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: e.message }, cors);
      if (e instanceof Reject) return send(res, 400, { error: e.message }, cors);
      console.error(`[error] ${route}`, e);
      return send(res, 500, { error: "Error interno" }, cors);
    } finally {
      // Registro sin datos personales: ruta, estado y duración
      if (process.env.LOG_REQUESTS !== "0") console.log(`${new Date().toISOString()} ${route} ${res.statusCode} ${Date.now() - started}ms`);
    }
  };
}
