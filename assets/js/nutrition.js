/* =========================================================
 * T&M — modelo de nutrición
 * Construye alimentos y recetas, calcula nutrientes por cantidad
 * y renderiza los componentes de alimentos reutilizables.
 * ========================================================= */

const NUTRIENT_KEYS = ["kcal", "p", "c", "f", "fiber", "sugar", "satfat", "sodium", "chol"];

/* Valores diarios de referencia (dieta de 2.000 kcal) */
const DAILY_VALUES = { kcal: 2000, f: 78, satfat: 20, chol: 300, sodium: 2300, c: 275, fiber: 28, sugar: 50, p: 50 };

/* Colores de macros definidos en styles.css (cambian con el modo oscuro) */
const MACRO_COLORS = { p: "var(--p)", c: "var(--c)", f: "var(--f)" };

function emptyNutrients() {
  return Object.fromEntries(NUTRIENT_KEYS.map(k => [k, 0]));
}

/* ---------- Alimentos ---------- */
const FOODS = RAW_FOODS.concat(typeof RAW_FOODS_CL !== "undefined" ? RAW_FOODS_CL : []).map(([name, cat, icon, n, portions, unit]) => {
  const per100 = Object.fromEntries(NUTRIENT_KEYS.map((k, i) => [k, n[i]]));
  return {
    type: "food",
    slug: slugify(name),
    name, cat, icon,
    unit: unit || "g",
    per100,
    portions: portions.map(([label, g]) => ({ label, g }))
  };
});

/* ---------- Recetas ---------- */
const FOOD_BY_NAME = Object.fromEntries(FOODS.map(f => [f.name, f]));

const RECIPES = RAW_RECIPES.map(r => {
  const ingredients = r.ingredients.map(([name, g]) => {
    const food = FOOD_BY_NAME[name];
    if (!food) console.warn("Ingrediente no encontrado:", name, "en", r.name);
    return { food, g };
  }).filter(i => i.food);
  const totalG = ingredients.reduce((s, i) => s + i.g, 0);
  const total = emptyNutrients();
  ingredients.forEach(i => NUTRIENT_KEYS.forEach(k => { total[k] += i.food.per100[k] * i.g / 100; }));
  const per100 = Object.fromEntries(NUTRIENT_KEYS.map(k => [k, total[k] / totalG * 100]));
  const servingG = Math.round(totalG / r.servings);
  return {
    type: "recipe",
    slug: slugify(r.name),
    name: r.name,
    cat: "Recetas",
    icon: r.icon,
    unit: "g",
    meal: r.meal,
    servings: r.servings,
    minutes: r.minutes,
    steps: r.steps,
    ingredients,
    totalG,
    per100,
    portions: [{ label: "porción", g: servingG }]
  };
});

const ITEMS = FOODS.concat(RECIPES).sort((a, b) => a.name.localeCompare(b.name, "es"));
const ITEM_BY_SLUG = Object.fromEntries(ITEMS.map(i => [i.slug, i]));
const CATEGORY_LIST = Object.keys(FOOD_CATEGORIES).filter(c => ITEMS.some(i => i.cat === c));

/* Alimentos y recetas comparten la misma ficha */
function itemUrl(item) {
  return "alimento.html?a=" + encodeURIComponent(item.slug);
}

/* Grupos de la barra de categorías: agrupan las categorías finas de alimentos */
const FOOD_GROUPS = [
  { name: "Frutas y verduras", icon: "🍎", cats: ["Frutas", "Verduras", "Tubérculos"] },
  { name: "Carnes y huevos", icon: "🍗", cats: ["Pollo", "Res", "Cerdo", "Pavo", "Fiambres", "Huevo"] },
  { name: "Pescados y mariscos", icon: "🐟", cats: ["Pescado", "Mariscos"] },
  { name: "Lácteos", icon: "🥛", cats: ["Leche", "Bebidas vegetales", "Quesos", "Yogurt"] },
  { name: "Panes y cereales", icon: "🍞", cats: ["Panes", "Cereales", "Granos", "Pasta"] },
  { name: "Legumbres y frutos secos", icon: "🫘", cats: ["Legumbres", "Frutos secos", "Semillas"] },
  { name: "Aceites y salsas", icon: "🫒", cats: ["Aceites", "Untables", "Salsas"] },
  { name: "Bebidas", icon: "🥤", cats: ["Bebidas", "Café e infusiones", "Bebidas alcohólicas"] },
  { name: "Snacks y dulces", icon: "🍫", cats: ["Snacks", "Dulces", "Chocolates", "Helados"] },
  { name: "Platos preparados", icon: "🍛", cats: ["Platos preparados", "Restaurantes"] },
  { name: "Suplementos", icon: "💪", cats: ["Suplementos"] }
].map(g => ({ ...g, id: slugify(g.name) }));

function groupOf(cat) {
  return FOOD_GROUPS.find(g => g.cats.includes(cat)) || null;
}
function exploreUrl(tipo, cat) {
  return `explorar.html?tipo=${tipo}` + (cat ? `&cat=${encodeURIComponent(cat)}` : "");
}

function searchItems(query, { type, cat } = {}) {
  let q = normalize((query || "").trim()).replace(/\s+/g, " ");
  let list = ITEMS;
  if (type) list = list.filter(i => i.type === type);
  if (cat) list = list.filter(i => i.cat === cat);
  if (!q) return list.slice();
  const aliases = typeof SEARCH_ALIASES !== "undefined" ? SEARCH_ALIASES : {};
  // Sinónimos de varias palabras ("dulce de leche" -> "manjar")
  Object.keys(aliases).forEach(k => { if (k.includes(" ") && q.includes(k)) q = q.replace(k, aliases[k]); });
  const terms = q.split(" ");
  // Cada término acepta variantes: él mismo, su sinónimo y su singular
  const variants = terms.map(t => {
    const v = [t];
    if (aliases[t]) v.push(aliases[t]);
    if (t.length > 4 && t.endsWith("es")) v.push(t.slice(0, -2));
    if (t.length > 3 && t.endsWith("s")) v.push(t.slice(0, -1));
    return v;
  });
  const scored = [];
  list.forEach(i => {
    const name = normalize(i.name);
    const hay = name + " " + normalize(i.cat);
    if (!variants.every(v => v.some(t => hay.includes(t)))) return;
    // Prioriza coincidencias al inicio del nombre
    const first = variants[0];
    const score = name.startsWith(q) || first.some(t => name.startsWith(t)) ? 0
      : name.split(/\s+/).some(w => first.some(t => w.startsWith(t))) ? 1 : 2;
    scored.push([score, i]);
  });
  return scored.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name, "es")).map(s => s[1]);
}

/* Nutrientes para una cantidad en gramos */
function nutrientsFor(item, grams) {
  const out = {};
  NUTRIENT_KEYS.forEach(k => { out[k] = item.per100[k] * grams / 100; });
  return out;
}

/* Lista de porciones incluyendo gramos/ml */
function portionOptions(item) {
  return item.portions.concat([{ label: item.unit === "ml" ? "mililitro" : "gramo", g: 1, isUnit: true }]);
}

/* Pluralización simple en español */
function pluralWord(w) {
  if (/^(de|con|en|y|\(|\d)/i.test(w) || w.endsWith(")")) return w;
  if (/[aeiouáéó]$/i.test(w)) return w + "s";
  if (/z$/i.test(w)) return w.slice(0, -1) + "ces";
  if (/s$/i.test(w)) return w;
  return w + "es";
}
function pluralize(label, qty) {
  if (qty === 1) return label;
  const words = label.split(" ");
  // Pluraliza hasta la primera preposición ("taza de jugo" → "tazas de jugo")
  let stop = false;
  return words.map(w => {
    if (stop) return w;
    if (/^(de|con|en)$/i.test(w) || w.startsWith("(")) { stop = true; return w; }
    return pluralWord(w);
  }).join(" ");
}

function portionText(item, qty, portion) {
  const unit = item.unit;
  if (portion.isUnit) return `${fmt1(qty)} ${unit}`;
  return `${fmt1(qty)} ${pluralize(portion.label, qty)} (${fmt(qty * portion.g)} ${unit})`;
}
function portionOptionLabel(item, p) {
  if (p.isUnit) return item.unit === "ml" ? "Mililitros (ml)" : "Gramos (g)";
  const l = p.label.charAt(0).toUpperCase() + p.label.slice(1);
  return `${l} (${fmt(p.g)} ${item.unit})`;
}

/* Porcentaje de calorías de cada macro */
function macroSplit(n) {
  const p = n.p * 4, c = n.c * 4, f = n.f * 9;
  const total = p + c + f;
  if (!total) return { p: 0, c: 0, f: 0 };
  return { p: Math.round(p / total * 100), c: Math.round(c / total * 100), f: Math.round(f / total * 100) };
}

/* ---------- Componentes ---------- */
function foodCard(item) {
  const p = item.portions[0];
  const n = nutrientsFor(item, p.g);
  return `
    <a class="food-card" href="${itemUrl(item)}">
      <span class="food-icon" aria-hidden="true">${item.icon}</span>
      <span class="food-card-body">
        <strong class="food-name">${escapeHtml(item.name)}</strong>
        <span class="food-meta">${item.type === "recipe" ? "Receta" : "Genérico"} · ${escapeHtml(portionText(item, 1, p))}</span>
      </span>
      <span class="food-kcal">${fmt(n.kcal)} <small>kcal</small></span>
    </a>`;
}

function recipeCard(r) {
  const n = nutrientsFor(r, r.portions[0].g);
  return `
    <a class="recipe-card" href="${itemUrl(r)}">
      <span class="recipe-visual meal-${r.meal}" aria-hidden="true">${r.icon}</span>
      <span class="recipe-body">
        <span class="recipe-tag">${escapeHtml(mealById(r.meal).label)}</span>
        <strong>${escapeHtml(r.name)}</strong>
        <span class="recipe-meta">
          <span>${ICONS.clock} ${r.minutes} min</span>
          <span>${ICONS.users} ${r.servings} ${r.servings === 1 ? "porción" : "porciones"}</span>
        </span>
        <span class="recipe-macros">
          <b>${fmt(n.kcal)} kcal</b>
          <span><i class="dot" style="background:${MACRO_COLORS.p}"></i>P ${fmt(n.p)} g</span>
          <span><i class="dot" style="background:${MACRO_COLORS.c}"></i>C ${fmt(n.c)} g</span>
          <span><i class="dot" style="background:${MACRO_COLORS.f}"></i>G ${fmt(n.f)} g</span>
        </span>
      </span>
    </a>`;
}

/* Barra horizontal de reparto de macros (segmentos con separación) */
function macroBar(n, { legend = true } = {}) {
  const s = macroSplit(n);
  const seg = (k, v) => v > 0 ? `<span style="flex:${v};background:${MACRO_COLORS[k]}"></span>` : "";
  return `
    <div class="macro-bar" role="img" aria-label="Proteínas ${s.p}%, carbohidratos ${s.c}%, grasas ${s.f}% de las calorías">
      ${seg("p", s.p)}${seg("c", s.c)}${seg("f", s.f)}
      ${!s.p && !s.c && !s.f ? '<span style="flex:1;background:var(--line)"></span>' : ""}
    </div>
    ${legend ? `
    <div class="macro-legend">
      <span><i class="dot" style="background:${MACRO_COLORS.p}"></i>Proteínas ${s.p}%</span>
      <span><i class="dot" style="background:${MACRO_COLORS.c}"></i>Carbohidratos ${s.c}%</span>
      <span><i class="dot" style="background:${MACRO_COLORS.f}"></i>Grasas ${s.f}%</span>
    </div>` : ""}`;
}

/* Tabla de información nutricional (estilo etiqueta) */
function nutritionPanel(n, portionLabel, kcalGoal = DAILY_VALUES.kcal) {
  const row = (label, value, unit, dvKey, cls = "") => {
    const dv = dvKey === "kcal" ? kcalGoal : DAILY_VALUES[dvKey];
    const pct = dv ? Math.min(100, value / dv * 100) : 0;
    return `
      <div class="nf-row ${cls}">
        <div class="nf-line">
          <span>${label}</span>
          <span><b>${unit === "mg" ? fmt(value) : fmt1(value)}</b> ${unit}${dv ? ` <small>· ${Math.round(value / dv * 100)}%</small>` : ""}</span>
        </div>
        ${dv ? `<div class="nf-track"><span style="width:${pct}%"></span></div>` : ""}
      </div>`;
  };
  return `
    <div class="nf">
      <div class="nf-row nf-head">
        <div class="nf-line"><span>Porción</span><span><b>${escapeHtml(portionLabel)}</b></span></div>
      </div>
      <div class="nf-row nf-kcal">
        <div class="nf-line"><span>Calorías</span><span><b>${fmt(n.kcal)}</b> / ${fmt(kcalGoal)} kcal <small>· ${Math.round(n.kcal / kcalGoal * 100)}%</small></span></div>
        <div class="nf-track"><span style="width:${Math.min(100, n.kcal / kcalGoal * 100)}%"></span></div>
      </div>
      ${row("Grasas totales", n.f, "g", "f")}
      ${row("Grasas saturadas", n.satfat, "g", "satfat", "sub")}
      ${row("Colesterol", n.chol, "mg", "chol")}
      ${row("Sodio", n.sodium, "mg", "sodium")}
      ${row("Carbohidratos totales", n.c, "g", "c")}
      ${row("Fibra", n.fiber, "g", "fiber", "sub")}
      ${row("Azúcares", n.sugar, "g", "sugar", "sub")}
      ${row("Proteína", n.p, "g", "p")}
      <p class="nf-note">El % indica cuánto aporta a una dieta de referencia de ${fmt(kcalGoal)} kcal.</p>
    </div>`;
}
