/* =========================================================
 * explorar.html — una sola página para alimentos, recetas y ejercicios
 * URL: explorar.html?tipo=alimentos|recetas|ejercicios&cat=<grupo>&q=<texto>&orden=<orden>&page=<n>
 * ========================================================= */

const EXPLORE_PER_PAGE = 24;

const EXPLORE_TABS = {
  alimentos: {
    label: "Alimentos", icon: "🍎", placeholder: "Buscar alimento",
    title: "Alimentos",
    lead: () => `Calorías, proteínas, carbohidratos y grasas por porción de ${FOODS.length} alimentos.`
  },
  recetas: {
    label: "Recetas", icon: "🍲", placeholder: "Buscar receta",
    title: "Recetas",
    lead: () => `${RECIPES.length} recetas con la información nutricional calculada por porción.`
  },
  ejercicios: {
    label: "Ejercicios", icon: "🏃", placeholder: "Buscar ejercicio",
    title: "Ejercicios",
    lead: () => `Calorías quemadas por hora en ${EXERCISES.length} actividades. Ajústalo a tu peso en cada ficha.`
  }
};

/* Subcategorías de la barra según la pestaña */
function exploreChips(tipo) {
  if (tipo === "alimentos") return FOOD_GROUPS.map(g => ({ id: g.id, label: g.name, icon: g.icon }));
  if (tipo === "recetas") return APP.meals.map(m => ({ id: m.id, label: m.label, icon: m.icon }));
  return EX_CATEGORIES.map(c => ({ id: slugify(c), label: c, icon: CATEGORY_ICONS[c] }));
}

function exploreItems(tipo, q, cat) {
  if (tipo === "alimentos") {
    return searchItems(q, { type: "food" }).filter(i => !cat || (groupOf(i.cat) || {}).id === cat);
  }
  if (tipo === "recetas") {
    return searchItems(q, { type: "recipe" }).filter(r => !cat || r.meal === cat);
  }
  return searchExercises(q).filter(e => !cat || slugify(e.cat) === cat);
}

function exploreKcal(tipo, item) {
  return tipo === "ejercicios" ? item.kcalH : nutrientsFor(item, item.portions[0].g).kcal;
}

function exploreCard(tipo, item) {
  if (tipo === "recetas") return recipeCard(item);
  if (tipo === "ejercicios") return exerciseCard(item);
  return foodCard(item);
}

PAGES.explore = function () {
  const root = document.getElementById("explore");
  const state = {
    tipo: EXPLORE_TABS[qs("tipo")] ? qs("tipo") : null,
    cat: qs("cat") || "",
    q: qs("q") || "",
    orden: qs("orden") || "az",
    page: Math.max(1, parseInt(qs("page"), 10) || 1)
  };
  // Búsqueda global sin pestaña: abre la primera pestaña con resultados
  if (!state.tipo) {
    state.tipo = Object.keys(EXPLORE_TABS).find(t => exploreItems(t, state.q, "").length) || "alimentos";
  }

  root.innerHTML = `
    <section class="explore-head">
      <div class="container">
        <div id="ex-crumbs"></div>
        <h1 id="ex-title"></h1>
        <p class="lead" id="ex-lead"></p>
        <form class="search explore-search" role="search" id="ex-form">
          <span class="search-icon" aria-hidden="true">${ICONS.search}</span>
          <input type="search" id="ex-q" autocomplete="off" aria-label="Buscar">
          <button class="btn btn-primary" type="submit">Buscar</button>
        </form>
      </div>
    </section>

    <div class="explore-bar">
      <div class="container">
        <div class="type-tabs" role="tablist" aria-label="Tipo">
          ${Object.entries(EXPLORE_TABS).map(([id, t]) => `
            <button type="button" role="tab" class="type-tab" data-tipo="${id}">
              <span aria-hidden="true">${t.icon}</span>${t.label}<span class="count" data-count="${id}"></span>
            </button>`).join("")}
        </div>
        <div class="cat-bar" id="ex-chips" role="toolbar" aria-label="Categorías"></div>
      </div>
    </div>

    <div class="container">
      <section class="section explore-results" id="ex-top">
        <div class="results-head">
          <p class="muted" id="ex-summary"></p>
          <label class="sort">Ordenar
            <select id="ex-sort" class="input input-sm">
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
              <option value="kcal-desc">Más calorías</option>
              <option value="kcal-asc">Menos calorías</option>
            </select>
          </label>
        </div>
        <div id="ex-grid"></div>
        <nav class="pagination" id="ex-pager" aria-label="Paginación"></nav>
      </section>
      ${ctaBlock()}
    </div>`;

  const $ = s => root.querySelector(s);
  const input = $("#ex-q");
  const chipsEl = $("#ex-chips");
  input.value = state.q;
  $("#ex-sort").value = state.orden;

  function syncUrl() {
    const p = new URLSearchParams();
    p.set("tipo", state.tipo);
    if (state.cat) p.set("cat", state.cat);
    if (state.q) p.set("q", state.q);
    if (state.orden !== "az") p.set("orden", state.orden);
    if (state.page > 1) p.set("page", state.page);
    history.replaceState(null, "", location.pathname + "?" + p);
  }

  function renderChips() {
    const chips = exploreChips(state.tipo);
    if (state.cat && !chips.some(c => c.id === state.cat)) state.cat = "";
    chipsEl.innerHTML = `<button type="button" class="chip" data-cat="">Todos</button>` +
      chips.map(c => `<button type="button" class="chip" data-cat="${c.id}"><span aria-hidden="true">${c.icon}</span> ${escapeHtml(c.label)}</button>`).join("");
  }

  function render() {
    const tab = EXPLORE_TABS[state.tipo];
    const chip = exploreChips(state.tipo).find(c => c.id === state.cat);

    // Encabezado y barra
    document.title = `${chip ? chip.label : tab.title} | ${APP.name}`;
    $("#ex-title").textContent = chip ? chip.label : tab.title;
    $("#ex-lead").textContent = tab.lead();
    $("#ex-crumbs").innerHTML = breadcrumb([{ label: "Inicio", href: "index.html" }, { label: tab.title, href: exploreUrl(state.tipo) }]
      .concat(chip ? [{ label: chip.label }] : []).map((c, i, a) => i === a.length - 1 ? { label: c.label } : c));
    input.placeholder = tab.placeholder;
    root.querySelectorAll(".type-tab").forEach(b => {
      const on = b.dataset.tipo === state.tipo;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on);
    });
    chipsEl.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c.dataset.cat === state.cat));
    setActiveNav(state.tipo);

    // Contadores por pestaña (útil al buscar)
    Object.keys(EXPLORE_TABS).forEach(t => {
      root.querySelector(`[data-count="${t}"]`).textContent = state.q ? exploreItems(t, state.q, "").length : "";
    });

    // Resultados
    let items = exploreItems(state.tipo, state.q, state.cat);
    if (state.orden === "za") items.reverse();
    if (state.orden === "kcal-desc") items.sort((a, b) => exploreKcal(state.tipo, b) - exploreKcal(state.tipo, a));
    if (state.orden === "kcal-asc") items.sort((a, b) => exploreKcal(state.tipo, a) - exploreKcal(state.tipo, b));

    const pages = Math.max(1, Math.ceil(items.length / EXPLORE_PER_PAGE));
    state.page = Math.min(state.page, pages);
    const pageItems = items.slice((state.page - 1) * EXPLORE_PER_PAGE, state.page * EXPLORE_PER_PAGE);
    const noun = { alimentos: ["alimento", "alimentos"], recetas: ["receta", "recetas"], ejercicios: ["ejercicio", "ejercicios"] }[state.tipo];

    $("#ex-summary").innerHTML = `<b>${items.length}</b> ${items.length === 1 ? noun[0] : noun[1]}` +
      (state.q ? ` para “${escapeHtml(state.q)}”` : "") + (pages > 1 ? ` · página ${state.page} de ${pages}` : "");
    $("#ex-grid").className = state.tipo === "recetas" ? "recipe-grid" : "food-grid";
    $("#ex-grid").innerHTML = pageItems.length
      ? pageItems.map(i => exploreCard(state.tipo, i)).join("")
      : `<div class="empty"><span aria-hidden="true">🔍</span><h3>Sin resultados</h3><p>Prueba con otra palabra o elige “Todos” en la barra de categorías.</p></div>`;
    $("#ex-pager").innerHTML = pages > 1 ? paginationHtml(state.page, pages) : "";
    syncUrl();
  }

  // Eventos
  root.querySelectorAll(".type-tab").forEach(b => b.addEventListener("click", () => {
    if (state.tipo === b.dataset.tipo) return;
    state.tipo = b.dataset.tipo; state.cat = ""; state.page = 1;
    renderChips(); render();
  }));
  chipsEl.addEventListener("click", e => {
    const c = e.target.closest(".chip");
    if (!c) return;
    state.cat = c.dataset.cat; state.page = 1;
    render();
    c.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  });
  $("#ex-form").addEventListener("submit", e => { e.preventDefault(); state.q = input.value.trim(); state.page = 1; render(); });
  input.addEventListener("input", () => { state.q = input.value.trim(); state.page = 1; render(); });
  $("#ex-sort").addEventListener("change", e => { state.orden = e.target.value; state.page = 1; render(); });
  $("#ex-pager").addEventListener("click", e => {
    const b = e.target.closest("button[data-page]");
    if (!b || b.disabled) return;
    state.page = +b.dataset.page;
    render();
    $("#ex-top").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  renderChips();
  render();
};
