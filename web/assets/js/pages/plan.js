/* =========================================================
 * plan.html — Contador de calorías
 * Vista "Plan": diario del día con captura de alimentos.
 * Vista "Progreso": historial de calorías, macros y peso.
 * ========================================================= */

PAGES.plan = function () {
  const root = document.getElementById("plan-root");
  let date = qs("fecha") && /^\d{4}-\d{2}-\d{2}$/.test(qs("fecha")) ? qs("fecha") : todayISO();
  let progressRange = 7;

  /* ---------- Vistas (pestañas) ---------- */
  function currentTab() { return location.hash === "#progreso" ? "progreso" : "plan"; }
  function render() {
    const tab = currentTab();
    document.querySelectorAll(".app-tabs [data-tab]").forEach(a => {
      const on = a.dataset.tab === tab;
      a.classList.toggle("active", on);
      a.setAttribute("aria-selected", on);
    });
    document.title = (tab === "plan" ? "Mi plan" : "Mi progreso") + ` | ${APP.name}`;
    if (tab === "plan") renderPlan(); else renderProgress();
  }
  window.addEventListener("hashchange", render);
  Store.onChange(() => render());

  /* =======================================================
   * VISTA PLAN
   * ======================================================= */
  function renderPlan() {
    const goals = Store.getGoals();
    const t = Store.dayTotals(date);
    const day = Store.getDay(date);
    const remaining = goals.kcal - t.kcal + t.burned;

    root.innerHTML = `
      <div class="plan-top">
        <div class="date-nav">
          <button type="button" class="icon-btn" id="prev-day" aria-label="Día anterior">${ICONS.chevronLeft}</button>
          <label class="date-title">
            <h1>${escapeHtml(dayLabel(date))}</h1>
            ${ICONS.chevronDown}
            <input type="date" id="date-input" value="${date}" aria-label="Elegir fecha">
          </label>
          <button type="button" class="icon-btn" id="next-day" aria-label="Día siguiente">${ICONS.chevronRight}</button>
          ${date !== todayISO() ? `<button type="button" class="btn btn-outline btn-sm" id="go-today">Ir a hoy</button>` : ""}
        </div>
      </div>

      <div class="plan-grid">
        <div class="plan-side">
          <section class="panel summary-card" aria-label="Resumen del día">
            <div class="summary-head">
              <span class="muted">kcal</span>
              <div class="summary-kcal">
                <b>${fmt(t.kcal)}</b> / ${fmt(goals.kcal)}
                <button type="button" class="icon-btn sm" id="edit-goals" aria-label="Editar meta">${ICONS.edit}</button>
              </div>
            </div>
            ${gauge(t.kcal, goals.kcal)}
            <p class="remaining ${remaining < 0 ? "over" : ""}">
              ${remaining >= 0 ? `Te quedan <b>${fmt(remaining)}</b> kcal` : `Te pasaste por <b>${fmt(-remaining)}</b> kcal`}
              ${t.burned ? `<span class="muted"> · incluye ${fmt(t.burned)} kcal de ejercicio</span>` : ""}
            </p>
            <div class="macro-goals">
              ${macroGoal("Proteínas", t.p, goals.p, MACRO_COLORS.p)}
              ${macroGoal("Carbs", t.c, goals.c, MACRO_COLORS.c)}
              ${macroGoal("Grasas", t.f, goals.f, MACRO_COLORS.f)}
            </div>
          </section>

          <section class="panel exercise-card">
            <div class="meal-head">
              <div>
                <h2>Ejercicio</h2>
                <p class="meal-sub"><span class="flame burn">${ICONS.flame}</span> ${fmt(t.burned)} kcal quemadas</p>
              </div>
            </div>
            ${day.exercises.length ? `<ul class="entries">${day.exercises.map(x => `
              <li class="entry">
                <span class="entry-icon" aria-hidden="true">${x.icon}</span>
                <span class="entry-body"><b>${escapeHtml(x.name)}</b><small>${x.minutes} min</small></span>
                <span class="entry-kcal">−${fmt(x.kcal)} kcal</span>
                <button type="button" class="icon-btn sm" data-del-ex="${x.id}" aria-label="Eliminar ${escapeHtml(x.name)}">${ICONS.trash}</button>
              </li>`).join("")}</ul>` : ""}
            <button type="button" class="add-pill" id="add-exercise" aria-label="Registrar ejercicio">${ICONS.plus}</button>
          </section>

          <section class="panel goal-card">
            <span class="goal-icon" aria-hidden="true">${goalObjective(goals).icon}</span>
            <div>
              <h3>${escapeHtml(goalObjective(goals).label)}</h3>
              <p class="muted small">${goals.profile ? `Meta calculada para ${fmt1(goals.profile.weight)} kg · ${escapeHtml((ACTIVITY_LEVELS.find(a => a.id === goals.profile.activity) || {}).label || "")}` : "Calcula tu meta de calorías y macros según tu objetivo."}</p>
            </div>
            <button type="button" class="btn btn-primary btn-sm" id="calc-goals">${goals.profile ? "Recalcular" : "Calcular mi meta"}</button>
          </section>
        </div>

        <div class="plan-meals">
          ${APP.meals.map(m => mealCard(m, day)).join("")}
          <p class="muted small center-text">Tu diario se guarda en este dispositivo. <a class="link" href="login.html">Inicia sesión</a> para sincronizarlo.</p>
        </div>
      </div>`;

    // Navegación de fecha
    root.querySelector("#prev-day").addEventListener("click", () => setDate(addDays(date, -1)));
    root.querySelector("#next-day").addEventListener("click", () => setDate(addDays(date, 1)));
    const di = root.querySelector("#date-input");
    di.addEventListener("change", () => di.value && setDate(di.value));
    root.querySelector(".date-title").addEventListener("click", e => {
      if (e.target !== di && di.showPicker) { try { di.showPicker(); } catch (err) { /* sin soporte */ } }
    });
    const goToday = root.querySelector("#go-today");
    if (goToday) goToday.addEventListener("click", () => setDate(todayISO()));

    root.querySelector("#edit-goals").addEventListener("click", () => openGoalsModal());
    root.querySelector("#calc-goals").addEventListener("click", () => openGoalsModal());
    root.querySelector("#add-exercise").addEventListener("click", openExerciseModal);
    root.querySelectorAll("[data-del-ex]").forEach(b => b.addEventListener("click", () => Store.removeExercise(date, b.dataset.delEx)));

    root.querySelectorAll("[data-add-meal]").forEach(b => b.addEventListener("click", () => openAddModal(b.dataset.addMeal)));
    root.querySelectorAll("[data-entry]").forEach(b => b.addEventListener("click", () => openEditModal(b.dataset.entry)));
    root.querySelectorAll("[data-meal-menu]").forEach(b => b.addEventListener("click", e => {
      e.stopPropagation();
      const menu = b.nextElementSibling;
      root.querySelectorAll(".meal-menu.open").forEach(m => m !== menu && m.classList.remove("open"));
      menu.classList.toggle("open");
    }));
    root.querySelectorAll("[data-copy-yesterday]").forEach(b => b.addEventListener("click", () => {
      const meal = b.dataset.copyYesterday;
      const copies = Store.copyMeal(addDays(date, -1), date, meal);
      const n = copies.length;
      if (!n) { toast("No hay alimentos ayer en esa comida"); return; }
      toast(`${n} ${n === 1 ? "alimento copiado" : "alimentos copiados"} de ayer`,
        { actionLabel: "Deshacer", onAction: () => Store.removeFoods(date, copies.map(e => e.id)) });
    }));
    root.querySelectorAll("[data-clear-meal]").forEach(b => b.addEventListener("click", () => {
      const meal = b.dataset.clearMeal;
      if (confirm(`¿Vaciar ${mealById(meal).label}?`)) Store.clearMeal(date, meal);
    }));
  }
  document.addEventListener("click", () => root.querySelectorAll(".meal-menu.open").forEach(m => m.classList.remove("open")));

  function setDate(d) {
    date = d;
    const p = new URLSearchParams(location.search);
    if (d === todayISO()) p.delete("fecha"); else p.set("fecha", d);
    history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "") + location.hash);
    renderPlan();
  }

  function goalObjective(goals) {
    const id = goals.profile && goals.profile.objective;
    return OBJECTIVES.find(o => o.id === id) || { label: "Tu meta diaria", icon: "🎯" };
  }

  /* Medidor semicircular de calorías */
  function gauge(value, goal) {
    const max = goal * 1.3;
    const pct = Math.max(0, Math.min(100, value / max * 100));
    const over = value > goal * 1.1;
    const tick = frac => {
      const a = Math.PI * (1 - frac);
      const x1 = 150 + 118 * Math.cos(a), y1 = 150 - 118 * Math.sin(a);
      const x2 = 150 + 142 * Math.cos(a), y2 = 150 - 142 * Math.sin(a);
      const lx = 150 + 100 * Math.cos(a), ly = 150 - 100 * Math.sin(a) + 14;
      return { line: `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`, lx, ly };
    };
    const lo = tick(0.9 / 1.3), hi = tick(1.1 / 1.3);
    return `
      <div class="gauge" role="img" aria-label="${fmt(value)} de ${fmt(goal)} kcal consumidas">
        <svg viewBox="0 0 300 165" aria-hidden="true">
          <path d="M20 150 A130 130 0 0 1 280 150" class="gauge-track" pathLength="100"/>
          ${pct > 0 ? `<path d="M20 150 A130 130 0 0 1 280 150" class="gauge-fill ${over ? "over" : ""}" pathLength="100" stroke-dasharray="${pct} 100"/>` : ""}
          <path d="${lo.line}" class="gauge-tick"/><path d="${hi.line}" class="gauge-tick"/>
          <text x="${lo.lx}" y="${lo.ly}" class="gauge-label" text-anchor="middle">${fmt(goal * 0.9)}</text>
          <text x="${hi.lx}" y="${hi.ly}" class="gauge-label" text-anchor="middle">${fmt(goal * 1.1)}</text>
        </svg>
      </div>`;
  }

  function macroGoal(label, value, goal, color) {
    const pct = goal ? Math.min(100, value / goal * 100) : 0;
    return `
      <div class="macro-goal">
        <span class="muted">${label}</span>
        <span class="macro-goal-val"><b>${fmt(value)}</b> / ${fmt(goal)} <small>g</small></span>
        <span class="macro-track"><span style="width:${pct}%;background:${color}"></span></span>
      </div>`;
  }

  function mealCard(m, day) {
    const entries = day.foods.filter(e => e.meal === m.id);
    const t = Store.mealTotals(date, m.id);
    const prev = entries.length ? [] : Store.getDay(addDays(date, -1)).foods.filter(e => e.meal === m.id);
    const prevKcal = prev.reduce((s, e) => s + e.kcal, 0);
    const prevNames = prev.slice(0, 2).map(e => e.name).join(", ") + (prev.length > 2 ? ` y ${prev.length - 2} más` : "");
    return `
      <section class="panel meal-card" aria-label="${m.label}">
        <div class="meal-head">
          <div>
            <h2>${m.label}</h2>
            <p class="meal-sub">
              <span class="flame">${ICONS.flame}</span> <b>${fmt(t.kcal)} kcal</b>
              <span class="bullet">•</span>
              <span class="m-p">P ${fmt(t.p)}</span><span class="pipe">|</span>
              <span class="m-c">C ${fmt(t.c)}</span><span class="pipe">|</span>
              <span class="m-f">G ${fmt(t.f)}</span>
            </p>
          </div>
          <div class="meal-actions">
            <button type="button" class="icon-btn" data-meal-menu aria-label="Opciones de ${m.label}">${ICONS.dots}</button>
            <div class="meal-menu">
              <button type="button" data-copy-yesterday="${m.id}">Copiar de ayer</button>
              <button type="button" data-clear-meal="${m.id}" ${entries.length ? "" : "disabled"}>Vaciar ${m.label.toLowerCase()}</button>
            </div>
          </div>
        </div>
        ${entries.length ? `<ul class="entries">${entries.map(e => `
          <li>
            <button type="button" class="entry" data-entry="${e.id}">
              <span class="entry-icon" aria-hidden="true">${e.icon || "🍽️"}</span>
              <span class="entry-body"><b>${escapeHtml(e.name)}</b><small>${escapeHtml(entryPortionText(e))}</small></span>
              <span class="entry-kcal">${fmt(e.kcal)} kcal</span>
            </button>
          </li>`).join("")}</ul>` : ""}
        ${prev.length ? `<button type="button" class="repeat-btn" data-copy-yesterday="${m.id}">
            <span>Igual que ayer<br><small>${escapeHtml(prevNames)}</small></span><span>${fmt(prevKcal)} kcal</span>
          </button>` : ""}
        <button type="button" class="add-pill" data-add-meal="${m.id}" aria-label="Agregar alimento a ${m.label}">${ICONS.plus}</button>
      </section>`;
  }

  function entryPortionText(e) {
    if (e.quick) return "Calorías rápidas";
    const item = ITEM_BY_SLUG[e.slug];
    if (!item) return `${fmt1(e.grams)} ${e.unit || "g"}`;
    const portion = portionOptions(item).find(p => (p.isUnit ? item.unit : p.label) === e.portionLabel) || { label: e.portionLabel, g: e.portionG || 1 };
    return portionText(item, e.qty, portion);
  }

  /* =======================================================
   * MODAL: agregar alimento (búsqueda → porción)
   * ======================================================= */
  function openAddModal(meal) {
    const modal = openModal({ title: `Agregar a ${mealById(meal).label}`, size: "modal-lg" });
    let tab = Store.frequents(meal).length ? "recientes" : "alimentos";
    let query = "";

    function showSearch() {
      modal.setTitle(`Agregar a ${mealById(meal).label}`);
      modal.back.hidden = true;
      modal.body.innerHTML = `
        <div class="modal-search">
          <span class="search-icon" aria-hidden="true">${ICONS.search}</span>
          <input type="search" id="m-q" placeholder="Buscar alimento o receta" value="${escapeHtml(query)}" autocomplete="off" aria-label="Buscar alimento o receta">
        </div>
        <div class="tabs" role="tablist">
          ${[["recientes", "Frecuentes"], ["alimentos", "Alimentos"], ["recetas", "Recetas"], ["rapido", "Calorías rápidas"]]
            .map(([id, l]) => `<button type="button" role="tab" class="tab ${tab === id ? "active" : ""}" data-tab="${id}" aria-selected="${tab === id}">${l}</button>`).join("")}
        </div>
        <div id="m-results" class="m-results"></div>`;
      const input = modal.body.querySelector("#m-q");
      input.addEventListener("input", () => {
        query = input.value;
        if (query && (tab === "recientes" || tab === "rapido")) { tab = "alimentos"; syncTabs(); }
        renderResults();
      });
      modal.body.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => { tab = b.dataset.tab; syncTabs(); renderResults(); }));
      renderResults();
      setTimeout(() => input.focus(), 50);
    }
    function syncTabs() {
      modal.body.querySelectorAll(".tab").forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle("active", on); b.setAttribute("aria-selected", on); });
    }

    function renderResults() {
      const box = modal.body.querySelector("#m-results");
      if (tab === "rapido") { box.innerHTML = quickForm(); bindQuickForm(box); return; }
      let list;
      if (tab === "recientes" && !query) {
        list = Store.frequents(meal).map(s => ITEM_BY_SLUG[s]).filter(Boolean);
        if (!list.length) { box.innerHTML = `<div class="empty small"><p>Aquí aparecerán los alimentos que más registras en ${mealById(meal).label.toLowerCase()}. Busca uno para empezar.</p></div>`; return; }
      } else {
        list = searchItems(query, { type: tab === "recetas" ? "recipe" : (tab === "alimentos" && !query ? "food" : undefined) });
        if (tab === "recetas") list = list.filter(i => i.type === "recipe");
        if (!query && tab === "alimentos") list = POPULAR_FOODS_FOR_MODAL.map(s => ITEM_BY_SLUG[s]).filter(Boolean);
      }
      list = list.slice(0, 40);
      box.innerHTML = list.length ? `<ul class="result-list">${list.map(i => {
        const e = makeEntryLastPortion(i, meal);
        const ptxt = entryPortionText(e);
        return `
          <li class="result">
            <button type="button" class="result-main" data-pick="${i.slug}">
              <span class="entry-icon" aria-hidden="true">${i.icon}</span>
              <span class="entry-body"><b>${escapeHtml(i.name)}</b><small>${escapeHtml(ptxt)} · ${fmt(e.kcal)} kcal</small></span>
            </button>
            <button type="button" class="quick-add" data-quick="${i.slug}" aria-label="Agregar ${escapeHtml(i.name)} (${escapeHtml(ptxt)})">${ICONS.plus}</button>
          </li>`;
      }).join("")}</ul>` : `<div class="empty small"><span aria-hidden="true">🔍</span><p>No encontramos “${escapeHtml(query)}”. Prueba con <button type="button" class="link-btn" data-go-quick>calorías rápidas</button>.</p></div>`;

      box.querySelectorAll("[data-pick]").forEach(b => b.addEventListener("click", () => showPortion(ITEM_BY_SLUG[b.dataset.pick])));
      box.querySelectorAll("[data-quick]").forEach(b => b.addEventListener("click", () => {
        const item = ITEM_BY_SLUG[b.dataset.quick];
        const added = Store.addFood(date, makeEntryLastPortion(item, meal));
        b.classList.add("done");
        b.innerHTML = ICONS.check;
        toast(`${item.name} agregado a ${mealById(meal).label}`, { actionLabel: "Deshacer", onAction: () => {
          Store.removeFood(date, added.id);
          b.classList.remove("done");
          b.innerHTML = ICONS.plus;
        } });
      }));
      const goQuick = box.querySelector("[data-go-quick]");
      if (goQuick) goQuick.addEventListener("click", () => { tab = "rapido"; syncTabs(); renderResults(); });
    }

    function showPortion(item) {
      modal.setTitle(item.name);
      modal.back.hidden = false;
      modal.back.onclick = showSearch;
      const last = Store.lastPortion(item.slug);
      const li = last ? portionOptions(item).findIndex(p => (p.isUnit ? item.unit : p.label) === last.portionLabel) : -1;
      modal.body.innerHTML = portionEditor(item, { qty: li >= 0 ? last.qty : 1, portionIndex: Math.max(0, li), meal });
      bindPortionEditor(modal.body, item, {
        submitLabel: "Agregar",
        onSubmit: ({ qty, portion, meal: m }) => {
          Store.addFood(date, makeEntry(item, qty, portion, m));
          toast(`${item.name} agregado a ${mealById(m).label}`);
          showSearch();
        }
      });
    }

    function bindQuickForm(box) {
      box.querySelector("form").addEventListener("submit", e => {
        e.preventDefault();
        const f = new FormData(e.target);
        const kcal = parseFloat(f.get("kcal")) || 0;
        if (!kcal) { e.target.kcal.focus(); return; }
        Store.addFood(date, {
          meal, quick: true, slug: null, icon: "⚡",
          name: (f.get("name") || "").trim() || "Calorías rápidas",
          qty: 1, grams: 0, kcal,
          p: parseFloat(f.get("p")) || 0, c: parseFloat(f.get("c")) || 0, f: parseFloat(f.get("f")) || 0
        });
        toast(`Agregado a ${mealById(meal).label}`);
        modal.close();
      });
    }

    showSearch();
  }

  function quickForm(e = {}) {
    return `
      <form class="quick-form" autocomplete="off">
        <p class="muted small">¿No encuentras el alimento? Registra sus calorías y macros directamente.</p>
        <label class="field"><span>Nombre (opcional)</span><input class="input" name="name" value="${escapeHtml(e.name && e.name !== "Calorías rápidas" ? e.name : "")}" placeholder="Ej: Almuerzo en el trabajo"></label>
        <div class="row-4">
          <label class="field"><span>Calorías</span><input class="input" name="kcal" type="number" min="0" step="1" value="${e.kcal ? Math.round(e.kcal) : ""}" required inputmode="numeric"></label>
          <label class="field"><span>Proteínas (g)</span><input class="input" name="p" type="number" min="0" step="0.1" value="${e.p || ""}" inputmode="decimal"></label>
          <label class="field"><span>Carbs (g)</span><input class="input" name="c" type="number" min="0" step="0.1" value="${e.c || ""}" inputmode="decimal"></label>
          <label class="field"><span>Grasas (g)</span><input class="input" name="f" type="number" min="0" step="0.1" value="${e.f || ""}" inputmode="decimal"></label>
        </div>
        <div class="modal-actions">
          ${e.id ? `<button type="button" class="btn btn-danger-ghost" data-delete>${ICONS.trash} Eliminar</button>` : ""}
          <button type="submit" class="btn btn-primary btn-lg">${e.id ? "Guardar" : "Agregar"}</button>
        </div>
      </form>`;
  }

  /* Editor de porción (usado al agregar y al editar) */
  function portionEditor(item, { qty, portionIndex, meal }) {
    const options = portionOptions(item);
    return `
      <div class="portion-editor">
        <div class="pe-head">
          <span class="item-icon sm" aria-hidden="true">${item.icon}</span>
          <div>
            <p class="muted small">${item.type === "recipe" ? "Receta" : "Genérico · " + escapeHtml(item.cat)}</p>
            <a class="link small" href="${itemUrl(item)}" target="_blank" rel="noopener">Ver información nutricional completa ›</a>
          </div>
        </div>
        <div class="tiles">
          <div class="tile"><b id="pe-kcal">0</b><span>kcal</span></div>
          <div class="tile"><b id="pe-p">0</b><span>proteínas</span></div>
          <div class="tile"><b id="pe-c">0</b><span>carbs</span></div>
          <div class="tile"><b id="pe-f">0</b><span>grasas</span></div>
        </div>
        <div id="pe-bar"></div>
        <div class="add-grid">
          <label class="field"><span>Cantidad</span><input type="number" class="input" id="pe-qty" value="${qty}" min="0" step="0.5" inputmode="decimal"></label>
          <label class="field"><span>Porción</span>
            <select class="input" id="pe-portion">
              ${options.map((p, i) => `<option value="${i}" ${i === portionIndex ? "selected" : ""}>${escapeHtml(portionOptionLabel(item, p))}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="field">
          <span>Comida</span>
          <div class="segmented" id="pe-meal" role="radiogroup" aria-label="Comida">
            ${APP.meals.map(m => `<button type="button" role="radio" data-meal="${m.id}" class="${m.id === meal ? "active" : ""}" aria-checked="${m.id === meal}">${m.label}</button>`).join("")}
          </div>
        </div>
        <div class="modal-actions" id="pe-actions"></div>
      </div>`;
  }

  function bindPortionEditor(container, item, { submitLabel, onSubmit, onDelete }) {
    const options = portionOptions(item);
    const qtyEl = container.querySelector("#pe-qty");
    const porEl = container.querySelector("#pe-portion");
    let meal = container.querySelector("#pe-meal .active").dataset.meal;
    const actions = container.querySelector("#pe-actions");
    actions.innerHTML = `
      ${onDelete ? `<button type="button" class="btn btn-danger-ghost" id="pe-del">${ICONS.trash} Eliminar</button>` : ""}
      <button type="button" class="btn btn-primary btn-lg" id="pe-ok">${submitLabel}</button>`;

    function state() {
      const portion = options[+porEl.value];
      const qty = Math.max(0, parseFloat(qtyEl.value) || 0);
      return { qty, portion, meal, grams: qty * portion.g };
    }
    function update() {
      const s = state();
      const n = nutrientsFor(item, s.grams);
      container.querySelector("#pe-kcal").textContent = fmt(n.kcal);
      container.querySelector("#pe-p").textContent = fmt1(n.p) + " g";
      container.querySelector("#pe-c").textContent = fmt1(n.c) + " g";
      container.querySelector("#pe-f").textContent = fmt1(n.f) + " g";
      container.querySelector("#pe-bar").innerHTML = macroBar(n);
    }
    qtyEl.addEventListener("input", update);
    porEl.addEventListener("change", () => {
      const p = options[+porEl.value];
      qtyEl.value = p.isUnit ? Math.round(item.portions[0].g) : 1;
      update();
    });
    container.querySelectorAll("#pe-meal [data-meal]").forEach(b => b.addEventListener("click", () => {
      meal = b.dataset.meal;
      container.querySelectorAll("#pe-meal [data-meal]").forEach(x => { const on = x === b; x.classList.toggle("active", on); x.setAttribute("aria-checked", on); });
    }));
    container.querySelector("#pe-ok").addEventListener("click", () => {
      const s = state();
      if (!s.qty) { qtyEl.focus(); return; }
      onSubmit(s);
    });
    qtyEl.addEventListener("keydown", e => { if (e.key === "Enter") container.querySelector("#pe-ok").click(); });
    if (onDelete) container.querySelector("#pe-del").addEventListener("click", onDelete);
    update();
    setTimeout(() => { qtyEl.focus(); qtyEl.select(); }, 50);
  }

  /* ---------- Editar una entrada ---------- */
  function openEditModal(id) {
    const e = Store.getDay(date).foods.find(x => x.id === id);
    if (!e) return;
    const item = e.slug && ITEM_BY_SLUG[e.slug];

    if (!item || e.quick) {
      const modal = openModal({ title: e.name });
      modal.body.innerHTML = quickForm(e);
      const form = modal.body.querySelector("form");
      form.addEventListener("submit", ev => {
        ev.preventDefault();
        const f = new FormData(form);
        Store.updateFood(date, id, {
          name: (f.get("name") || "").trim() || "Calorías rápidas",
          kcal: parseFloat(f.get("kcal")) || 0,
          p: parseFloat(f.get("p")) || 0, c: parseFloat(f.get("c")) || 0, f: parseFloat(f.get("f")) || 0
        });
        modal.close();
      });
      modal.body.querySelector("[data-delete]").addEventListener("click", () => { Store.removeFood(date, id); modal.close(); });
      return;
    }

    const options = portionOptions(item);
    let idx = options.findIndex(p => (p.isUnit ? item.unit : p.label) === e.portionLabel);
    if (idx < 0) idx = 0;
    const modal = openModal({ title: item.name, size: "modal-lg" });
    modal.body.innerHTML = portionEditor(item, { qty: e.qty, portionIndex: idx, meal: e.meal });
    bindPortionEditor(modal.body, item, {
      submitLabel: "Guardar",
      onSubmit: ({ qty, portion, meal }) => {
        Store.updateFood(date, id, makeEntry(item, qty, portion, meal));
        modal.close();
      },
      onDelete: () => {
        Store.removeFood(date, id);
        toast(`${item.name} eliminado`);
        modal.close();
      }
    });
  }

  /* =======================================================
   * MODAL: registrar ejercicio
   * ======================================================= */
  function openExerciseModal() {
    const modal = openModal({ title: "Registrar ejercicio", size: "modal-lg" });
    const profile = exerciseProfile();
    const goals = Store.getGoals();
    if (goals.profile && goals.profile.weight) profile.weight = goals.profile.weight;
    let query = "";

    function showSearch() {
      modal.setTitle("Registrar ejercicio");
      modal.back.hidden = true;
      modal.body.innerHTML = `
        <div class="modal-search">
          <span class="search-icon" aria-hidden="true">${ICONS.search}</span>
          <input type="search" id="x-q" placeholder="Buscar ejercicio" value="${escapeHtml(query)}" autocomplete="off" aria-label="Buscar ejercicio">
        </div>
        <ul class="result-list" id="x-results"></ul>`;
      const input = modal.body.querySelector("#x-q");
      const box = modal.body.querySelector("#x-results");
      function list() {
        const items = (query ? searchExercises(query) : ["correr", "caminar-moderado", "bicicleta", "ejercicios-con-pesas-o-maquinas", "entrenamiento-hiit", "yoga", "natacion-recreativo", "futbol", "baile", "spinning"].map(s => EX_BY_SLUG[s]).filter(Boolean)).slice(0, 40);
        box.innerHTML = items.map(x => `
          <li class="result">
            <button type="button" class="result-main" data-x="${x.slug}">
              <span class="entry-icon" aria-hidden="true">${x.icon}</span>
              <span class="entry-body"><b>${escapeHtml(x.name)}</b><small>${fmt(exerciseKcal(x.met, profile, 1))} kcal/h · ${escapeHtml(x.cat)}</small></span>
            </button>
          </li>`).join("") || `<li class="empty small"><p>No encontramos ese ejercicio.</p></li>`;
        box.querySelectorAll("[data-x]").forEach(b => b.addEventListener("click", () => showDuration(EX_BY_SLUG[b.dataset.x])));
      }
      input.addEventListener("input", () => { query = input.value; list(); });
      list();
      setTimeout(() => input.focus(), 50);
    }

    function showDuration(x) {
      modal.setTitle(x.name);
      modal.back.hidden = false;
      modal.back.onclick = showSearch;
      modal.body.innerHTML = `
        <div class="portion-editor">
          <div class="pe-head"><span class="item-icon sm" aria-hidden="true">${x.icon}</span><p class="muted small">${escapeHtml(x.cat)} · MET ${fmt1(x.met)} · ${fmt1(profile.weight)} kg</p></div>
          <label class="field"><span>Duración (minutos)</span><input type="number" class="input" id="x-min" value="30" min="1" step="5" inputmode="numeric"></label>
          <div class="chips">${[15, 30, 45, 60, 90].map(m => `<button type="button" class="chip" data-min="${m}">${m} min</button>`).join("")}</div>
          <div class="big-number center"><span id="x-kcal">0</span><small>kcal</small></div>
          <div class="modal-actions"><button type="button" class="btn btn-primary btn-lg" id="x-ok">Registrar</button></div>
        </div>`;
      const minEl = modal.body.querySelector("#x-min");
      const upd = () => { modal.body.querySelector("#x-kcal").textContent = fmt(exerciseKcal(x.met, profile, (parseFloat(minEl.value) || 0) / 60)); };
      minEl.addEventListener("input", upd);
      modal.body.querySelectorAll("[data-min]").forEach(b => b.addEventListener("click", () => { minEl.value = b.dataset.min; upd(); }));
      modal.body.querySelector("#x-ok").addEventListener("click", () => {
        const minutes = parseFloat(minEl.value) || 0;
        if (!minutes) { minEl.focus(); return; }
        Store.addExercise(date, { slug: x.slug, name: x.name, icon: x.icon, minutes, kcal: exerciseKcal(x.met, profile, minutes / 60) });
        toast(`${x.name} registrado`);
        modal.close();
      });
      upd();
    }
    showSearch();
  }

  /* =======================================================
   * MODAL: meta de calorías y macros
   * ======================================================= */
  function openGoalsModal(preObjective) {
    const goals = Store.getGoals();
    const lastW = Store.getWeights().slice(-1)[0];
    const pr = Object.assign({ sex: "M", age: 30, height: 170, weight: lastW ? lastW.kg : 75, activity: "ligero", objective: "mantener" }, goals.profile || {});
    if (preObjective) pr.objective = preObjective;

    const modal = openModal({ title: "Tu meta diaria", size: "modal-lg" });
    modal.body.innerHTML = `
      <form id="goal-form" class="goal-form" autocomplete="off">
        <div class="field">
          <span>Objetivo</span>
          <div class="objective-grid">
            ${OBJECTIVES.map(o => `
              <label class="objective">
                <input type="radio" name="objective" value="${o.id}" ${pr.objective === o.id ? "checked" : ""}>
                <span><i aria-hidden="true">${o.icon}</i>${o.label}</span>
              </label>`).join("")}
          </div>
        </div>
        <div class="row-4">
          <div class="field"><span>Sexo</span>
            <div class="segmented" id="g-sex" role="radiogroup" aria-label="Sexo">
              <button type="button" data-sex="M" class="${pr.sex === "M" ? "active" : ""}" role="radio">Hombre</button>
              <button type="button" data-sex="F" class="${pr.sex === "F" ? "active" : ""}" role="radio">Mujer</button>
            </div>
          </div>
          <label class="field"><span>Edad</span><input class="input" type="number" name="age" min="12" max="100" value="${pr.age}" inputmode="numeric"></label>
          <label class="field"><span>Altura (cm)</span><input class="input" type="number" name="height" min="100" max="250" step="0.5" value="${pr.height}" inputmode="decimal"></label>
          <label class="field"><span>Peso (kg)</span><input class="input" type="number" name="weight" min="30" max="300" step="0.1" value="${pr.weight}" inputmode="decimal"></label>
        </div>
        <label class="field"><span>Nivel de actividad</span>
          <select class="input" name="activity">
            ${ACTIVITY_LEVELS.map(a => `<option value="${a.id}" ${pr.activity === a.id ? "selected" : ""}>${a.label} — ${a.desc}</option>`).join("")}
          </select>
        </label>

        <div class="goal-result">
          <p class="muted small" id="g-explain"></p>
          <div class="row-4">
            <label class="field"><span>Calorías</span><input class="input strong" type="number" name="kcal" min="800" max="6000" step="10" inputmode="numeric"></label>
            <label class="field"><span><i class="dot" style="background:${MACRO_COLORS.p}"></i> Proteínas (g)</span><input class="input" type="number" name="p" min="0" step="1" inputmode="numeric"></label>
            <label class="field"><span><i class="dot" style="background:${MACRO_COLORS.c}"></i> Carbs (g)</span><input class="input" type="number" name="c" min="0" step="1" inputmode="numeric"></label>
            <label class="field"><span><i class="dot" style="background:${MACRO_COLORS.f}"></i> Grasas (g)</span><input class="input" type="number" name="f" min="0" step="1" inputmode="numeric"></label>
          </div>
          <p class="muted small" id="g-check"></p>
        </div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary btn-lg">Guardar meta</button>
        </div>
      </form>`;

    const form = modal.body.querySelector("#goal-form");
    let sex = pr.sex;
    modal.body.querySelectorAll("#g-sex [data-sex]").forEach(b => b.addEventListener("click", () => {
      sex = b.dataset.sex;
      modal.body.querySelectorAll("#g-sex [data-sex]").forEach(x => x.classList.toggle("active", x === b));
      recalc();
    }));

    function profileFromForm() {
      const f = new FormData(form);
      return {
        sex,
        age: parseFloat(f.get("age")) || 30,
        height: parseFloat(f.get("height")) || 170,
        weight: parseFloat(f.get("weight")) || 70,
        activity: f.get("activity"),
        objective: f.get("objective")
      };
    }
    function recalc() {
      const g = calculateGoals(profileFromForm());
      form.kcal.value = g.kcal; form.p.value = g.p; form.c.value = g.c; form.f.value = g.f;
      modal.body.querySelector("#g-explain").textContent =
        `Metabolismo basal ${fmt(g.bmr)} kcal · gasto diario estimado ${fmt(g.tdee)} kcal. Puedes ajustar los valores manualmente.`;
      check();
    }
    function check() {
      const k = +form.kcal.value || 0, p = +form.p.value || 0, c = +form.c.value || 0, f = +form.f.value || 0;
      const fromMacros = p * 4 + c * 4 + f * 9;
      modal.body.querySelector("#g-check").textContent = `Tus macros suman ${fmt(fromMacros)} kcal${Math.abs(fromMacros - k) > 50 ? " (no coinciden con la meta de calorías)" : ""}.`;
    }
    ["age", "height", "weight", "activity"].forEach(n => form[n].addEventListener("input", recalc));
    form.querySelectorAll("[name=objective]").forEach(r => r.addEventListener("change", recalc));
    ["kcal", "p", "c", "f"].forEach(n => form[n].addEventListener("input", check));

    if (goals.profile && !preObjective) {
      form.kcal.value = goals.kcal; form.p.value = goals.p; form.c.value = goals.c; form.f.value = goals.f;
      const g = calculateGoals(pr);
      modal.body.querySelector("#g-explain").textContent = `Metabolismo basal ${fmt(g.bmr)} kcal · gasto diario estimado ${fmt(g.tdee)} kcal.`;
      check();
    } else {
      recalc();
    }

    form.addEventListener("submit", e => {
      e.preventDefault();
      const profile = profileFromForm();
      Store.setGoals({ kcal: +form.kcal.value || 2000, p: +form.p.value || 0, c: +form.c.value || 0, f: +form.f.value || 0, profile });
      if (!Store.getWeights().some(w => w.date === todayISO())) Store.setWeight(todayISO(), profile.weight);
      toast("Meta actualizada");
      modal.close();
    });
  }

  /* =======================================================
   * VISTA PROGRESO
   * ======================================================= */
  function renderProgress() {
    const goals = Store.getGoals();
    const end = todayISO();
    const days = [];
    for (let i = progressRange - 1; i >= 0; i--) {
      const d = addDays(end, -i);
      days.push({ date: d, ...Store.dayTotals(d) });
    }
    const logged = days.filter(d => d.kcal > 0);
    const avg = k => logged.length ? logged.reduce((s, d) => s + d[k], 0) / logged.length : 0;
    const inRange = logged.filter(d => d.kcal >= goals.kcal * 0.9 && d.kcal <= goals.kcal * 1.1).length;
    const weights = Store.getWeights();
    const lastW = weights.slice(-1)[0];
    const firstW = weights[0];

    root.innerHTML = `
      <div class="plan-top">
        <h1>Progreso</h1>
        <div class="segmented range-toggle" role="radiogroup" aria-label="Rango">
          ${[7, 30].map(r => `<button type="button" role="radio" data-range="${r}" class="${progressRange === r ? "active" : ""}" aria-checked="${progressRange === r}">${r} días</button>`).join("")}
        </div>
      </div>

      <div class="stat-row">
        <div class="panel stat"><span class="muted">Promedio diario</span><b>${fmt(avg("kcal"))} <small>kcal</small></b><span class="muted small">Meta ${fmt(goals.kcal)} kcal</span></div>
        <div class="panel stat"><span class="muted">Días registrados</span><b>${logged.length} <small>/ ${progressRange}</small></b><span class="muted small">${inRange} dentro de tu meta (±10%)</span></div>
        <div class="panel stat"><span class="muted">Proteína promedio</span><b>${fmt(avg("p"))} <small>g</small></b><span class="muted small">Meta ${fmt(goals.p)} g</span></div>
        <div class="panel stat"><span class="muted">Peso actual</span><b>${lastW ? fmt1(lastW.kg) : "—"} <small>kg</small></b><span class="muted small">${lastW && firstW && lastW !== firstW ? `${lastW.kg - firstW.kg <= 0 ? "▼" : "▲"} ${fmt1(Math.abs(lastW.kg - firstW.kg))} kg desde el inicio` : "Registra tu peso abajo"}</span></div>
      </div>

      <section class="panel chart-card">
        <div class="chart-head">
          <div><h2>Calorías consumidas</h2><p class="muted small">Últimos ${progressRange} días · la línea punteada es tu meta (${fmt(goals.kcal)} kcal)</p></div>
        </div>
        <div class="chart" id="kcal-chart"></div>
        <details class="table-view">
          <summary>Ver como tabla</summary>
          <table class="data-table">
            <thead><tr><th>Día</th><th>kcal</th><th>Proteínas</th><th>Carbs</th><th>Grasas</th><th>Ejercicio</th></tr></thead>
            <tbody>${days.slice().reverse().map(d => `<tr><td>${escapeHtml(dayLabel(d.date))}</td><td>${fmt(d.kcal)}</td><td>${fmt(d.p)} g</td><td>${fmt(d.c)} g</td><td>${fmt(d.f)} g</td><td>${fmt(d.burned)} kcal</td></tr>`).join("")}</tbody>
          </table>
        </details>
      </section>

      <div class="progress-grid">
        <section class="panel">
          <h2 class="panel-title">Reparto promedio de macros</h2>
          ${logged.length ? macroBar({ p: avg("p"), c: avg("c"), f: avg("f") }) : `<p class="muted">Registra alimentos para ver tu reparto de macros.</p>`}
          <div class="macro-goals spaced">
            ${macroGoal("Proteínas", avg("p"), goals.p, MACRO_COLORS.p)}
            ${macroGoal("Carbs", avg("c"), goals.c, MACRO_COLORS.c)}
            ${macroGoal("Grasas", avg("f"), goals.f, MACRO_COLORS.f)}
          </div>
        </section>

        <section class="panel">
          <div class="chart-head">
            <div><h2 class="panel-title">Peso</h2><p class="muted small">${weights.length} ${weights.length === 1 ? "registro" : "registros"}</p></div>
          </div>
          <form class="weight-form" id="weight-form">
            <input class="input" type="date" name="date" value="${todayISO()}" max="${todayISO()}" aria-label="Fecha">
            <input class="input" type="number" name="kg" step="0.1" min="20" max="400" placeholder="kg" value="${lastW ? lastW.kg : ""}" aria-label="Peso en kg" inputmode="decimal" required>
            <button class="btn btn-primary" type="submit">Guardar</button>
          </form>
          <div class="chart small-chart" id="weight-chart"></div>
        </section>
      </div>`;

    root.querySelectorAll("[data-range]").forEach(b => b.addEventListener("click", () => { progressRange = +b.dataset.range; renderProgress(); }));
    root.querySelector("#weight-form").addEventListener("submit", e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const kg = parseFloat(f.get("kg"));
      if (kg > 0) { Store.setWeight(f.get("date") || todayISO(), kg); toast("Peso registrado"); }
    });

    barChart(root.querySelector("#kcal-chart"), days, goals.kcal);
    lineChart(root.querySelector("#weight-chart"), weights.slice(-30));
  }

  /* ---------- Gráfico de barras (calorías por día) ---------- */
  function niceMax(v) {
    if (v <= 0) return 100;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }

  function barChart(el, days, goal) {
    const W = 720, H = 260, m = { t: 12, r: 8, b: 28, l: 44 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const max = niceMax(Math.max(goal * 1.15, ...days.map(d => d.kcal)));
    const y = v => m.t + ih - v / max * ih;
    const band = iw / days.length;
    const bw = Math.max(4, Math.min(36, band * 0.62));
    const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * max);
    const showLabel = (i) => days.length <= 7 || i % 5 === 0 || i === days.length - 1;
    const short = iso => {
      const d = fromISODate(iso);
      return days.length <= 7 ? d.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", "") : String(d.getDate());
    };
    const barPath = (x, yTop, w, h) => {
      const r = Math.min(4, w / 2, h);
      const yb = yTop + h;
      return `M${x} ${yb} V${yTop + r} Q${x} ${yTop} ${x + r} ${yTop} H${x + w - r} Q${x + w} ${yTop} ${x + w} ${yTop + r} V${yb} Z`;
    };

    el.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Calorías consumidas por día">
        ${ticks.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" class="grid-line"/>
          <text x="${m.l - 8}" y="${y(v) + 4}" class="axis-label" text-anchor="end">${fmt(v)}</text>`).join("")}
        ${days.map((d, i) => {
          const x = m.l + band * i + (band - bw) / 2;
          const h = d.kcal ? Math.max(2, ih - (y(d.kcal) - m.t)) : 0;
          return (h ? `<path d="${barPath(x, y(d.kcal), bw, h)}" class="bar ${d.kcal > goal * 1.1 ? "over" : ""}" data-i="${i}"/>` : "") +
            (showLabel(i) ? `<text x="${m.l + band * i + band / 2}" y="${H - 8}" class="axis-label" text-anchor="middle">${short(d.date)}</text>` : "");
        }).join("")}
        <line x1="${m.l}" x2="${W - m.r}" y1="${y(goal)}" y2="${y(goal)}" class="goal-line"/>
        ${days.map((d, i) => `<rect x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ih}" class="hit" data-i="${i}"/>`).join("")}
      </svg>
      <div class="chart-tip" hidden></div>`;

    const tip = el.querySelector(".chart-tip");
    const svg = el.querySelector("svg");
    el.querySelectorAll(".hit").forEach(r => {
      r.addEventListener("mouseenter", () => {
        const i = +r.dataset.i, d = days[i];
        el.querySelectorAll(".bar").forEach(b => b.classList.toggle("dim", +b.dataset.i !== i));
        tip.innerHTML = `<b>${escapeHtml(dayLabel(d.date))}</b><span>${fmt(d.kcal)} kcal</span>
          <span><i class="dot" style="background:${MACRO_COLORS.p}"></i>P ${fmt(d.p)} g · <i class="dot" style="background:${MACRO_COLORS.c}"></i>C ${fmt(d.c)} g · <i class="dot" style="background:${MACRO_COLORS.f}"></i>G ${fmt(d.f)} g</span>`;
        tip.hidden = false;
        const box = svg.getBoundingClientRect();
        const cx = (m.l + band * i + band / 2) / W * box.width;
        tip.style.left = Math.min(Math.max(cx, 90), box.width - 90) + "px";
        tip.style.top = Math.max(0, (y(Math.max(d.kcal, goal)) / H) * box.height - 12) + "px";
      });
      r.addEventListener("mouseleave", () => {
        tip.hidden = true;
        el.querySelectorAll(".bar").forEach(b => b.classList.remove("dim"));
      });
    });
  }

  /* ---------- Gráfico de línea (peso) ---------- */
  function lineChart(el, points) {
    if (points.length < 2) {
      el.innerHTML = `<div class="empty small"><span aria-hidden="true">⚖️</span><p>${points.length ? "Registra tu peso otro día para ver la tendencia." : "Aún no registras tu peso."}</p></div>`;
      return;
    }
    const W = 520, H = 200, m = { t: 14, r: 14, b: 26, l: 40 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const vals = points.map(p => p.kg);
    const lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1);
    const t0 = fromISODate(points[0].date).getTime(), t1 = fromISODate(points[points.length - 1].date).getTime();
    const x = d => m.l + (t1 === t0 ? iw / 2 : (fromISODate(d).getTime() - t0) / (t1 - t0) * iw);
    const y = v => m.t + ih - (v - lo) / (hi - lo) * ih;
    const ticks = [lo, (lo + hi) / 2, hi];
    const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)} ${y(p.kg).toFixed(1)}`).join(" ");
    const short = iso => fromISODate(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short" }).replace(".", "");

    el.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución del peso">
        ${ticks.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" class="grid-line"/>
          <text x="${m.l - 8}" y="${y(v) + 4}" class="axis-label" text-anchor="end">${fmt1(v)}</text>`).join("")}
        <text x="${m.l}" y="${H - 6}" class="axis-label">${short(points[0].date)}</text>
        <text x="${W - m.r}" y="${H - 6}" class="axis-label" text-anchor="end">${short(points[points.length - 1].date)}</text>
        <path d="${path}" class="line"/>
        ${points.map((p, i) => `<circle cx="${x(p.date)}" cy="${y(p.kg)}" r="4.5" class="point" data-i="${i}"/>`).join("")}
        ${points.map((p, i) => `<circle cx="${x(p.date)}" cy="${y(p.kg)}" r="14" class="hit" data-i="${i}"/>`).join("")}
      </svg>
      <div class="chart-tip" hidden></div>`;

    const tip = el.querySelector(".chart-tip");
    const svg = el.querySelector("svg");
    el.querySelectorAll(".hit").forEach(c => {
      c.addEventListener("mouseenter", () => {
        const p = points[+c.dataset.i];
        tip.innerHTML = `<b>${escapeHtml(dayLabel(p.date))}</b><span>${fmt1(p.kg)} kg</span>`;
        tip.hidden = false;
        const box = svg.getBoundingClientRect();
        tip.style.left = Math.min(Math.max(x(p.date) / W * box.width, 60), box.width - 60) + "px";
        tip.style.top = (y(p.kg) / H * box.height - 12) + "px";
      });
      c.addEventListener("mouseleave", () => { tip.hidden = true; });
    });
  }

  /* ---------- Inicio ---------- */
  render();
  const pre = qs("objetivo");
  if (pre && OBJECTIVES.some(o => o.id === pre)) openGoalsModal(pre);
};

const POPULAR_FOODS_FOR_MODAL = [
  "huevo", "platano", "pechuga-de-pollo-a-la-plancha", "arroz-blanco-cocido", "palta", "manzana", "pan-integral-de-molde",
  "marraqueta", "avena-en-hojuelas", "leche-semidescremada", "yogurt-griego-natural", "atun-en-agua", "queso-gauda",
  "tomate", "lechuga", "aceite-de-oliva", "cafe-con-leche", "almendras", "fideos-cocidos", "lentejas-cocidas"
];
