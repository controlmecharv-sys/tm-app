/* =========================================================
 * alimento.html — ficha única para alimentos y recetas
 * (los listados viven en explorar.html)
 * ========================================================= */

function renderItemDetail(item, root) {
  const isRecipe = item.type === "recipe";
  const goals = Store.getGoals();
  const group = isRecipe ? null : groupOf(item.cat);
  const crumbs = isRecipe
    ? [{ label: "Inicio", href: "index.html" }, { label: "Recetas", href: exploreUrl("recetas") },
       { label: mealById(item.meal).label, href: exploreUrl("recetas", item.meal) }, { label: item.name }]
    : [{ label: "Inicio", href: "index.html" }, { label: "Alimentos", href: exploreUrl("alimentos") }]
       .concat(group ? [{ label: group.name, href: exploreUrl("alimentos", group.id) }] : [])
       .concat([{ label: item.name }]);
  const moreUrl = isRecipe ? exploreUrl("recetas", item.meal) : exploreUrl("alimentos", group && group.id);

  const related = (isRecipe
    ? RECIPES.filter(r => r.meal === item.meal && r !== item).concat(RECIPES.filter(r => r.meal !== item.meal))
    : ITEMS.filter(i => i.type === "food" && i.cat === item.cat && i !== item)
        .concat(ITEMS.filter(i => i.type === "food" && i.cat !== item.cat && group && groupOf(i.cat) === group))
  ).slice(0, 8);
  const adder = addToDiaryControl(item, { onChange: update });

  document.title = `Calorías de ${item.name} | ${APP.name}`;
  setActiveNav(isRecipe ? "recetas" : "alimentos");

  root.innerHTML = `
    ${breadcrumb(crumbs)}
    <div class="detail-layout">
      <div class="detail-col">
        <div class="panel item-hero">
          <div class="item-hero-top">
            <span class="badge">${ICONS.check} ${isRecipe ? "Receta" : "Verificado"}</span>
            <button type="button" class="icon-btn" id="share" aria-label="Compartir">${ICONS.share}</button>
          </div>
          <span class="item-icon" aria-hidden="true">${item.icon}</span>
          <h1>${escapeHtml(item.name)}</h1>
          <p class="muted">${isRecipe
            ? `${escapeHtml(mealById(item.meal).label)} · ${item.minutes} min · ${item.servings} ${item.servings === 1 ? "porción" : "porciones"}`
            : "Genérico · " + escapeHtml(item.cat)}</p>
          <p class="item-per" id="item-per"></p>
          <div class="tiles">
            <div class="tile"><b id="t-kcal">0</b><span>kcal</span></div>
            <div class="tile"><b id="t-p">0</b><span>proteínas</span></div>
            <div class="tile"><b id="t-c">0</b><span>carbs</span></div>
            <div class="tile"><b id="t-f">0</b><span>grasas</span></div>
          </div>
          <div id="macro-bar"></div>
        </div>
        ${adder.html}
      </div>

      <div class="detail-col">
        <div class="panel">
          <h2 class="panel-title">Información nutricional</h2>
          <div id="nf"></div>
        </div>

        ${isRecipe ? `
        <div class="panel">
          <h2 class="panel-title">Ingredientes <small class="muted">para ${item.servings} ${item.servings === 1 ? "porción" : "porciones"}</small></h2>
          <ul class="ingredients">
            ${item.ingredients.map(i => `
              <li>
                <a href="${itemUrl(i.food)}">
                  <span class="ing-icon" aria-hidden="true">${i.food.icon}</span>
                  <span class="ing-name">${escapeHtml(i.food.name)}</span>
                  <span class="ing-qty">${fmt1(i.g)} ${i.food.unit}</span>
                  <span class="ing-kcal">${fmt(nutrientsFor(i.food, i.g).kcal)} kcal</span>
                </a>
              </li>`).join("")}
          </ul>
        </div>
        <div class="panel">
          <h2 class="panel-title">Preparación</h2>
          <ol class="steps">${item.steps.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ol>
        </div>` : ""}

        ${related.length ? `
        <details class="panel accordion" open>
          <summary><h2 class="panel-title">${isRecipe ? "Más recetas" : "Alimentos similares"}</h2><span class="acc-icon" aria-hidden="true">${ICONS.plus}</span></summary>
          <div class="related-list">${related.map(foodCard).join("")}</div>
          <a class="link related-more" href="${moreUrl}">Ver todos ›</a>
        </details>` : ""}
      </div>
    </div>`;

  adder.bind(root);

  root.querySelector("#share").addEventListener("click", async () => {
    try {
      if (navigator.share) await navigator.share({ title: item.name, url: location.href });
      else { await navigator.clipboard.writeText(location.href); toast("Enlace copiado"); }
    } catch (e) { /* cancelado */ }
  });

  function update({ qty, portion, grams }) {
    const n = nutrientsFor(item, grams);
    const label = portionText(item, qty, portion);
    root.querySelector("#item-per").textContent = `Datos por ${label}`;
    root.querySelector("#t-kcal").textContent = fmt(n.kcal);
    root.querySelector("#t-p").textContent = fmt1(n.p) + " g";
    root.querySelector("#t-c").textContent = fmt1(n.c) + " g";
    root.querySelector("#t-f").textContent = fmt1(n.f) + " g";
    root.querySelector("#macro-bar").innerHTML = macroBar(n);
    root.querySelector("#nf").innerHTML = nutritionPanel(n, label, goals.kcal);
  }
}

function renderNotFound(root, kind, tipo) {
  root.innerHTML = `
    <div class="empty big">
      <span aria-hidden="true">🤷</span>
      <h1>No encontramos ese ${kind}</h1>
      <p>Puede que el enlace esté mal escrito. Búscalo aquí:</p>
      ${searchForm({ action: "explorar.html" })}
      <a class="link" href="${exploreUrl(tipo)}">Ver todos ›</a>
    </div>`;
}

PAGES.food = function () {
  const root = document.getElementById("detail");
  // Compatibilidad con enlaces antiguos de receta (?r=)
  const item = ITEM_BY_SLUG[qs("a") || qs("r") || ""];
  if (!item) return renderNotFound(root, "alimento", "alimentos");
  renderItemDetail(item, root);
};
