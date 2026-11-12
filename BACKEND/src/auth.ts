import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { DB } from "./db.ts";
import type { Config } from "./config.ts";

export const CONSENT_VERSION = "2026-11-12";
const LINK_TTL_MS = 15 * 60 * 1000;           // el enlace de acceso dura 15 minutos
const SESSION_TTL_MS = 180 * 24 * 3600 * 1000; // la sesión dura 180 días

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const token = () => randomBytes(32).toString("base64url");

export interface User { id: string; email: string }

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
export function validEmail(email: unknown): email is string {
  return typeof email === "string" && email.length <= 254 && EMAIL_RE.test(email);
}

/** Crea un enlace de acceso de un solo uso. Devuelve el token en claro (solo para enviarlo por correo). */
export function createLoginToken(db: DB, email: string, consent: boolean): string {
  const t = token();
  db.prepare("INSERT INTO login_tokens (token_hash, email, consent_v, expires_at) VALUES (?,?,?,?)")
    .run(sha256(t), email.trim().toLowerCase(), consent ? CONSENT_VERSION : null, Date.now() + LINK_TTL_MS);
  return t;
}

/** Canjea el enlace por una sesión. Crea el usuario si no existe. */
export function verifyLoginToken(db: DB, t: string): { session: string; user: User } | null {
  const now = Date.now();
  const row = db.prepare("SELECT email, consent_v, expires_at, used_at FROM login_tokens WHERE token_hash = ?")
    .get(sha256(t)) as { email: string; consent_v: string | null; expires_at: number; used_at: number | null } | undefined;
  if (!row || row.used_at || row.expires_at < now) return null;
  db.prepare("UPDATE login_tokens SET used_at = ? WHERE token_hash = ?").run(now, sha256(t));

  let user = db.prepare("SELECT id, email FROM users WHERE email = ? AND deleted_at IS NULL").get(row.email) as User | undefined;
  if (!user) {
    // Una cuenta eliminada se libera: se reemplaza por una nueva vacía
    db.prepare("DELETE FROM users WHERE email = ? AND deleted_at IS NOT NULL").run(row.email);
    user = { id: randomUUID(), email: row.email };
    db.prepare("INSERT INTO users (id, email, created_at) VALUES (?,?,?)").run(user.id, user.email, now);
  }
  if (row.consent_v) {
    db.prepare("INSERT OR IGNORE INTO consents (user_id, purpose, version, granted_at) VALUES (?,?,?,?)")
      .run(user.id, "health_data", row.consent_v, now);
  }
  const session = token();
  db.prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?,?,?,?)")
    .run(sha256(session), user.id, now, now + SESSION_TTL_MS);
  return { session, user: { id: user.id, email: user.email } };
}

export function userFromSession(db: DB, authHeader: string | undefined): User | null {
  const m = /^Bearer (\S+)$/.exec(authHeader || "");
  if (!m) return null;
  return (db.prepare(`SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.deleted_at IS NULL`).get(sha256(m[1]), Date.now()) as User | undefined) || null;
}

export function revokeSession(db: DB, authHeader: string | undefined): void {
  const m = /^Bearer (\S+)$/.exec(authHeader || "");
  if (m) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(m[1]));
}

/** Envía el enlace por correo con Resend; sin clave configurada, lo deja en el registro (modo desarrollo). */
export async function sendLoginEmail(cfg: Config, email: string, link: string): Promise<void> {
  if (!cfg.resendApiKey) {
    console.log(`[dev] Enlace de acceso para ${email}: ${link}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: cfg.mailFrom,
      to: [email],
      subject: "Tu enlace para entrar a T&M",
      text: `Hola:\n\nUsa este enlace para entrar a T&M. Vence en 15 minutos y sirve una sola vez.\n\n${link}\n\nSi no lo pediste, ignora este correo.`
    })
  });
  if (!res.ok) throw new Error(`Resend respondió ${res.status}`);
}

/** Límite simple en memoria: máximo n eventos por clave en la ventana. */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  private n: number;
  private windowMs: number;
  constructor(n: number, windowMs: number) { this.n = n; this.windowMs = windowMs; }
  allow(key: string): boolean {
    const now = Date.now();
    const list = (this.hits.get(key) || []).filter(t => now - t < this.windowMs);
    if (list.length >= this.n) { this.hits.set(key, list); return false; }
    list.push(now);
    this.hits.set(key, list);
    return true;
  }
}
