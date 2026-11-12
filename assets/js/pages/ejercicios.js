/* =========================================================
 * Ejercicios: modelo + ficha (ejercicio.html). El listado vive en explorar.html
 * ========================================================= */

const EXERCISES = RAW_EXERCISES.map(([name, cat, met, icon, group]) => ({
  name, cat, met,
  icon: icon || CATEGORY_ICONS[cat] || "⭐",
  group: group || null,
  slug: slugify(name),
  kcalH: Math.round(met * APP.refWeightKg)
})).sort((a, b) => a.name.localeCompare(b.name, "es"));

const EX_BY_SLUG = Object.fromEntries(EXERCISES.map(e => [e.slug, e]));
const EX_CATEGORIES = Object.keys(CATEGORY_ICONS).filter(c => EXERCISES.some(e => e.cat === c));

function exerciseUrl(ex) { return "ejercicio.html?e=" + encodeURIComponent(ex.slug); }

function searchExercises(query) {
  const q = normalize((query || "").trim());
  if (!q) return EXERCISES.slice();
  const terms = q.split(/\s+/);
  return EXERCISES.filter(e => terms.every(t => normalize(e.name + " " + e.cat).includes(t)));
}

/* kcal = MET × peso × horas (ajuste opcional por metabolismo basal) */
const DEFAULT_EX_PROFILE = { units: "metric", weight: 77, age: 30, height: 170, sex: "M" };
function exBmr(kg, cm, age, sex) { return 10 * kg + 6.25 * cm - 5 * age + (sex === "F" ? -161 : 5); }
function exerciseKcal(met, profile, hours) {
  const kg = profile.weight, cm = profile.height, age = profile.age;
  if (!(kg > 0) || !(hours > 0)) return 0;
  let factor = 1;
  if (cm > 0 && age > 0) {
    factor = exBmr(kg, cm, age, profile.sex) / exBmr(kg, DEFAULT_EX_PROFILE.height, DEFAULT_EX_PROFILE.age, "M");
    factor = Math.min(1.4, Math.max(0.6, factor));
  }
  return met * kg * hours * factor;
}
function exerciseProfile() {
  return Object.assign({}, DEFAULT_EX_PROFILE, storageGet(APP.storage.profile) || {});
}

function exerciseCard(ex) {
  return `
    <a class="ex-card" href="${exerciseUrl(ex)}">
      <span class="food-icon" aria-hidden="true">${ex.icon}</span>
      <span class="food-card-body">
        <strong class="food-name">${escapeHtml(ex.name)}</strong>
        <span class="food-meta">${escapeHtml(ex.cat)}</span>
      </span>
      <span class="food-kcal">${fmt(ex.kcalH)} <small>kcal/h</small></span>
    </a>`;
}

/* ---------------- ejercicio.html ---------------- */
PAGES.exercise = function () {
  const root = document.getElementById("detail");
  const ex = EX_BY_SLUG[qs("e") || ""];
  if (!ex) {
    root.innerHTML = `
      ${breadcrumb([{ label: "Inicio", href: "index.html" }, { label: "Ejercicios", href: exploreUrl("ejercicios") }, { label: "No encontrado" }])}
      <div class="empty big"><span aria-hidden="true">🤷</span><h1>No encontramos ese ejercicio</h1>
      <p>Puede que el enlace esté mal escrito. Búscalo en la base de datos.</p>
      ${searchForm({ placeholder: "Buscar ejercicio" })}</div>`;
    return;
  }
  document.title = `Calorías quemadas: ${ex.name} | ${APP.name}`;

  const sameGroup = ex.group ? EXERCISES.filter(e => e.group === ex.group && e !== ex) : [];
  const related = sameGroup.concat(EXERCISES.filter(e => e.cat === ex.cat && e !== ex && !sameGroup.includes(e))).slice(0, 6);

  root.innerHTML = `
    ${breadcrumb([{ label: "Inicio", href: "index.html" }, { label: "Ejercicios", href: exploreUrl("ejercicios") }, { label: ex.name }])}
    <div class="detail-layout">
      <div class="detail-col">
        <div class="panel item-hero">
          <div class="item-hero-top">
            <a class="badge" href="${exploreUrl("ejercicios", slugify(ex.cat))}">${escapeHtml(ex.cat)}</a>
          </div>
          <span class="item-icon" aria-hidden="true">${ex.icon}</span>
          <h1>${escapeHtml(ex.name)}</h1>
          <p class="item-per" id="result-sentence"></p>
          <div class="big-number"><span id="kcal-total">0</span><small>kcal</small></div>
          <div class="tiles three">
            <div class="tile"><b id="kcal-min">0</b><span>kcal/min</span></div>
            <div class="tile"><b>${fmt1(ex.met)}</b><span>MET</span></div>
            <div class="tile"><b>${fmt(ex.kcalH)}</b><span>kcal/h promedio</span></div>
          </div>
          <p class="muted small">${fmt(ex.kcalH)} kcal por hora para un adulto promedio (${APP.refWeightKg} kg).</p>
          <button type="button" class="btn btn-primary btn-lg btn-block" id="log-ex">Registrar en mi diario de hoy</button>
        </div>
        <div class="panel">
          <h2 class="panel-title">Según duración</h2>
          <table class="dur-table"><tbody id="dur-table"></tbody></table>
        </div>
      </div>

      <div class="detail-col">
        <div class="panel calc-panel">
          <form id="calc" autocomplete="off" onsubmit="return false">
            <fieldset>
              <legend>Duración</legend>
              <div class="row-2">
                <label class="field"><span>Horas</span><input class="input" type="number" id="hours" min="0" max="24" step="1" value="1" inputmode="numeric"></label>
                <label class="field"><span>Minutos</span><input class="input" type="number" id="minutes" min="0" max="59" step="1" value="0" inputmode="numeric"></label>
              </div>
            </fieldset>
            <fieldset>
              <div class="legend-row"><legend>Configuración</legend><button type="button" class="link-btn" id="reset">Restablecer</button></div>
              <div class="segmented" role="radiogroup" aria-label="Sistema de unidades">
                <button type="button" data-units="metric" role="radio">Métrico</button>
                <button type="button" data-units="imperial" role="radio">Imperial</button>
              </div>
              <div class="row-2">
                <label class="field"><span>Peso <em class="unit" id="u-weight">kg</em></span><input class="input" type="number" id="weight" min="1" step="0.1" inputmode="decimal"></label>
                <label class="field"><span>Edad <em class="unit">años</em></span><input class="input" type="number" id="age" min="1" max="120" step="1" inputmode="numeric"></label>
                <label class="field"><span>Altura <em class="unit" id="u-height">cm</em></span><input class="input" type="number" id="height" min="1" step="0.1" inputmode="decimal"></label>
                <div class="field"><span>Sexo</span>
                  <div class="segmented" role="radiogroup" aria-label="Sexo">
                    <button type="button" data-sex="M" role="radio">M</button>
                    <button type="button" data-sex="F" role="radio">F</button>
                  </div>
                </div>
              </div>
              <p class="muted small">🔒 Tus datos se guardan en este dispositivo.</p>
            </fieldset>
          </form>
        </div>
        <div class="panel">
          <div class="section-head tight"><h2 class="panel-title">Actividades relacionadas</h2><a class="link" href="${exploreUrl("ejercicios", slugify(ex.cat))}">Ver todos ›</a></div>
          <div class="related-list">${related.map(exerciseCard).join("")}</div>
        </div>
      </div>
    </div>`;

  let profile = exerciseProfile();
  const $ = id => root.querySelector("#" + id);
  const inputs = { hours: $("hours"), minutes: $("minutes"), weight: $("weight"), age: $("age"), height: $("height") };
  const LB = 0.45359237, IN = 2.54;
  const r1 = n => Math.round(n * 10) / 10;
  let current = { h: 1, m: 0, total: 0 };

  function toDisplay() {
    const imp = profile.units === "imperial";
    inputs.weight.value = r1(imp ? profile.weight / LB : profile.weight);
    inputs.height.value = r1(imp ? profile.height / IN : profile.height);
    inputs.age.value = profile.age;
    $("u-weight").textContent = imp ? "lb" : "kg";
    $("u-height").textContent = imp ? "pulg" : "cm";
    root.querySelectorAll("[data-units]").forEach(b => { const on = b.dataset.units === profile.units; b.classList.toggle("active", on); b.setAttribute("aria-checked", on); });
    root.querySelectorAll("[data-sex]").forEach(b => { const on = b.dataset.sex === profile.sex; b.classList.toggle("active", on); b.setAttribute("aria-checked", on); });
  }
  function readInputs() {
    const imp = profile.units === "imperial";
    const w = parseFloat(inputs.weight.value), h = parseFloat(inputs.height.value), a = parseInt(inputs.age.value, 10);
    profile.weight = w > 0 ? (imp ? w * LB : w) : 0;
    profile.height = h > 0 ? (imp ? h * IN : h) : 0;
    profile.age = a > 0 ? a : 0;
  }
  const durLabel = (h, m) => `${h} hora${h !== 1 ? "s" : ""}, ${m} min`;

  function update() {
    readInputs();
    const h = Math.max(0, parseInt(inputs.hours.value, 10) || 0);
    const m = Math.max(0, Math.min(59, parseInt(inputs.minutes.value, 10) || 0));
    const total = exerciseKcal(ex.met, profile, h + m / 60);
    current = { h, m, total };
    $("kcal-total").textContent = fmt(total);
    $("kcal-min").textContent = fmt1(exerciseKcal(ex.met, profile, 1 / 60));
    $("result-sentence").innerHTML = `${escapeHtml(ex.name)} consume <strong>${fmt(total)} kcal</strong> en ${durLabel(h, m)}.`;
    $("dur-table").innerHTML = [15, 30, 45, 60, 90, 120].map(min =>
      `<tr><td>${min < 60 ? min + " min" : fmt1(min / 60) + " h"}</td><td>${fmt(exerciseKcal(ex.met, profile, min / 60))} kcal</td></tr>`).join("");
    if (profile.weight > 0) storageSet(APP.storage.profile, profile);
  }

  Object.values(inputs).forEach(i => i.addEventListener("input", update));
  root.querySelectorAll("[data-units]").forEach(b => b.addEventListener("click", () => { readInputs(); profile.units = b.dataset.units; toDisplay(); update(); }));
  root.querySelectorAll("[data-sex]").forEach(b => b.addEventListener("click", () => { profile.sex = b.dataset.sex; toDisplay(); update(); }));
  $("reset").addEventListener("click", () => {
    profile = Object.assign({}, DEFAULT_EX_PROFILE);
    inputs.hours.value = 1; inputs.minutes.value = 0;
    toDisplay(); update();
  });
  $("log-ex").addEventListener("click", () => {
    const minutes = current.h * 60 + current.m;
    if (!minutes) { inputs.minutes.focus(); return; }
    Store.addExercise(todayISO(), { slug: ex.slug, name: ex.name, icon: ex.icon, minutes, kcal: current.total });
    toast(`${ex.name} registrado (${fmt(current.total)} kcal)`, { actionLabel: "Ver diario", actionHref: "plan.html" });
  });

  toDisplay();
  update();
};
