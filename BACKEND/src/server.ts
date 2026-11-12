import { createServer } from "node:http";
import { loadConfig } from "./config.ts";
import { openDb, seedFoods } from "./db.ts";
import { createApp } from "./app.ts";

const cfg = loadConfig();
const db = openDb(cfg.dbPath);
const changed = seedFoods(db, cfg.webJsDir);
console.log(`Base de alimentos lista (${changed} nuevos o actualizados)`);
if (cfg.devLinks) console.log("Modo desarrollo: los enlaces de acceso se muestran aquí y en la respuesta");

// Limpieza diaria: enlaces y sesiones vencidas, y registro de operaciones de más de 90 días
const cleanup = () => {
  const now = Date.now();
  db.prepare("DELETE FROM login_tokens WHERE expires_at < ?").run(now - 86400_000);
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);
  db.prepare("DELETE FROM sync_ops WHERE applied_at < ?").run(now - 90 * 86400_000);
};
cleanup();
setInterval(cleanup, 86400_000).unref();

createServer(createApp(db, cfg)).listen(cfg.port, () => {
  console.log(`API de T&M en http://127.0.0.1:${cfg.port}`);
});
