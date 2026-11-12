/* =========================================================
 * T&M — núcleo compartido
 * Configuración, utilidades, layout (header/footer), modal y toast.
 * Cada página registra su inicializador en PAGES[<data-page>].
 * ========================================================= */

const APP = {
  name: "T&M",
  tagline: "Fitness",
  supportEmail: "soporte@tym.cl",
  /* Dirección de la API. Vacía = sin cuentas (el diario queda solo en el dispositivo).
     Al desplegar el backend, poner aquí su URL https. */
  apiBase: ["127.0.0.1", "localhost"].includes(location.hostname) ? "http://127.0.0.1:8787" : "",
  refWeightKg: 77,
  storage: {
    profile: "tm_profile",
    cookies: "tm_cookies"
  },
  meals: [
    { id: "desayuno", label: "Desayuno", icon: "☀️" },
    { id: "almuerzo", label: "Almuerzo", icon: "🍽️" },
    { id: "cena", label: "Cena", icon: "🌙" },
    { id: "snacks", label: "Snacks", icon: "🍎" }
  ]
};

const PAGES = {};

/* ---------------- Utilidades ---------------- */
function normalize(str) {
  return String(str).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
function slugify(str) {
  return normalize(str).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function fmt(n) {
  return Math.round(n || 0).toLocaleString("es-CL");
}
function fmt1(n) {
  const v = Math.round((n || 0) * 10) / 10;
  return v.toLocaleString("es-CL", { maximumFractionDigits: 1 });
}
function storageGet(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* sin almacenamiento */ }
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function qs(name) {
  return new URLSearchParams(location.search).get(name);
}
function mealById(id) {
  return APP.meals.find(m => m.id === id) || APP.meals[0];
}
/* Comida sugerida según la hora del día */
function suggestedMeal(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 11) return "desayuno";
  if (h >= 11 && h < 16) return "almuerzo";
  if (h >= 19 && h < 23) return "cena";
  return "snacks";
}

/* ---------- Fechas (formato YYYY-MM-DD en hora local) ---------- */
function toISODate(d) {
  const z = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
function fromISODate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function todayISO() { return toISODate(new Date()); }
function addDays(iso, n) {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}
function dayLabel(iso) {
  const t = todayISO();
  if (iso === t) return "Hoy";
  if (iso === addDays(t, -1)) return "Ayer";
  if (iso === addDays(t, 1)) return "Mañana";
  const s = fromISODate(iso).toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "short" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------------- Íconos SVG ---------------- */
const ICONS = {
  search: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  chevronDown: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  chevronLeft: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
  chevronRight: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  dots: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
  flame: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2c1 3.5 5 5.8 5 11a5 5 0 0 1-10 0c0-2.4 1.1-4 2.3-5.2.2 1.7 1 2.8 2.2 3.2C11 8.7 11.3 5.2 12 2z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  edit: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
  share: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5M5 14v5h14v-5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  users: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.8.7 3 2.4 3.5 5.2"/></svg>',
  sun: '<svg class="i-sun" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg class="i-moon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  plan: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  chart: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="4" y="11" width="4" height="9" rx="1.5"/><rect x="10" y="5" width="4" height="15" rx="1.5"/><rect x="16" y="8" width="4" height="12" rx="1.5"/></svg>'
};

/* ---------------- Tema claro / oscuro ---------------- */
// El <head> de cada página aplica el tema guardado antes de pintar (evita parpadeo).
function currentTheme() {
  const t = document.documentElement.dataset.theme;
  if (t === "light" || t === "dark") return t;
  return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem("tm_theme", theme); } catch (e) { /* sin almacenamiento */ }
  document.querySelectorAll(".theme-toggle").forEach(b => b.setAttribute("aria-label", theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"));
}
function themeToggleHtml() {
  const label = currentTheme() === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
  return `<button type="button" class="icon-btn theme-toggle" aria-label="${label}">${ICONS.moon}${ICONS.sun}</button>`;
}
function bindThemeToggles(root) {
  root.querySelectorAll(".theme-toggle").forEach(b =>
    b.addEventListener("click", () => setTheme(currentTheme() === "dark" ? "light" : "dark")));
}

/* ---------------- Componentes compartidos ---------------- */
function searchForm({ action = "explorar.html", placeholder = "Buscar alimento, receta o ejercicio", value = "", id = "" } = {}) {
  return `
    <form class="search" action="${action}" method="get" role="search" ${id ? `id="${id}"` : ""}>
      <span class="search-icon" aria-hidden="true">${ICONS.search}</span>
      <input type="search" name="q" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(value)}" aria-label="${escapeHtml(placeholder)}" autocomplete="off">
      <button class="btn btn-primary" type="submit">Buscar</button>
    </form>`;
}

function breadcrumb(items) {
  return `<nav class="breadcrumb" aria-label="Migas de pan">` +
    items.map((it, i) => i < items.length - 1
      ? `<a href="${it.href}">${escapeHtml(it.label)}</a><span aria-hidden="true">/</span>`
      : `<span aria-current="page">${escapeHtml(it.label)}</span>`).join("") +
    `</nav>`;
}

function ctaBlock({ title = `Registra tus comidas en ${APP.name}`, text = "Cuenta calorías y macros, guarda tus recetas y sigue tu progreso en un solo lugar.", href = "plan.html", label = "Comenzar" } = {}) {
  return `
    <section class="cta">
      <div class="cta-text">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(text)}</p>
      </div>
      <a class="btn btn-accent btn-lg" href="${href}">${escapeHtml(label)} ${ICONS.arrowRight}</a>
    </section>`;
}

/* ---------------- Toast ---------------- */
function toast(message, { actionLabel, actionHref, onAction, duration = 3500 } = {}) {
  let host = document.getElementById("toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-host";
    host.setAttribute("aria-live", "polite");
    document.body.appendChild(host);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<span class="toast-icon">${ICONS.check}</span><span>${escapeHtml(message)}</span>` +
    (actionLabel ? (onAction
      ? `<button type="button" class="toast-action">${escapeHtml(actionLabel)}</button>`
      : `<a href="${actionHref}">${escapeHtml(actionLabel)}</a>`) : "");
  const hide = () => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); };
  if (onAction) el.querySelector(".toast-action").addEventListener("click", () => { onAction(); hide(); });
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(hide, onAction ? Math.max(duration, 5000) : duration);
}

/* ---------------- Modal ---------------- */
function openModal({ title = "", content = "", size = "", onClose } = {}) {
  const lastFocus = document.activeElement;
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal ${size}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-head">
        <button type="button" class="icon-btn modal-back" aria-label="Volver" hidden>${ICONS.chevronLeft}</button>
        <h2 id="modal-title">${escapeHtml(title)}</h2>
        <button type="button" class="icon-btn modal-close" aria-label="Cerrar">${ICONS.close}</button>
      </div>
      <div class="modal-body">${content}</div>
    </div>`;
  document.body.appendChild(backdrop);
  document.body.classList.add("no-scroll");
  requestAnimationFrame(() => backdrop.classList.add("show"));

  function close() {
    backdrop.classList.remove("show");
    document.body.classList.remove("no-scroll");
    document.removeEventListener("keydown", onKey);
    setTimeout(() => backdrop.remove(), 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    if (onClose) onClose();
  }
  function onKey(e) { if (e.key === "Escape") close(); }

  backdrop.addEventListener("mousedown", e => { if (e.target === backdrop) close(); });
  backdrop.querySelector(".modal-close").addEventListener("click", close);
  document.addEventListener("keydown", onKey);

  const modal = backdrop.querySelector(".modal");
  return {
    el: modal,
    body: modal.querySelector(".modal-body"),
    back: modal.querySelector(".modal-back"),
    setTitle(t) { modal.querySelector("#modal-title").textContent = t; },
    close
  };
}

/* ---------------- Navegación principal ----------------
 * La barra del header es la barra de categorías principal del sitio.
 */
const MAIN_NAV = [
  { id: "alimentos", label: "Alimentos", icon: "🍎", href: "explorar.html?tipo=alimentos" },
  { id: "recetas", label: "Recetas", icon: "🍲", href: "explorar.html?tipo=recetas" },
  { id: "ejercicios", label: "Ejercicios", icon: "🏃", href: "explorar.html?tipo=ejercicios" },
  { id: "diario", label: "Mi diario", icon: "📒", href: "plan.html" }
];

function logoHtml() {
  return `
    <a class="logo" href="index.html" aria-label="${APP.name} inicio">
      <span class="logo-mark">${APP.name}</span>
      <span class="logo-text">${APP.tagline}</span>
    </a>`;
}

/* Marca la sección activa del menú (las páginas la actualizan al cambiar de pestaña) */
function setActiveNav(id) {
  document.querySelectorAll("[data-nav]").forEach(a => {
    const on = a.dataset.nav === id;
    a.classList.toggle("active", on);
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}

function renderHeader() {
  const el = document.getElementById("site-header");
  if (!el) return;
  const variant = el.dataset.variant || "site";

  if (variant === "app") {
    el.innerHTML = `
      <a class="skip-link" href="#main">Ir al contenido</a>
      <header class="app-header">
        <div class="container app-header-inner">
          ${logoHtml()}
          <nav class="app-tabs" role="tablist" aria-label="Secciones del diario">
            <a href="#plan" role="tab" data-tab="plan">${ICONS.plan}<span>Hoy</span></a>
            <a href="#progreso" role="tab" data-tab="progreso">${ICONS.chart}<span>Progreso</span></a>
          </nav>
          <div class="app-actions">
            <a class="btn btn-ghost btn-sm app-explore" href="explorar.html">${ICONS.search}<span>Explorar</span></a>
            ${themeToggleHtml()}
            <a class="btn btn-primary btn-sm app-login" href="login.html">Iniciar sesión</a>
          </div>
        </div>
      </header>`;
    bindThemeToggles(el);
    return;
  }

  el.innerHTML = `
    <a class="skip-link" href="#main">Ir al contenido</a>
    <div class="header-wrap">
      <header class="site-header">
        ${logoHtml()}
        <nav class="main-nav" id="main-nav" aria-label="Principal">
          ${MAIN_NAV.map(n => `<a class="nav-link" data-nav="${n.id}" href="${n.href}"><span class="nav-icon" aria-hidden="true">${n.icon}</span>${n.label}</a>`).join("")}
          <div class="nav-mobile-actions">
            <a class="btn btn-outline" href="login.html">Iniciar sesión</a>
            <a class="btn btn-primary" href="plan.html">Comenzar</a>
          </div>
        </nav>
        <div class="header-actions">
          ${themeToggleHtml()}
          <a class="btn btn-ghost" href="login.html">Iniciar sesión</a>
          <a class="btn btn-primary" href="plan.html">Comenzar</a>
        </div>
        <button class="menu-toggle" type="button" aria-label="Abrir menú" aria-controls="main-nav" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </header>
    </div>`;

  bindThemeToggles(el);
  const toggle = el.querySelector(".menu-toggle");
  const nav = el.querySelector(".main-nav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open);
    document.body.classList.toggle("no-scroll", open);
  });

  // Sección activa según la página
  const page = document.body.dataset.page;
  if (page === "explore") setActiveNav(qs("tipo") || "alimentos");
  if (page === "exercise") setActiveNav("ejercicios");
}

/* ---------------- Footer (una línea, sin duplicar el menú) ---------------- */
function renderFooter() {
  const el = document.getElementById("site-footer");
  if (!el) return;
  const year = new Date().getFullYear();
  el.innerHTML = `
    <footer class="site-footer">
      <div class="container footer-row">
        ${logoHtml()}
        <nav class="footer-links" aria-label="Pie de página">
          ${MAIN_NAV.map(n => `<a href="${n.href}">${n.label}</a>`).join("")}
          <a href="index.html#faq">Preguntas frecuentes</a>
          <a href="mailto:${APP.supportEmail}">Contacto</a>
        </nav>
        <span class="muted small">© ${year} ${APP.name}</span>
      </div>
    </footer>`;
}

/* ---------------- Cookies ---------------- */
function renderCookieBanner() {
  if (storageGet(APP.storage.cookies)) return;
  const bar = document.createElement("div");
  bar.className = "cookie-banner";
  bar.setAttribute("role", "dialog");
  bar.setAttribute("aria-label", "Aviso de cookies");
  bar.innerHTML = `
    <div class="cookie-text">
      <span class="cookie-icon" aria-hidden="true">🍪</span>
      <p>Utilizamos cookies y almacenamiento local para guardar tus preferencias y tu diario de alimentos en este dispositivo. Al hacer clic en "Aceptar", consientes su uso.</p>
    </div>
    <div class="cookie-actions">
      <button class="btn btn-outline" data-v="deny">Denegar</button>
      <button class="btn btn-primary" data-v="accept">Aceptar</button>
    </div>`;
  bar.addEventListener("click", e => {
    const v = e.target.dataset && e.target.dataset.v;
    if (!v) return;
    storageSet(APP.storage.cookies, v);
    bar.remove();
  });
  document.body.appendChild(bar);
}

/* ---------------- Paginación ---------------- */
function paginationHtml(current, total) {
  const btn = (p, label, opts = {}) =>
    `<button type="button" class="page-btn ${opts.active ? "active" : ""} ${opts.wide ? "wide" : ""}" data-page="${p}" ${opts.disabled ? "disabled" : ""} ${opts.active ? 'aria-current="page"' : ""}>${label}</button>`;
  const nums = new Set([1, total, current - 1, current, current + 1].filter(n => n >= 1 && n <= total));
  const sorted = [...nums].sort((a, b) => a - b);
  let out = btn(current - 1, "‹ Anterior", { disabled: current === 1, wide: true });
  let prev = 0;
  sorted.forEach(n => {
    if (n - prev > 1) out += `<span class="page-gap">…</span>`;
    out += btn(n, n, { active: n === current });
    prev = n;
  });
  out += btn(current + 1, "Siguiente ›", { disabled: current === total, wide: true });
  return out;
}

/* ---------------- Arranque ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  renderCookieBanner();
  const page = document.body.dataset.page;
  if (PAGES[page]) PAGES[page]();
});

/* App instalable y uso sin conexión (solo en https o localhost) */
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "127.0.0.1" || location.hostname === "localhost")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
