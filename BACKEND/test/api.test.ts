import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { loadConfig } from "../src/config.ts";
import { openDb, seedFoods } from "../src/db.ts";
import { createApp } from "../src/app.ts";

process.env.LOG_REQUESTS = "0";
const cfg = { ...loadConfig({}), dbPath: ":memory:", devLinks: true, resendApiKey: "" };
const origLog = console.log;
let server: Server;
let base = "";

before(async () => {
  console.log = () => {};
  const db = openDb(":memory:");
  seedFoods(db, cfg.webJsDir);
  server = createServer(createApp(db, cfg));
  await new Promise<void>(r => server.listen(0, r));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
after(() => { server.close(); console.log = origLog; });

const call = async (method: string, path: string, body?: unknown, token?: string) => {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};

async function login(email: string): Promise<string> {
  const r = await call("POST", "/v1/auth/request", { email, consent: true });
  assert.equal(r.status, 200);
  const token = new URL(r.body.dev_link).searchParams.get("token");
  const v = await call("POST", "/v1/auth/verify", { token });
  assert.equal(v.status, 200);
  return v.body.token;
}

const today = "2026-11-12";
const banana = (id: string, ts: number) => ({
  op_id: "op-" + id + "-" + ts, entity: "food", type: "upsert", id, day: today, ts,
  // kcal falsas a propósito: el servidor debe recalcular desde la base (plátano 89 kcal/100 g)
  data: { meal: "desayuno", slug: "platano", name: "Plátano", icon: "🍌", qty: 2, portionLabel: "mediano", portionG: 130, grams: 260, unit: "g", kcal: 9999, p: 1, c: 1, f: 1 }
});

test("pide consentimiento y correo válido", async () => {
  assert.equal((await call("POST", "/v1/auth/request", { email: "malo" , consent: true })).status, 400);
  assert.equal((await call("POST", "/v1/auth/request", { email: "a@b.cl" })).status, 400);
});

test("el enlace sirve una sola vez", async () => {
  const r = await call("POST", "/v1/auth/request", { email: "once@test.cl", consent: true });
  const token = new URL(r.body.dev_link).searchParams.get("token");
  assert.equal((await call("POST", "/v1/auth/verify", { token })).status, 200);
  assert.equal((await call("POST", "/v1/auth/verify", { token })).status, 400);
});

test("sin sesión no hay acceso", async () => {
  assert.equal((await call("POST", "/v1/sync", { ops: [] })).status, 401);
  assert.equal((await call("GET", "/v1/me", undefined, "inventado")).status, 401);
});

test("sincroniza entre dos dispositivos y recalcula las calorías", async () => {
  const phone = await login("wladi@test.cl");
  const laptop = await login("WLADI@test.cl");   // mismo usuario, otro dispositivo

  const up = await call("POST", "/v1/sync", { since: 0, ops: [banana("e1", Date.now() - 1000)] }, phone);
  assert.equal(up.status, 200);
  assert.deepEqual(up.body.applied.length, 1);

  const down = await call("POST", "/v1/sync", { since: 0, ops: [] }, laptop);
  const e = down.body.changes.foods.find((f: any) => f.id === "e1");
  assert.ok(e, "el otro dispositivo recibe el registro");
  assert.equal(Math.round(e.data.kcal), 231, "2 plátanos (260 g) = 231 kcal, no 9999");
});

test("una operación repetida se aplica una sola vez", async () => {
  const t = await login("idem@test.cl");
  const op = banana("e2", Date.now() - 1000);
  await call("POST", "/v1/sync", { ops: [op] }, t);
  const again = await call("POST", "/v1/sync", { ops: [op] }, t);
  assert.deepEqual(again.body.applied, [op.op_id]);
  const all = await call("POST", "/v1/sync", { since: 0, ops: [] }, t);
  assert.equal(all.body.changes.foods.filter((f: any) => f.id === "e2").length, 1);
});

test("gana el cambio más reciente y el borrado se propaga", async () => {
  const t = await login("lww@test.cl");
  const now = Date.now();
  await call("POST", "/v1/sync", { ops: [banana("e3", now - 5000)] }, t);
  const { body: s1 } = await call("POST", "/v1/sync", { since: 0, ops: [] }, t);
  // Borrado reciente, luego llega una edición vieja (de un teléfono que estuvo sin conexión)
  await call("POST", "/v1/sync", { ops: [{ op_id: "del-e3", entity: "food", type: "delete", id: "e3", day: today, ts: now - 1000 }] }, t);
  await call("POST", "/v1/sync", { ops: [{ ...banana("e3", now - 3000), op_id: "old-edit" }] }, t);
  const { body } = await call("POST", "/v1/sync", { since: s1.changes.seq, ops: [] }, t);
  assert.deepEqual(body.changes.foods.filter((f: any) => f.id === "e3"), [{ id: "e3", day: today, deleted: true }]);
});

test("rechaza datos inválidos sin romper el resto", async () => {
  const t = await login("bad@test.cl");
  const r = await call("POST", "/v1/sync", { ops: [
    { op_id: "x1", entity: "food", type: "upsert", id: "z", day: "ayer", ts: 1, data: {} },
    { op_id: "x2", entity: "weight", type: "upsert", day: today, ts: Date.now(), data: { kg: 82.5 } },
    { op_id: "x3", entity: "goals", type: "upsert", ts: Date.now(), data: { kcal: 100, p: 1, c: 1, f: 1 } }
  ] }, t);
  assert.deepEqual(r.body.applied, ["x2"]);
  assert.deepEqual(r.body.rejected.map((x: any) => x.op_id), ["x1", "x3"]);
  assert.deepEqual(r.body.changes.weights, [{ day: today, kg: 82.5 }]);
});

test("un usuario no ve los datos de otro", async () => {
  const a = await login("a@test.cl");
  const b = await login("b@test.cl");
  await call("POST", "/v1/sync", { ops: [banana("privado", Date.now() - 1000)] }, a);
  const { body } = await call("POST", "/v1/sync", { since: 0, ops: [] }, b);
  assert.equal(body.changes.foods.length, 0);
});

test("exportar y eliminar la cuenta", async () => {
  const t = await login("borrar@test.cl");
  await call("POST", "/v1/sync", { ops: [banana("e9", Date.now() - 1000)] }, t);
  const ex = await call("GET", "/v1/me/export", undefined, t);
  assert.equal(ex.body.meal_entries.length, 1);
  assert.equal((await call("DELETE", "/v1/me", undefined, t)).status, 204);
  assert.equal((await call("GET", "/v1/me", undefined, t)).status, 401);
  const t2 = await login("borrar@test.cl");
  const { body } = await call("POST", "/v1/sync", { since: 0, ops: [] }, t2);
  assert.equal(body.changes.foods.length, 0, "la cuenta nueva parte vacía");
});

test("busca alimentos sin tildes", async () => {
  const r = await call("GET", "/v1/foods/search?q=charquican");
  assert.equal(r.body.items[0].name, "Charquicán");
});
