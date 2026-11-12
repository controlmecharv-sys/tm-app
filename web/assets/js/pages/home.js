/* =========================================================
 * index.html — portada
 * ========================================================= */
PAGES.home = function () {
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

  // Buscador global (busca en alimentos, recetas y ejercicios)
  set("hero-search", searchForm());
  set("hero-popular", ["Plátano:platano", "Huevo:huevo", "Palta:palta", "Arroz:arroz-blanco-cocido", "Correr:correr@"]
    .map(x => {
      const [label, slug] = x.split(":");
      const href = slug.endsWith("@") ? "ejercicio.html?e=" + slug.slice(0, -1) : "alimento.html?a=" + slug;
      return `<a class="chip chip-sm" href="${href}">${label}</a>`;
    }).join(""));
  set("stat-foods", FOODS.length);
  set("stat-recipes", RECIPES.length);
  set("stat-exercises", EXERCISES.length);

  // Mock del diario en el hero
  const demo = [["desayuno", "avena-con-platano-y-chia"], ["almuerzo", "pollo-con-arroz-y-brocoli"], ["snacks", "manzana"]]
    .map(([meal, slug]) => {
      const item = ITEM_BY_SLUG[slug];
      return item ? { meal, item, n: nutrientsFor(item, item.portions[0].g) } : null;
    }).filter(Boolean);
  const sum = k => demo.reduce((s, d) => s + d.n[k], 0);
  set("phone-mock", `
    <div class="pm-head"><b>Hoy</b><span>${fmt(sum("kcal"))} / 2.000 kcal</span></div>
    <div class="pm-ring"><span style="width:${Math.min(100, sum("kcal") / 20)}%"></span></div>
    <div class="pm-macros">
      <span><i class="dot" style="background:${MACRO_COLORS.p}"></i>P ${fmt(sum("p"))} g</span>
      <span><i class="dot" style="background:${MACRO_COLORS.c}"></i>C ${fmt(sum("c"))} g</span>
      <span><i class="dot" style="background:${MACRO_COLORS.f}"></i>G ${fmt(sum("f"))} g</span>
    </div>
    ${demo.map(d => `
      <div class="pm-meal">
        <small>${mealById(d.meal).label}</small>
        <div class="pm-entry"><span>${d.item.icon}</span><b>${escapeHtml(d.item.name)}</b><em>${fmt(d.n.kcal)} kcal</em></div>
      </div>`).join("")}
    <div class="pm-add">${ICONS.plus}</div>`);

  // Accesos rápidos por categoría (llevan a explorar.html con la barra ya filtrada)
  set("quick-cats",
    FOOD_GROUPS.map(g => `
      <a class="quick-cat" href="${exploreUrl("alimentos", g.id)}">
        <span aria-hidden="true">${g.icon}</span>${escapeHtml(g.name)}
      </a>`).join("") +
    `<a class="quick-cat featured" href="${exploreUrl("recetas")}"><span aria-hidden="true">🍲</span>Recetas</a>
     <a class="quick-cat featured" href="${exploreUrl("ejercicios")}"><span aria-hidden="true">🏃</span>Ejercicios</a>`);

  // Paso 1: ejemplo de búsqueda
  set("step-search", searchItems("pollo", { type: "food" }).slice(0, 3).map(i =>
    `<div class="pm-entry"><span>${i.icon}</span><b>${escapeHtml(i.name)}</b><em>${fmt(nutrientsFor(i, i.portions[0].g).kcal)} kcal</em></div>`).join(""));

  // Paso 2: ejemplo de porción
  const palta = ITEM_BY_SLUG.palta;
  if (palta) {
    const n = nutrientsFor(palta, palta.portions[0].g);
    set("step-portion", `
      <div class="pm-entry"><span>${palta.icon}</span><b>Palta · ${escapeHtml(portionText(palta, 1, palta.portions[0]))}</b><em>${fmt(n.kcal)} kcal</em></div>
      <div class="mini-tiles"><span><b>${fmt1(n.p)} g</b>proteínas</span><span><b>${fmt1(n.c)} g</b>carbs</span><span><b>${fmt1(n.f)} g</b>grasas</span></div>`);
  }

  // Paso 3: ejemplo de progreso
  set("step-progress", `
    <div class="mini-progress"><span class="mp-line"><b>1.640</b> / 2.000 kcal</span><span class="mp-track"><i style="width:82%"></i></span></div>
    ${macroBar({ p: 110, c: 190, f: 52 })}`);

  // FAQ
  document.querySelectorAll(".faq-item button").forEach(btn => {
    btn.addEventListener("click", () => {
      const open = btn.parentElement.classList.toggle("open");
      btn.setAttribute("aria-expanded", open);
    });
  });
};
