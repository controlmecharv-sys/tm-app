import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export interface Config {
  port: number;
  dbPath: string;
  webJsDir: string;          // carpeta web/assets/js (datos de alimentos)
  appUrl: string;            // dirección del sitio, para armar el enlace de acceso
  allowedOrigins: string[];
  resendApiKey: string;      // vacío = modo desarrollo (el enlace se muestra en la consola)
  mailFrom: string;
  devLinks: boolean;         // devolver el enlace en la respuesta (solo desarrollo)
}

export function loadConfig(env = process.env): Config {
  const resendApiKey = env.RESEND_API_KEY || "";
  return {
    port: Number(env.PORT || 8787),
    dbPath: env.DB_PATH || join(root, "data", "tm.db"),
    webJsDir: env.WEB_JS_DIR || join(root, "..", "web", "assets", "js"),
    appUrl: (env.APP_URL || "http://127.0.0.1:5500").replace(/\/$/, ""),
    allowedOrigins: (env.ALLOWED_ORIGINS ||
      "http://127.0.0.1:5500,http://localhost:5500,https://controlmecharv-sys.github.io").split(",").map(s => s.trim()),
    resendApiKey,
    mailFrom: env.MAIL_FROM || "T&M <onboarding@resend.dev>",
    devLinks: !resendApiKey && env.NODE_ENV !== "production"
  };
}
