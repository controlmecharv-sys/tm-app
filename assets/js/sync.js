/* =========================================================
 * T&M — Cuenta y sincronización con el servidor
 * - Sin sesión: no hace nada; el diario sigue solo en este dispositivo.
 * - Con sesión: cada cambio del Store entra a una cola local (outbox) y se envía
 *   en lotes. Si no hay conexión, la cola espera y se envía al volver.
 * ========================================================= */
const Auth = {
  KEY: "tm_auth",
  get() { return storageGet(this.KEY); },          // { token, user: { id, email }, seq, lastSync }
  set(a) { storageSet(this.KEY, a); },
  clear() { try { localStorage.removeItem(this.KEY); localStorage.removeItem(Sync.OUTBOX); } catch (e) { /* sin almacenamiento */ } },
  enabled() { return !!APP.apiBase; }
};

async function api(path, { method = "GET", body } = {}) {
  const a = Auth.get();
  const res = await fetch(APP.apiBase + path, {
    method,
    headers: { "Content-Type": "application/json", ...(a && a.token ? { Authorization: "Bearer " + a.token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.error) || "No pudimos conectar con el servidor");
    err.status = res.status;
    throw err;
  }
  return data;
}

const Sync = (() => {
  const OUTBOX = "tm_outbox";
  const BATCH = 400;
  let timer = null, running = false, again = false;
  const listeners = new Set();

  const outbox = () => storageGet(OUTBOX) || [];
  const notify = () => listeners.forEach(fn => fn(status()));

  function status() {
    const a = Auth.get();
    return { loggedIn: !!a, pending: outbox().length, lastSync: a && a.lastSync, running };
  }

  function enqueue(op) {
    if (!Auth.get()) return;
    const box = outbox();
    box.push({ op_id: uid() + uid(), ...op });
    storageSet(OUTBOX, box);
    schedule();
  }

  function schedule(delay = 800) {
    if (!Auth.enabled() || !Auth.get()) return;
    clearTimeout(timer);
    timer = setTimeout(run, delay);
  }

  async function run() {
    const a = Auth.get();
    if (!a || !Auth.enabled()) return;
    if (running) { again = true; return; }
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    running = true; notify();
    try {
      const batch = outbox().slice(0, BATCH);
      const r = await api("/v1/sync", { method: "POST", body: { since: a.seq || 0, ops: batch } });
      const done = new Set(r.applied.concat(r.rejected.map(x => x.op_id)));
      const left = outbox().filter(op => !done.has(op.op_id));
      storageSet(OUTBOX, left);
      // Lo que aún está pendiente localmente no se pisa con la versión del servidor
      const pendingIds = new Set(left.map(op => op.entity === "goals" ? "goals" : op.id).filter(Boolean));
      Store.applyRemote(r.changes, pendingIds);
      Auth.set({ ...Auth.get(), seq: r.changes.seq, lastSync: Date.now() });
      if (left.length) again = true;
    } catch (e) {
      if (e.status === 401) { Auth.clear(); toast("Tu sesión venció. Vuelve a iniciar sesión para sincronizar."); }
      else schedule(15000); // sin conexión o error del servidor: reintentar
    } finally {
      running = false; notify();
      if (again) { again = false; schedule(50); }
    }
  }

  /* Primera sincronización tras iniciar sesión: sube todo lo local y baja todo lo del servidor */
  async function firstSync() {
    storageSet(OUTBOX, outbox().concat(Store.snapshotOps().map(op => ({ op_id: uid() + uid(), ...op }))));
    Auth.set({ ...Auth.get(), seq: 0 });
    for (let i = 0; i < 50 && Auth.get(); i++) {   // en lotes, hasta vaciar la cola
      await run();
      if (!outbox().length) break;
    }
  }

  Store.onOp(enqueue);
  window.addEventListener("online", () => schedule(0));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") schedule(0); });

  return { OUTBOX, run, schedule, firstSync, status, onStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); } };
})();

/* Al cargar: con sesión, sincronizar y cambiar "Iniciar sesión" por "Mi cuenta" */
document.addEventListener("DOMContentLoaded", () => {
  if (!Auth.get()) return;
  document.querySelectorAll('a[href="login.html"]').forEach(a => { a.textContent = "Mi cuenta"; });
  Sync.schedule(0);
});
