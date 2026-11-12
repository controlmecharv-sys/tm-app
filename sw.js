/*
 * Service worker de T&M: permite abrir la app sin conexión.
 * - Páginas HTML: red primero (siempre la versión nueva); si no hay red, la copia guardada.
 * - CSS, JS, íconos y fuentes: copia guardada primero, se actualiza en segundo plano.
 * Al cambiar archivos, subir VERSION para que los teléfonos descarguen la nueva versión.
 */
const VERSION = "tm-v2";
const CORE = [
  "./", "index.html", "plan.html", "login.html", "explorar.html", "alimento.html", "ejercicio.html",
  "manifest.webmanifest",
  "assets/css/styles.css",
  "assets/js/data/alimentos.js", "assets/js/data/alimentos-cl.js", "assets/js/data/recetas.js", "assets/js/data/ejercicios.js",
  "assets/js/core.js", "assets/js/nutrition.js", "assets/js/store.js", "assets/js/sync.js", "assets/js/pages/login.js",
  "assets/js/pages/home.js", "assets/js/pages/plan.js", "assets/js/pages/explorar.js",
  "assets/js/pages/alimentos.js", "assets/js/pages/ejercicios.js",
  "assets/icons/icon-192.png", "assets/icons/favicon-32.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return;

  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("plan.html"))));
    return;
  }

  e.respondWith(caches.match(req).then(cached => {
    const net = fetch(req).then(res => {
      if (res.ok || res.type === "opaque") caches.open(VERSION).then(c => c.put(req, res.clone()));
      return res;
    }).catch(() => cached);
    return cached || net;
  }));
});
