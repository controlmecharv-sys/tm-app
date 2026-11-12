/*
 * Base de datos de alimentos genéricos.
 * Valores aproximados por 100 g (o 100 ml), basados en tablas de composición (USDA / INTA).
 *
 * Formato:
 *   [nombre, categoría, ícono,
 *    [kcal, proteína g, carbohidratos g, grasa g, fibra g, azúcares g, grasa saturada g, sodio mg, colesterol mg],
 *    [[porción, gramos], ...],
 *    unidad opcional ("ml" para líquidos)]
 * La primera porción es la que se muestra por defecto.
 */
const FOOD_CATEGORIES = {
  "Recetas": "🍲",
  "Frutas": "🍎",
  "Verduras": "🥦",
  "Tubérculos": "🥔",
  "Huevo": "🥚",
  "Pollo": "🍗",
  "Res": "🥩",
  "Cerdo": "🥓",
  "Pavo": "🦃",
  "Fiambres": "🥪",
  "Pescado": "🐟",
  "Mariscos": "🦐",
  "Leche": "🥛",
  "Bebidas vegetales": "🌾",
  "Quesos": "🧀",
  "Yogurt": "🍶",
  "Panes": "🍞",
  "Cereales": "🥣",
  "Granos": "🍚",
  "Pasta": "🍝",
  "Legumbres": "🫘",
  "Frutos secos": "🥜",
  "Semillas": "🌻",
  "Aceites": "🫒",
  "Untables": "🧈",
  "Salsas": "🥫",
  "Bebidas": "🥤",
  "Café e infusiones": "☕",
  "Bebidas alcohólicas": "🍷",
  "Snacks": "🍿",
  "Dulces": "🍬",
  "Chocolates": "🍫",
  "Helados": "🍨",
  "Suplementos": "💪",
  "Platos preparados": "🍛",
  "Restaurantes": "🍔"
};

const RAW_FOODS = [
  // ---------- Frutas ----------
  ["Plátano", "Frutas", "🍌", [89, 1.1, 22.8, 0.3, 2.6, 12.2, 0.1, 1, 0], [["mediano", 130], ["pequeño", 100], ["grande", 150]]],
  ["Manzana", "Frutas", "🍎", [52, 0.3, 13.8, 0.2, 2.4, 10.4, 0, 1, 0], [["unidad", 175], ["taza en cubos", 125]]],
  ["Naranja", "Frutas", "🍊", [47, 0.9, 11.8, 0.1, 2.4, 9.4, 0, 0, 0], [["unidad", 130]]],
  ["Mandarina", "Frutas", "🍊", [53, 0.8, 13.3, 0.3, 1.8, 10.6, 0, 2, 0], [["unidad", 100]]],
  ["Piña", "Frutas", "🍍", [50, 0.5, 13.1, 0.1, 1.4, 9.9, 0, 1, 0], [["taza", 165], ["rodaja", 85]]],
  ["Kiwi", "Frutas", "🥝", [61, 1.1, 14.7, 0.5, 3, 9, 0, 3, 0], [["unidad", 75]]],
  ["Pera", "Frutas", "🍐", [57, 0.4, 15.2, 0.1, 3.1, 9.8, 0, 1, 0], [["unidad", 180]]],
  ["Arándanos", "Frutas", "🫐", [57, 0.7, 14.5, 0.3, 2.4, 10, 0, 1, 0], [["media taza", 74], ["taza", 148]]],
  ["Papaya", "Frutas", "🥭", [43, 0.5, 10.8, 0.3, 1.7, 7.8, 0.1, 8, 0], [["media taza", 70], ["taza", 140]]],
  ["Melón", "Frutas", "🍈", [34, 0.8, 8.2, 0.2, 0.9, 7.9, 0.1, 16, 0], [["media taza", 80], ["taza", 160]]],
  ["Uvas", "Frutas", "🍇", [69, 0.7, 18.1, 0.2, 0.9, 15.5, 0.1, 2, 0], [["media taza", 75], ["taza", 150]]],
  ["Frutillas", "Frutas", "🍓", [32, 0.7, 7.7, 0.3, 2, 4.9, 0, 1, 0], [["media taza", 75], ["taza", 150], ["unidad", 12]]],
  ["Palta", "Frutas", "🥑", [160, 2, 8.5, 14.7, 6.7, 0.7, 2.1, 7, 0], [["media unidad", 120], ["cucharada", 15], ["unidad", 240]]],
  ["Sandía", "Frutas", "🍉", [30, 0.6, 7.6, 0.2, 0.4, 6.2, 0, 1, 0], [["taza", 152], ["tajada", 280]]],
  ["Mango", "Frutas", "🥭", [60, 0.8, 15, 0.4, 1.6, 13.7, 0.1, 1, 0], [["taza", 165], ["unidad", 200]]],
  ["Durazno", "Frutas", "🍑", [39, 0.9, 9.5, 0.3, 1.5, 8.4, 0, 0, 0], [["unidad", 150]]],
  ["Frambuesas", "Frutas", "🍓", [52, 1.2, 11.9, 0.7, 6.5, 4.4, 0, 1, 0], [["taza", 123], ["media taza", 62]]],
  ["Cerezas", "Frutas", "🍒", [63, 1.1, 16, 0.2, 2.1, 12.8, 0, 0, 0], [["taza", 140], ["unidad", 8]]],
  ["Limón", "Frutas", "🍋", [29, 1.1, 9.3, 0.3, 2.8, 2.5, 0, 2, 0], [["unidad", 60], ["cucharada de jugo", 15]]],
  ["Ciruela", "Frutas", "🟣", [46, 0.7, 11.4, 0.3, 1.4, 9.9, 0, 0, 0], [["unidad", 66]]],
  ["Chirimoya", "Frutas", "💚", [75, 1.6, 17.7, 0.7, 3, 12.9, 0.2, 7, 0], [["taza", 160]]],
  ["Granada", "Frutas", "🔴", [83, 1.7, 18.7, 1.2, 4, 13.7, 0.1, 3, 0], [["media taza", 87]]],
  ["Pasas", "Frutas", "🍇", [299, 3.1, 79.2, 0.5, 3.7, 59.2, 0.1, 11, 0], [["cucharada", 10], ["cuarto de taza", 40]]],

  // ---------- Verduras ----------
  ["Lechuga", "Verduras", "🥬", [15, 1.4, 2.9, 0.2, 1.3, 0.8, 0, 28, 0], [["taza", 36], ["hoja", 10]]],
  ["Tomate", "Verduras", "🍅", [18, 0.9, 3.9, 0.2, 1.2, 2.6, 0, 5, 0], [["unidad", 123], ["rodaja", 20]]],
  ["Zanahoria", "Verduras", "🥕", [41, 0.9, 9.6, 0.2, 2.8, 4.7, 0, 69, 0], [["unidad", 61], ["taza rallada", 110]]],
  ["Brócoli", "Verduras", "🥦", [34, 2.8, 6.6, 0.4, 2.6, 1.7, 0, 33, 0], [["taza", 91]]],
  ["Espinaca", "Verduras", "🥬", [23, 2.9, 3.6, 0.4, 2.2, 0.4, 0.1, 79, 0], [["taza", 30]]],
  ["Pepino", "Verduras", "🥒", [15, 0.7, 3.6, 0.1, 0.5, 1.7, 0, 2, 0], [["media unidad", 150], ["taza en rodajas", 104]]],
  ["Cebolla", "Verduras", "🧅", [40, 1.1, 9.3, 0.1, 1.7, 4.2, 0, 4, 0], [["unidad", 110], ["cucharada picada", 10]]],
  ["Pimentón", "Verduras", "🫑", [31, 1, 6, 0.3, 2.1, 4.2, 0, 4, 0], [["unidad", 120]]],
  ["Zapallo italiano", "Verduras", "🥒", [17, 1.2, 3.1, 0.3, 1, 2.5, 0.1, 8, 0], [["unidad", 196]]],
  ["Coliflor", "Verduras", "🥦", [25, 1.9, 5, 0.3, 2, 1.9, 0.1, 30, 0], [["taza", 107]]],
  ["Choclo", "Verduras", "🌽", [86, 3.3, 19, 1.4, 2.7, 3.2, 0.3, 15, 0], [["taza", 145], ["mazorca", 90]]],
  ["Champiñones", "Verduras", "🍄", [22, 3.1, 3.3, 0.3, 1, 2, 0, 5, 0], [["taza", 70]]],
  ["Repollo", "Verduras", "🥬", [25, 1.3, 5.8, 0.1, 2.5, 3.2, 0, 18, 0], [["taza", 89]]],
  ["Betarraga", "Verduras", "🟣", [43, 1.6, 9.6, 0.2, 2.8, 6.8, 0, 78, 0], [["unidad", 82]]],
  ["Porotos verdes", "Verduras", "🫛", [31, 1.8, 7, 0.2, 2.7, 3.3, 0, 6, 0], [["taza", 100]]],
  ["Apio", "Verduras", "🥬", [16, 0.7, 3, 0.2, 1.6, 1.3, 0, 80, 0], [["tallo", 40]]],
  ["Ajo", "Verduras", "🧄", [149, 6.4, 33, 0.5, 2.1, 1, 0.1, 17, 0], [["diente", 3]]],
  ["Zapallo", "Verduras", "🎃", [26, 1, 6.5, 0.1, 0.5, 2.8, 0.1, 1, 0], [["taza", 116]]],
  ["Berenjena", "Verduras", "🍆", [25, 1, 5.9, 0.2, 3, 3.5, 0, 2, 0], [["taza", 82]]],
  ["Espárragos", "Verduras", "🌱", [20, 2.2, 3.9, 0.1, 2.1, 1.9, 0, 2, 0], [["porción (5 unidades)", 80]]],

  // ---------- Tubérculos ----------
  ["Papa cocida", "Tubérculos", "🥔", [87, 1.9, 20.1, 0.1, 1.8, 0.9, 0, 4, 0], [["unidad mediana", 150], ["taza", 156]]],
  ["Camote", "Tubérculos", "🍠", [86, 1.6, 20.1, 0.1, 3, 4.2, 0, 55, 0], [["unidad", 130]]],
  ["Yuca cocida", "Tubérculos", "🥔", [160, 1.4, 38.1, 0.3, 1.8, 1.7, 0.1, 14, 0], [["taza", 103]]],
  ["Puré de papas", "Tubérculos", "🥔", [106, 1.9, 16, 4.2, 1.5, 1.3, 2.6, 300, 10], [["taza", 210], ["media taza", 105]]],

  // ---------- Huevo ----------
  ["Huevo", "Huevo", "🥚", [143, 12.6, 0.7, 9.5, 0, 0.4, 3.1, 142, 372], [["unidad", 50], ["unidad grande", 60]]],
  ["Clara de huevo", "Huevo", "🥚", [52, 10.9, 0.7, 0.2, 0, 0.7, 0, 166, 0], [["clara", 33]]],
  ["Huevo duro", "Huevo", "🥚", [155, 12.6, 1.1, 10.6, 0, 1.1, 3.3, 124, 373], [["unidad", 50]]],
  ["Huevo revuelto", "Huevo", "🍳", [149, 10, 2.2, 11, 0, 1.4, 3.3, 145, 277], [["porción (2 huevos)", 120]]],

  // ---------- Pollo ----------
  ["Pechuga de pollo a la plancha", "Pollo", "🍗", [165, 31, 0, 3.6, 0, 0, 1, 74, 85], [["filete", 120], ["porción", 150]]],
  ["Trutro de pollo asado", "Pollo", "🍗", [209, 26, 0, 10.9, 0, 0, 3, 84, 133], [["unidad", 110]]],
  ["Pollo asado con piel", "Pollo", "🍗", [239, 27.3, 0, 13.6, 0, 0, 3.8, 82, 88], [["porción", 150]]],
  ["Nuggets de pollo", "Pollo", "🍗", [296, 15, 15, 19, 1, 0.5, 3.5, 540, 50], [["porción (6 unidades)", 96], ["unidad", 16]]],

  // ---------- Res ----------
  ["Carne molida 10% grasa", "Res", "🥩", [217, 26, 0, 11.8, 0, 0, 4.7, 72, 78], [["porción", 100]]],
  ["Bistec de res", "Res", "🥩", [250, 26, 0, 15, 0, 0, 6, 60, 80], [["bistec", 150]]],
  ["Posta negra", "Res", "🥩", [170, 30, 0, 5, 0, 0, 1.9, 56, 80], [["porción", 120]]],
  ["Hamburguesa de vacuno", "Res", "🍔", [254, 17.2, 0, 20, 0, 0, 7.6, 75, 71], [["unidad", 113]]],

  // ---------- Cerdo ----------
  ["Lomo de cerdo", "Cerdo", "🥩", [172, 27, 0, 6.5, 0, 0, 2.3, 55, 80], [["porción", 120]]],
  ["Chuleta de cerdo", "Cerdo", "🥩", [231, 25, 0, 14, 0, 0, 5, 62, 80], [["unidad", 150]]],
  ["Tocino", "Cerdo", "🥓", [541, 37, 1.4, 42, 0, 0, 14, 1717, 110], [["lonja", 8]]],

  // ---------- Pavo ----------
  ["Pechuga de pavo", "Pavo", "🦃", [135, 29.9, 0, 1.7, 0, 0, 0.5, 70, 70], [["porción", 120]]],

  // ---------- Fiambres ----------
  ["Jamón de pavo", "Fiambres", "🥪", [104, 17, 2, 3, 0, 1.5, 1, 1000, 45], [["lámina", 20]]],
  ["Jamón de cerdo", "Fiambres", "🥪", [145, 21, 1.5, 6, 0, 1, 2, 1200, 53], [["lámina", 20]]],
  ["Salame", "Fiambres", "🍕", [407, 22, 1.2, 34, 0, 1, 12, 1890, 79], [["lámina", 10]]],
  ["Vienesa", "Fiambres", "🌭", [290, 11, 3, 26, 0, 1.5, 9.5, 1000, 70], [["unidad", 45]]],

  // ---------- Pescado ----------
  ["Salmón", "Pescado", "🐟", [208, 20, 0, 13, 0, 0, 3.1, 59, 55], [["filete", 150]]],
  ["Atún en agua", "Pescado", "🥫", [116, 26, 0, 1, 0, 0, 0.2, 247, 30], [["lata escurrida", 105]]],
  ["Merluza", "Pescado", "🐟", [86, 18, 0, 1.3, 0, 0, 0.3, 90, 50], [["filete", 150]]],
  ["Reineta", "Pescado", "🐟", [128, 26, 0, 2.7, 0, 0, 0.9, 56, 57], [["filete", 150]]],
  ["Sardinas en aceite", "Pescado", "🥫", [208, 24.6, 0, 11.5, 0, 0, 1.5, 307, 142], [["lata", 90]]],

  // ---------- Mariscos ----------
  ["Camarones", "Mariscos", "🦐", [99, 24, 0.2, 0.3, 0, 0, 0.1, 111, 189], [["porción", 100]]],
  ["Choritos", "Mariscos", "🦪", [172, 23.8, 7.4, 4.5, 0, 0, 0.9, 369, 56], [["taza", 150]]],
  ["Calamar", "Mariscos", "🦑", [92, 15.6, 3.1, 1.4, 0, 0, 0.4, 44, 233], [["porción", 100]]],

  // ---------- Leche ----------
  ["Leche entera", "Leche", "🥛", [61, 3.2, 4.8, 3.3, 0, 5, 1.9, 43, 10], [["vaso", 200], ["taza", 240]], "ml"],
  ["Leche semidescremada", "Leche", "🥛", [46, 3.3, 4.8, 1.5, 0, 5, 0.9, 44, 6], [["vaso", 200], ["taza", 240]], "ml"],
  ["Leche descremada", "Leche", "🥛", [34, 3.4, 5, 0.1, 0, 5, 0.1, 42, 2], [["vaso", 200], ["taza", 240]], "ml"],

  // ---------- Bebidas vegetales ----------
  ["Bebida de almendras sin azúcar", "Bebidas vegetales", "🥛", [15, 0.6, 0.6, 1.1, 0.3, 0, 0.1, 63, 0], [["taza", 240]], "ml"],
  ["Bebida de avena", "Bebidas vegetales", "🥛", [45, 1, 6.5, 1.5, 0.8, 3.3, 0.2, 40, 0], [["taza", 240]], "ml"],
  ["Bebida de soya", "Bebidas vegetales", "🥛", [43, 3.3, 2.9, 1.8, 0.4, 2.5, 0.2, 50, 0], [["taza", 240]], "ml"],

  // ---------- Quesos ----------
  ["Queso gauda", "Quesos", "🧀", [356, 25, 2.2, 27.4, 0, 2.2, 17.6, 819, 114], [["lámina", 20]]],
  ["Queso fresco", "Quesos", "🧀", [264, 18, 3, 20, 0, 3, 12, 600, 69], [["rebanada", 30]]],
  ["Queso cottage", "Quesos", "🧀", [98, 11.1, 3.4, 4.3, 0, 2.7, 1.7, 364, 17], [["media taza", 113]]],
  ["Queso mozzarella", "Quesos", "🧀", [280, 27.5, 3.1, 17.1, 0, 1, 10.9, 627, 54], [["cuarto de taza rallado", 28]]],
  ["Queso parmesano", "Quesos", "🧀", [431, 38.5, 4.1, 28.6, 0, 0.9, 17.3, 1529, 88], [["cucharada", 5]]],

  // ---------- Yogurt ----------
  ["Yogurt natural", "Yogurt", "🍶", [61, 3.5, 4.7, 3.3, 0, 4.7, 2.1, 46, 13], [["pote", 125]]],
  ["Yogurt griego natural", "Yogurt", "🍶", [97, 9, 3.6, 5, 0, 3.6, 3.2, 35, 13], [["pote", 150]]],
  ["Yogurt griego 0%", "Yogurt", "🍶", [59, 10.2, 3.6, 0.4, 0, 3.2, 0.1, 36, 5], [["pote", 150]]],
  ["Yogurt batido con frutas", "Yogurt", "🍶", [99, 3.5, 18, 1.4, 0, 17, 0.9, 50, 6], [["pote", 125]]],

  // ---------- Panes ----------
  ["Pan blanco de molde", "Panes", "🍞", [265, 9, 49, 3.2, 2.7, 5, 0.7, 491, 0], [["rebanada", 25]]],
  ["Pan integral de molde", "Panes", "🍞", [252, 12.5, 42.7, 3.5, 6, 4.4, 0.7, 450, 0], [["rebanada", 28]]],
  ["Marraqueta", "Panes", "🥖", [270, 9, 56, 1.5, 2.4, 1.5, 0.3, 540, 0], [["unidad", 100], ["media unidad", 50]]],
  ["Hallulla", "Panes", "🫓", [297, 8, 52, 6.5, 2, 1.5, 2, 550, 0], [["unidad", 90]]],
  ["Tortilla de trigo", "Panes", "🫓", [312, 8.3, 51.6, 8, 3.5, 2.6, 3, 736, 0], [["unidad", 45]]],
  ["Tortilla de maíz", "Panes", "🫓", [218, 5.7, 44.6, 2.9, 6.3, 0.9, 0.4, 45, 0], [["unidad", 26]]],
  ["Pan pita", "Panes", "🫓", [275, 9.1, 55.7, 1.2, 2.2, 1.3, 0.2, 536, 0], [["unidad", 60]]],

  // ---------- Cereales ----------
  ["Avena en hojuelas", "Cereales", "🥣", [379, 13.2, 67.7, 6.5, 10.1, 1, 1.1, 6, 0], [["media taza", 40], ["cucharada", 10]]],
  ["Granola", "Cereales", "🥣", [471, 13.7, 54, 24, 5.3, 19.8, 4.4, 26, 0], [["media taza", 60], ["cucharada", 10]]],
  ["Corn flakes", "Cereales", "🥣", [357, 7.5, 84, 0.4, 3.3, 9.5, 0.1, 729, 0], [["taza", 28]]],
  ["Muesli", "Cereales", "🥣", [340, 9.7, 66, 5.8, 7.3, 26, 0.9, 200, 0], [["media taza", 45]]],

  // ---------- Granos ----------
  ["Arroz blanco cocido", "Granos", "🍚", [130, 2.7, 28.2, 0.3, 0.4, 0.1, 0.1, 1, 0], [["taza", 158], ["media taza", 79]]],
  ["Arroz integral cocido", "Granos", "🍚", [123, 2.7, 25.6, 1, 1.6, 0.2, 0.3, 4, 0], [["taza", 195]]],
  ["Quinoa cocida", "Granos", "🍚", [120, 4.4, 21.3, 1.9, 2.8, 0.9, 0.2, 7, 0], [["taza", 185], ["media taza", 92]]],
  ["Cuscús cocido", "Granos", "🍚", [112, 3.8, 23.2, 0.2, 1.4, 0.1, 0, 5, 0], [["taza", 157]]],

  // ---------- Pasta ----------
  ["Fideos cocidos", "Pasta", "🍝", [158, 5.8, 30.9, 0.9, 1.8, 0.6, 0.2, 1, 0], [["taza", 140]]],
  ["Pasta integral cocida", "Pasta", "🍝", [149, 6, 30, 1.7, 3.9, 0.8, 0.3, 4, 0], [["taza", 140]]],

  // ---------- Legumbres ----------
  ["Lentejas cocidas", "Legumbres", "🫘", [116, 9, 20.1, 0.4, 7.9, 1.8, 0.1, 2, 0], [["taza", 198]]],
  ["Porotos negros cocidos", "Legumbres", "🫘", [132, 8.9, 23.7, 0.5, 8.7, 0.3, 0.1, 1, 0], [["taza", 172]]],
  ["Porotos blancos cocidos", "Legumbres", "🫘", [139, 9.7, 25, 0.4, 6.3, 0.3, 0.1, 6, 0], [["taza", 179]]],
  ["Garbanzos cocidos", "Legumbres", "🫘", [164, 8.9, 27.4, 2.6, 7.6, 4.8, 0.3, 7, 0], [["taza", 164], ["media taza", 82]]],

  // ---------- Frutos secos ----------
  ["Almendras", "Frutos secos", "🌰", [579, 21.2, 21.6, 49.9, 12.5, 4.4, 3.8, 1, 0], [["puñado", 28]]],
  ["Nueces", "Frutos secos", "🌰", [654, 15.2, 13.7, 65.2, 6.7, 2.6, 6.1, 2, 0], [["puñado", 28]]],
  ["Maní tostado", "Frutos secos", "🥜", [585, 23.7, 21.5, 49.7, 8, 4.2, 6.9, 6, 0], [["puñado", 28]]],
  ["Castañas de cajú", "Frutos secos", "🌰", [553, 18.2, 30.2, 43.9, 3.3, 5.9, 7.8, 12, 0], [["puñado", 28]]],
  ["Pistachos", "Frutos secos", "🌰", [560, 20.2, 27.2, 45.3, 10.6, 7.7, 5.9, 1, 0], [["puñado", 28]]],

  // ---------- Semillas ----------
  ["Semillas de chía", "Semillas", "⚫", [486, 16.5, 42.1, 30.7, 34.4, 0, 3.3, 16, 0], [["cucharada", 12]]],
  ["Linaza", "Semillas", "🟤", [534, 18.3, 28.9, 42.2, 27.3, 1.6, 3.7, 30, 0], [["cucharada", 10]]],
  ["Semillas de girasol", "Semillas", "🌻", [584, 20.8, 20, 51.5, 8.6, 2.6, 4.5, 9, 0], [["cucharada", 9]]],
  ["Semillas de zapallo", "Semillas", "🎃", [559, 30.2, 10.7, 49, 6, 1.4, 8.7, 7, 0], [["cucharada", 9]]],

  // ---------- Aceites ----------
  ["Aceite de oliva", "Aceites", "🫒", [884, 0, 0, 100, 0, 0, 13.8, 2, 0], [["cucharada", 13.5], ["cucharadita", 4.5]]],
  ["Aceite vegetal", "Aceites", "🛢️", [884, 0, 0, 100, 0, 0, 10, 0, 0], [["cucharada", 13.6], ["cucharadita", 4.5]]],
  ["Aceite de coco", "Aceites", "🥥", [862, 0, 0, 100, 0, 0, 82.5, 0, 0], [["cucharada", 13.6], ["cucharadita", 4.5]]],

  // ---------- Untables ----------
  ["Mantequilla", "Untables", "🧈", [717, 0.9, 0.1, 81.1, 0, 0.1, 51.4, 643, 215], [["cucharada", 14], ["cucharadita", 5]]],
  ["Margarina", "Untables", "🧈", [717, 0.2, 0.7, 80.7, 0, 0, 15, 700, 0], [["cucharadita", 5]]],
  ["Mantequilla de maní", "Untables", "🥜", [588, 25, 20, 50, 6, 9.2, 10.3, 459, 0], [["cucharada", 16]]],
  ["Queso crema", "Untables", "🧀", [342, 5.9, 4.1, 34, 0, 3.2, 19, 321, 110], [["cucharada", 15]]],
  ["Hummus", "Untables", "🫘", [166, 7.9, 14.3, 9.6, 6, 0.3, 1.4, 379, 0], [["2 cucharadas", 30]]],
  ["Mermelada", "Untables", "🍓", [278, 0.4, 68.9, 0.1, 1.1, 48.5, 0, 32, 0], [["cucharada", 20]]],
  ["Manjar", "Untables", "🍮", [315, 6.8, 55.4, 7.4, 0, 49.7, 4.4, 129, 29], [["cucharada", 19]]],

  // ---------- Salsas ----------
  ["Mayonesa", "Salsas", "🥫", [680, 1, 0.6, 75, 0, 0.6, 11.7, 635, 42], [["cucharada", 14]]],
  ["Ketchup", "Salsas", "🥫", [101, 1, 27.4, 0.1, 0.3, 21.3, 0, 907, 0], [["cucharada", 17]]],
  ["Mostaza", "Salsas", "🥫", [60, 3.7, 5.8, 3.3, 4, 0.9, 0.2, 1135, 0], [["cucharadita", 5]]],
  ["Salsa de tomate", "Salsas", "🥫", [29, 1.3, 6.6, 0.2, 1.5, 4.2, 0, 474, 0], [["media taza", 122]]],
  ["Salsa de soya", "Salsas", "🥫", [53, 8.1, 4.9, 0.6, 0.8, 0.4, 0.1, 5493, 0], [["cucharada", 16]], "ml"],
  ["Pebre", "Salsas", "🌶️", [30, 1, 5, 1.2, 1.5, 2.5, 0.2, 300, 0], [["cucharada", 15]]],

  // ---------- Bebidas ----------
  ["Agua", "Bebidas", "💧", [0, 0, 0, 0, 0, 0, 0, 0, 0], [["vaso", 250], ["botella", 500]], "ml"],
  ["Bebida cola", "Bebidas", "🥤", [42, 0, 10.6, 0, 0, 10.6, 0, 4, 0], [["lata", 350], ["vaso", 250]], "ml"],
  ["Bebida cola zero", "Bebidas", "🥤", [0.3, 0, 0, 0, 0, 0, 0, 10, 0], [["lata", 350], ["vaso", 250]], "ml"],
  ["Jugo de naranja natural", "Bebidas", "🍊", [45, 0.7, 10.4, 0.2, 0.2, 8.4, 0, 1, 0], [["vaso", 250]], "ml"],
  ["Néctar de fruta", "Bebidas", "🧃", [54, 0.1, 13, 0, 0.2, 12, 0, 10, 0], [["vaso", 200]], "ml"],
  ["Bebida isotónica", "Bebidas", "🥤", [26, 0, 6.4, 0, 0, 5.6, 0, 41, 0], [["botella", 500]], "ml"],

  // ---------- Café e infusiones ----------
  ["Café negro", "Café e infusiones", "☕", [2, 0.3, 0, 0, 0, 0, 0, 5, 0], [["taza", 240]], "ml"],
  ["Café con leche", "Café e infusiones", "☕", [38, 2, 3, 2, 0, 3, 1.2, 25, 6], [["taza", 240]], "ml"],
  ["Capuchino", "Café e infusiones", "☕", [31, 1.7, 2.5, 1.6, 0, 2.5, 1, 21, 5], [["taza", 240]], "ml"],
  ["Té", "Café e infusiones", "🍵", [1, 0, 0.3, 0, 0, 0, 0, 3, 0], [["taza", 240]], "ml"],

  // ---------- Bebidas alcohólicas ----------
  ["Cerveza", "Bebidas alcohólicas", "🍺", [43, 0.5, 3.6, 0, 0, 0, 0, 4, 0], [["lata", 350], ["schop", 500]], "ml"],
  ["Vino tinto", "Bebidas alcohólicas", "🍷", [85, 0.1, 2.6, 0, 0, 0.6, 0, 4, 0], [["copa", 150]], "ml"],
  ["Vino blanco", "Bebidas alcohólicas", "🥂", [82, 0.1, 2.6, 0, 0, 1, 0, 5, 0], [["copa", 150]], "ml"],
  ["Pisco sour", "Bebidas alcohólicas", "🍸", [155, 0.6, 12, 0, 0, 11, 0, 5, 0], [["vaso", 150]], "ml"],
  ["Piscola", "Bebidas alcohólicas", "🥃", [67, 0, 7.5, 0, 0, 7.5, 0, 3, 0], [["vaso", 300]], "ml"],

  // ---------- Snacks ----------
  ["Papas fritas de bolsa", "Snacks", "🥔", [536, 7, 53, 34.6, 4.4, 0.3, 3.4, 525, 0], [["bolsa", 45]]],
  ["Galletas de soda", "Snacks", "🍘", [421, 9.5, 74, 9, 2.8, 1.5, 2, 941, 0], [["paquete", 30], ["galleta", 6]]],
  ["Palomitas de maíz", "Snacks", "🍿", [387, 12.9, 77.8, 4.5, 14.5, 0.9, 0.6, 8, 0], [["taza", 8]]],
  ["Barra de cereal", "Snacks", "🍫", [400, 6, 72, 10, 4, 30, 2, 200, 0], [["barra", 25]]],

  // ---------- Dulces ----------
  ["Azúcar", "Dulces", "🍬", [387, 0, 100, 0, 0, 100, 0, 1, 0], [["cucharadita", 4], ["cucharada", 12]]],
  ["Miel", "Dulces", "🍯", [304, 0.3, 82.4, 0, 0.2, 82.1, 0, 4, 0], [["cucharada", 21], ["cucharadita", 7]]],
  ["Galletas de chocolate", "Dulces", "🍪", [480, 5, 66, 22, 2.5, 35, 9, 350, 15], [["galleta", 12]]],
  ["Queque", "Dulces", "🍰", [389, 5.5, 49, 19.5, 0.5, 30, 11, 300, 80], [["rebanada", 60]]],
  ["Alfajor", "Dulces", "🍪", [420, 5, 62, 17, 1.5, 38, 9, 150, 10], [["unidad", 50]]],

  // ---------- Chocolates ----------
  ["Chocolate de leche", "Chocolates", "🍫", [535, 7.7, 59.4, 29.7, 3.4, 51.5, 18.5, 79, 23], [["barra", 40], ["cuadrito", 5]]],
  ["Chocolate amargo 70%", "Chocolates", "🍫", [598, 7.8, 45.9, 42.6, 10.9, 24, 24.5, 20, 3], [["cuadrito", 10]]],

  // ---------- Helados ----------
  ["Helado de vainilla", "Helados", "🍨", [207, 3.5, 23.6, 11, 0.7, 21.2, 6.8, 80, 44], [["bola", 66]]],
  ["Helado de agua", "Helados", "🍧", [80, 0, 20, 0, 0, 18, 0, 5, 0], [["unidad", 60]]],

  // ---------- Suplementos ----------
  ["Proteína whey", "Suplementos", "💪", [400, 80, 10, 5, 0, 6, 2.5, 300, 60], [["scoop", 30]]],
  ["Creatina", "Suplementos", "💊", [0, 0, 0, 0, 0, 0, 0, 0, 0], [["scoop", 5]]],

  // ---------- Platos preparados ----------
  ["Empanada de pino", "Platos preparados", "🥟", [240, 9.5, 25, 11, 1.5, 2, 4, 420, 45], [["unidad", 250]]],
  ["Cazuela de vacuno", "Platos preparados", "🍲", [70, 5.5, 6, 2.5, 1, 1, 0.9, 200, 15], [["plato", 500]]],
  ["Porotos con riendas", "Platos preparados", "🍲", [110, 5.5, 18, 1.6, 5, 1, 0.4, 250, 0], [["plato", 350]]],
  ["Pastel de choclo", "Platos preparados", "🥘", [160, 8, 18, 7, 2, 6, 2.5, 300, 45], [["porción", 350]]],
  ["Lasaña de carne", "Platos preparados", "🍝", [135, 8, 12.5, 5.8, 1, 3, 2.9, 340, 25], [["porción", 250]]],
  ["Ensalada César con pollo", "Platos preparados", "🥗", [127, 9.5, 5, 8, 1.3, 1.5, 1.9, 330, 30], [["plato", 300]]],
  ["Sopaipilla", "Platos preparados", "🫓", [330, 5, 40, 16, 1.5, 3, 3, 450, 0], [["unidad", 60]]],

  // ---------- Restaurantes ----------
  ["Pizza de queso", "Restaurantes", "🍕", [266, 11.4, 33.3, 9.7, 2.3, 3.6, 4.5, 598, 17], [["rebanada", 107]]],
  ["Hamburguesa con queso", "Restaurantes", "🍔", [263, 13, 30, 10, 1.5, 6.5, 4.7, 600, 35], [["unidad", 150]]],
  ["Completo italiano", "Restaurantes", "🌭", [220, 6.5, 22, 12, 2, 3, 3.8, 580, 25], [["unidad", 250]]],
  ["Papas fritas", "Restaurantes", "🍟", [312, 3.4, 41.4, 14.7, 3.8, 0.3, 2.3, 210, 0], [["porción mediana", 117], ["porción grande", 154]]],
  ["Sushi roll california", "Restaurantes", "🍣", [129, 2.9, 18.4, 3.7, 1.4, 2.5, 0.6, 428, 3], [["pieza", 25], ["porción (8 piezas)", 200]]]
];
