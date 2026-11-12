/* =========================================================
 * T&M — Store del diario
 * Toda la persistencia pasa por este objeto. Hoy guarda en localStorage;
 * cuando exista el inicio de sesión, basta con reemplazar load()/save()
 * por llamadas al BACKEND sin tocar las páginas.
 *
 * Estructura:
 * {
 *   goals:   { kcal, p, c, f, profile: { sex, age, height, weight, activity, objective } },
 *   days:    { "YYYY-MM-DD": { foods: [Entry], exercises: [Exercise] } },
 *   weights: [{ date, kg }],
 *   recents: [slug]
 * }
 * Entry    = { id, meal, slug, name, icon, qty, portionLabel, grams, unit, kcal, p, c, f, quick? }
 * Exercise = { id, slug, name, icon, minutes, kcal }
 * ========================================================= */

const DEFAULT_GOALS = { kcal: 2000, p: 120, c: 245, f: 60, profile: null };

const Store = (() => {
  const KEY = "tm_diary_v1";
  let state = null;
  const listeners = new Set();
  const opListeners = new Set();
  /* Cada cambio se emite como operación para sincronizarlo con el servidor (sync.js) */
  function emit(op) { op.ts = Date.now(); opListeners.forEach(fn => fn(op)); }
  const foodOp = (date, e) => { const { id, ...data } = e; return { entity: "food", type: "upsert", id, day: date, data }; };
  const exOp = (date, x) => { const { id, ...data } = x; return { entity: "exercise", type: "upsert", id, day: date, data }; };

  function load() {
    if (state) return state;
    const saved = storageGet(KEY);
    state = Object.assign({ goals: { ...DEFAULT_GOALS }, days: {}, weights: [], recents: [], usage: {} }, saved || {});
    if (!state.usage) state.usage = {};
    return state;
  }
  function save() {
    storageSet(KEY, state);
    listeners.forEach(fn => fn(state));
  }
  function day(date) {
    load();
    if (!state.days[date]) state.days[date] = { foods: [], exercises: [] };
    return state.days[date];
  }
  function pushRecent(slug) {
    if (!slug) return;
    state.recents = [slug].concat(state.recents.filter(s => s !== slug)).slice(0, 20);
  }
  /* Uso por alimento: cuántas veces en cada comida y la última porción elegida */
  function recordUsage(entry) {
    if (!entry.slug || entry.quick) return;
    const u = state.usage[entry.slug] || (state.usage[entry.slug] = { meals: {}, n: 0 });
    u.n += 1;
    u.meals[entry.meal] = (u.meals[entry.meal] || 0) + 1;
    u.last = Date.now();
    u.qty = entry.qty;
    u.portionLabel = entry.portionLabel;
  }

  return {
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    onOp(fn) { opListeners.add(fn); return () => opListeners.delete(fn); },

    /* Todo el contenido local como operaciones (primera sincronización de un dispositivo) */
    snapshotOps() {
      load();
      const ops = [];
      Object.entries(state.days).forEach(([date, d]) => {
        d.foods.forEach(e => ops.push(foodOp(date, e)));
        d.exercises.forEach(x => ops.push(exOp(date, x)));
      });
      state.weights.forEach(w => ops.push({ entity: "weight", type: "upsert", day: w.date, data: { kg: w.kg } }));
      // La meta solo viaja si el usuario la calculó; la meta por defecto no debe pisar la de otro dispositivo
      if (state.goals.profile) ops.push({ entity: "goals", type: "upsert", data: { ...state.goals } });
      const ts = Date.now();
      return ops.map(op => ({ ...op, ts }));
    },

    /* Aplica cambios recibidos del servidor sin volver a emitirlos. skipIds: registros con cambios locales pendientes */
    applyRemote(changes, skipIds = new Set()) {
      load();
      const upsert = (list, ch) => {
        const i = list.findIndex(x => x.id === ch.id);
        if (ch.deleted) { if (i >= 0) list.splice(i, 1); return; }
        const row = { id: ch.id, ...ch.data };
        if (i >= 0) list[i] = row; else list.push(row);
      };
      (changes.foods || []).forEach(ch => { if (!skipIds.has(ch.id)) upsert(day(ch.day).foods, ch); });
      (changes.exercises || []).forEach(ch => { if (!skipIds.has(ch.id)) upsert(day(ch.day).exercises, ch); });
      (changes.weights || []).forEach(w => {
        state.weights = state.weights.filter(x => x.date !== w.day);
        if (w.kg > 0) state.weights.push({ date: w.day, kg: w.kg });
      });
      if (changes.goals && !skipIds.has("goals")) state.goals = { ...state.goals, ...changes.goals };
      save();
    },

    /* ---- Metas ---- */
    getGoals() { return load().goals; },
    setGoals(goals) {
      load(); state.goals = { ...state.goals, ...goals }; save();
      emit({ entity: "goals", type: "upsert", data: { ...state.goals } });
    },

    /* ---- Días ---- */
    getDay(date) {
      load();
      return state.days[date] || { foods: [], exercises: [] };
    },
    dayTotals(date) {
      const d = this.getDay(date);
      const t = { kcal: 0, p: 0, c: 0, f: 0, burned: 0 };
      d.foods.forEach(e => { t.kcal += e.kcal; t.p += e.p; t.c += e.c; t.f += e.f; });
      d.exercises.forEach(x => { t.burned += x.kcal; });
      return t;
    },
    mealTotals(date, meal) {
      const t = { kcal: 0, p: 0, c: 0, f: 0 };
      this.getDay(date).foods.filter(e => e.meal === meal).forEach(e => { t.kcal += e.kcal; t.p += e.p; t.c += e.c; t.f += e.f; });
      return t;
    },

    /* ---- Alimentos ---- */
    addFood(date, entry) {
      const e = { id: uid(), ...entry };
      day(date).foods.push(e);
      pushRecent(entry.slug);
      recordUsage(e);
      save();
      emit(foodOp(date, e));
      return e;
    },
    updateFood(date, id, patch) {
      const d = day(date);
      const i = d.foods.findIndex(e => e.id === id);
      if (i >= 0) { d.foods[i] = { ...d.foods[i], ...patch }; save(); emit(foodOp(date, d.foods[i])); }
    },
    removeFood(date, id) {
      const d = day(date);
      d.foods = d.foods.filter(e => e.id !== id);
      save();
      emit({ entity: "food", type: "delete", id, day: date });
    },
    clearMeal(date, meal) {
      const d = day(date);
      const gone = d.foods.filter(e => e.meal === meal);
      d.foods = d.foods.filter(e => e.meal !== meal);
      save();
      gone.forEach(e => emit({ entity: "food", type: "delete", id: e.id, day: date }));
    },
    copyMeal(fromDate, toDate, meal) {
      const src = this.getDay(fromDate).foods.filter(e => e.meal === meal);
      const d = day(toDate);
      const copies = src.map(e => ({ ...e, id: uid() }));
      copies.forEach(e => d.foods.push(e));
      save();
      copies.forEach(e => emit(foodOp(toDate, e)));
      return copies;
    },
    removeFoods(date, ids) {
      const d = day(date);
      d.foods = d.foods.filter(e => !ids.includes(e.id));
      save();
      ids.forEach(id => emit({ entity: "food", type: "delete", id, day: date }));
    },
    recents() { return load().recents.slice(); },
    /* Frecuentes para una comida: primero lo que se come en esa comida, luego lo reciente */
    frequents(meal, limit = 12) {
      load();
      const now = Date.now(), DAY = 864e5;
      const scored = Object.entries(state.usage).map(([slug, u]) => {
        const inMeal = u.meals[meal] || 0;
        const recency = u.last ? Math.max(0, 7 - (now - u.last) / DAY) / 7 : 0;
        return { slug, score: inMeal * 3 + u.n + recency * 2, inMeal };
      }).sort((a, b) => (b.inMeal > 0) - (a.inMeal > 0) || b.score - a.score).map(x => x.slug);
      const rest = state.recents.filter(s => !scored.includes(s));
      return scored.concat(rest).slice(0, limit);
    },
    lastPortion(slug) {
      const u = load().usage[slug];
      return u && u.portionLabel != null ? { qty: u.qty, portionLabel: u.portionLabel } : null;
    },

    /* ---- Ejercicio ---- */
    addExercise(date, ex) {
      const x = { id: uid(), ...ex };
      day(date).exercises.push(x);
      save();
      emit(exOp(date, x));
      return x;
    },
    removeExercise(date, id) {
      const d = day(date);
      d.exercises = d.exercises.filter(x => x.id !== id);
      save();
      emit({ entity: "exercise", type: "delete", id, day: date });
    },

    /* ---- Peso ---- */
    getWeights() { return load().weights.slice().sort((a, b) => a.date.localeCompare(b.date)); },
    setWeight(date, kg) {
      load();
      state.weights = state.weights.filter(w => w.date !== date);
      if (kg > 0) state.weights.push({ date, kg });
      save();
      emit(kg > 0 ? { entity: "weight", type: "upsert", day: date, data: { kg } } : { entity: "weight", type: "delete", day: date });
    }
  };
})();

/* ---------- Cálculo de metas (Mifflin-St Jeor) ---------- */
const ACTIVITY_LEVELS = [
  { id: "sedentario", label: "Sedentario", desc: "Poco o nada de ejercicio", factor: 1.2 },
  { id: "ligero", label: "Ligero", desc: "Ejercicio 1–3 días por semana", factor: 1.375 },
  { id: "moderado", label: "Moderado", desc: "Ejercicio 3–5 días por semana", factor: 1.55 },
  { id: "activo", label: "Activo", desc: "Ejercicio 6–7 días por semana", factor: 1.725 },
  { id: "muy-activo", label: "Muy activo", desc: "Entrenamiento intenso o trabajo físico", factor: 1.9 }
];
const OBJECTIVES = [
  { id: "perder", label: "Perder grasa", icon: "🔥", kcalFactor: 0.8, proteinPerKg: 2.0 },
  { id: "mantener", label: "Mantener peso", icon: "⚖️", kcalFactor: 1, proteinPerKg: 1.6 },
  { id: "ganar", label: "Ganar músculo", icon: "💪", kcalFactor: 1.1, proteinPerKg: 2.0 }
];

function calculateGoals({ sex, age, height, weight, activity, objective }) {
  const bmr = 10 * weight + 6.25 * height - 5 * age + (sex === "F" ? -161 : 5);
  const act = ACTIVITY_LEVELS.find(a => a.id === activity) || ACTIVITY_LEVELS[1];
  const obj = OBJECTIVES.find(o => o.id === objective) || OBJECTIVES[1];
  const tdee = bmr * act.factor;
  const kcal = Math.round(tdee * obj.kcalFactor / 10) * 10;
  const p = Math.round(weight * obj.proteinPerKg);
  const f = Math.round(kcal * 0.27 / 9);
  const c = Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4));
  return { kcal, p, c, f, bmr: Math.round(bmr), tdee: Math.round(tdee) };
}

/* Crea un Entry del diario a partir de un ítem, cantidad y porción */
function makeEntry(item, qty, portion, meal) {
  const grams = qty * portion.g;
  const n = nutrientsFor(item, grams);
  return {
    meal,
    slug: item.slug,
    name: item.name,
    icon: item.icon,
    qty,
    portionLabel: portion.isUnit ? item.unit : portion.label,
    portionG: portion.g,
    grams,
    unit: item.unit,
    kcal: n.kcal, p: n.p, c: n.c, f: n.f
  };
}

/* Entry con la última porción que el usuario usó para ese ítem (o la porción por defecto) */
function makeEntryLastPortion(item, meal) {
  const last = Store.lastPortion(item.slug);
  if (last) {
    const portion = portionOptions(item).find(p => (p.isUnit ? item.unit : p.label) === last.portionLabel);
    if (portion && last.qty > 0) return makeEntry(item, last.qty, portion, meal);
  }
  return makeEntry(item, 1, item.portions[0], meal);
}

/* Control "Cantidad + Porción + Agregar a <comida>" reutilizable */
function addToDiaryControl(item, { onChange } = {}) {
  const options = portionOptions(item);
  const html = `
    <div class="panel add-panel">
      <div class="add-grid">
        <label class="field">
          <span>Cantidad</span>
          <input type="number" class="input" id="add-qty" value="1" min="0" step="0.5" inputmode="decimal">
        </label>
        <label class="field">
          <span>Porción</span>
          <select class="input" id="add-portion">
            ${options.map((p, i) => `<option value="${i}">${escapeHtml(portionOptionLabel(item, p))}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="split-btn">
        <button type="button" class="btn btn-primary btn-lg" id="add-btn"><span id="add-meal-label"></span></button>
        <button type="button" class="btn btn-primary btn-lg split-toggle" id="add-meal-toggle" aria-haspopup="listbox" aria-expanded="false" aria-label="Elegir comida">${ICONS.chevronDown}</button>
        <div class="split-menu" id="add-meal-menu" role="listbox">
          ${APP.meals.map(m => `<button type="button" role="option" data-meal="${m.id}">${m.icon} ${m.label}</button>`).join("")}
        </div>
      </div>
      <p class="muted small add-note">Se agrega a tu diario de hoy en este dispositivo.</p>
    </div>`;

  function bind(root) {
    let meal = suggestedMeal();
    const qtyEl = root.querySelector("#add-qty");
    const porEl = root.querySelector("#add-portion");
    const label = root.querySelector("#add-meal-label");
    const menu = root.querySelector("#add-meal-menu");
    const toggle = root.querySelector("#add-meal-toggle");

    const state = () => {
      const portion = options[+porEl.value];
      const qty = Math.max(0, parseFloat(qtyEl.value) || 0);
      return { qty, portion, grams: qty * portion.g };
    };
    const setMeal = m => { meal = m; label.textContent = "Agregar a " + mealById(m).label; };
    setMeal(meal);

    qtyEl.addEventListener("input", () => onChange && onChange(state()));
    porEl.addEventListener("change", () => {
      const p = options[+porEl.value];
      qtyEl.value = p.isUnit ? Math.round(item.portions[0].g) : 1;
      onChange && onChange(state());
    });
    toggle.addEventListener("click", e => {
      e.stopPropagation();
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
    document.addEventListener("click", () => { menu.classList.remove("open"); toggle.setAttribute("aria-expanded", false); });
    menu.addEventListener("click", e => {
      const b = e.target.closest("[data-meal]");
      if (b) setMeal(b.dataset.meal);
    });
    root.querySelector("#add-btn").addEventListener("click", () => {
      const s = state();
      if (!s.qty) { qtyEl.focus(); return; }
      Store.addFood(todayISO(), makeEntry(item, s.qty, s.portion, meal));
      toast(`${item.name} agregado a ${mealById(meal).label}`, { actionLabel: "Ver diario", actionHref: "plan.html" });
    });
    onChange && onChange(state());
  }

  return { html, bind };
}
