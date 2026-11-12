/*
 * Ampliación de la base: alimentos y platos habituales en Chile.
 * Mismo formato que alimentos.js. Valores aproximados por 100 g (o 100 ml),
 * estimados a partir de USDA FoodData Central y recetas típicas; los platos
 * preparados varían según la receta. Revisar contra etiqueta cuando exista.
 *   [kcal, proteína, carbohidratos, grasa, fibra, azúcares, grasa saturada, sodio mg, colesterol mg]
 */
const RAW_FOODS_CL = [
  // ---------- Panes ----------
  ["Pan amasado", "Panes", "🍞", [300, 8, 55, 5, 2.5, 3, 1.5, 500, 5], [["unidad", 90]]],
  ["Dobladita", "Panes", "🍞", [310, 8.5, 52, 7, 2.4, 2, 2.5, 520, 5], [["unidad", 70]]],
  ["Pan de completo", "Panes", "🌭", [280, 9, 50, 4.5, 2, 6, 1, 490, 0], [["unidad", 60]]],
  ["Pan de hamburguesa", "Panes", "🍔", [280, 9.5, 50, 4.3, 2, 6, 1, 480, 0], [["unidad", 70]]],
  ["Pan tostado", "Panes", "🍞", [410, 11, 73, 7, 4, 6, 1.5, 640, 0], [["unidad", 10]]],
  ["Croissant", "Panes", "🥐", [406, 8, 46, 21, 2.6, 11, 12, 470, 67], [["unidad", 57]]],

  // ---------- Cereales y granos ----------
  ["Mote de trigo cocido", "Granos", "🌾", [120, 4, 25, 0.6, 3, 0.3, 0.1, 5, 0], [["taza", 160]]],
  ["Harina tostada", "Cereales", "🌾", [370, 12, 72, 2.5, 10, 1, 0.4, 5, 0], [["cucharada", 10]]],
  ["Polenta cocida", "Granos", "🌽", [70, 1.6, 15, 0.3, 1, 0.3, 0, 2, 0], [["taza", 240]]],
  ["Arroz primavera", "Granos", "🍚", [140, 3, 26, 2.5, 1, 1, 0.4, 250, 0], [["taza", 180]]],
  ["Cereal de chocolate", "Cereales", "🥣", [385, 8, 80, 4, 6, 30, 1, 350, 0], [["taza", 30]]],
  ["Galletas de avena", "Snacks", "🍪", [450, 6.5, 68, 17, 3, 25, 4, 380, 0], [["unidad", 15]]],
  ["Galletas tipo María", "Snacks", "🍪", [430, 7, 75, 11, 2, 22, 3, 350, 0], [["unidad", 7]]],
  ["Galletas rellenas", "Dulces", "🍪", [470, 5, 70, 19, 2.5, 38, 6, 350, 0], [["unidad", 11]]],

  // ---------- Platos chilenos ----------
  ["Charquicán", "Platos preparados", "🍲", [95, 6, 10, 3.5, 1.8, 2, 1.2, 250, 15], [["plato", 350]]],
  ["Pastel de papas", "Platos preparados", "🥧", [140, 7, 12, 7, 1, 1.5, 3, 300, 40], [["porción", 350]]],
  ["Humitas", "Platos preparados", "🌽", [165, 4, 25, 6, 2.5, 6, 3, 250, 10], [["unidad", 200]]],
  ["Lentejas con arroz", "Platos preparados", "🍲", [120, 6, 21, 1.5, 4, 1, 0.3, 250, 0], [["plato", 350]]],
  ["Porotos granados", "Platos preparados", "🍲", [105, 5, 16, 2.5, 4, 2, 0.5, 250, 0], [["plato", 350]]],
  ["Carbonada", "Platos preparados", "🍲", [70, 4, 8, 2.5, 1.5, 2, 0.8, 250, 10], [["plato", 400]]],
  ["Cazuela de pollo", "Platos preparados", "🍲", [65, 5, 6, 2.2, 1, 1, 0.6, 220, 20], [["plato", 450]]],
  ["Arroz con pollo", "Platos preparados", "🍛", [150, 9, 18, 4.5, 0.8, 0.5, 1.2, 300, 30], [["plato", 350]]],
  ["Tallarines con salsa boloñesa", "Platos preparados", "🍝", [150, 7, 19, 5, 1.5, 3, 1.8, 250, 18], [["plato", 350]]],
  ["Lomo a lo pobre", "Platos preparados", "🍳", [220, 12, 10, 15, 1, 1, 4.5, 350, 150], [["plato", 500]]],
  ["Chorrillana", "Platos preparados", "🍟", [240, 10, 18, 14, 1.5, 2, 4.5, 450, 100], [["porción", 400]]],
  ["Pollo arvejado", "Platos preparados", "🍲", [110, 10, 7, 4.5, 2, 2, 1.2, 250, 40], [["plato", 350]]],
  ["Pantrucas", "Platos preparados", "🍲", [75, 3.5, 10, 2, 0.8, 1, 0.6, 250, 15], [["plato", 400]]],
  ["Sopa de verduras", "Platos preparados", "🥣", [35, 1.2, 6, 0.8, 1.2, 2, 0.2, 250, 0], [["plato", 350]]],
  ["Crema de zapallo", "Platos preparados", "🥣", [60, 1.5, 8, 2.5, 1.2, 3, 1.2, 250, 5], [["plato", 300]]],
  ["Paila marina", "Platos preparados", "🦪", [70, 9, 4, 2, 0.5, 1, 0.5, 450, 50], [["plato", 450]]],
  ["Caldillo de congrio", "Platos preparados", "🐟", [70, 8, 4, 2.5, 0.6, 1, 0.6, 300, 30], [["plato", 450]]],
  ["Machas a la parmesana", "Platos preparados", "🦪", [180, 15, 3, 12, 0, 0.5, 6, 500, 60], [["porción", 150]]],
  ["Empanada de queso", "Platos preparados", "🥟", [330, 10, 32, 18, 1.2, 1, 6, 450, 25], [["unidad", 130]]],
  ["Tortilla de acelga", "Platos preparados", "🍳", [130, 7, 5, 9, 1.5, 1.5, 2.5, 250, 180], [["porción", 150]]],
  ["Ensalada chilena", "Verduras", "🥗", [45, 1, 5, 2.5, 1.2, 3, 0.4, 150, 0], [["porción", 150]]],
  ["Papas mayo", "Platos preparados", "🥔", [165, 2, 14, 11, 1.4, 1, 1.8, 250, 10], [["porción", 150]]],
  ["Pechuga de pollo apanada", "Pollo", "🍗", [250, 18, 13, 14, 0.8, 0.5, 2.5, 450, 60], [["unidad", 150]]],
  ["Milanesa de vacuno", "Res", "🥩", [270, 17, 14, 16, 0.8, 1, 3.5, 400, 70], [["unidad", 150]]],
  ["Ceviche", "Platos preparados", "🐟", [90, 13, 5, 1.5, 0.6, 2, 0.3, 350, 40], [["porción", 200]]],
  ["Pescado frito apanado", "Pescado", "🐟", [230, 15, 13, 13, 0.6, 0.5, 2.5, 350, 50], [["filete", 150]]],

  // ---------- Sándwiches ----------
  ["Churrasco italiano", "Restaurantes", "🥪", [230, 12, 20, 11, 2, 2, 3.5, 450, 35], [["unidad", 300]]],
  ["Barros Luco", "Restaurantes", "🥪", [260, 14, 22, 13, 1, 2, 6, 500, 45], [["unidad", 250]]],
  ["Barros Jarpa", "Restaurantes", "🥪", [290, 13, 26, 14, 1.2, 3, 7, 850, 40], [["unidad", 160]]],
  ["Chacarero", "Restaurantes", "🥪", [200, 11, 18, 9, 2.5, 2, 3, 450, 30], [["unidad", 320]]],
  ["Ave palta", "Restaurantes", "🥪", [230, 11, 22, 11, 2.5, 2, 2, 400, 30], [["unidad", 220]]],
  ["Sándwich de jamón y queso", "Restaurantes", "🥪", [260, 13, 28, 10, 1.5, 3, 5, 800, 30], [["unidad", 150]]],
  ["Tostada con palta", "Panes", "🥑", [220, 5, 25, 11, 5, 2, 1.5, 330, 0], [["unidad", 100]]],
  ["Shawarma de pollo", "Restaurantes", "🌯", [210, 12, 20, 9, 1.5, 2, 2, 500, 30], [["unidad", 300]]],
  ["Burrito", "Restaurantes", "🌯", [200, 9, 25, 7, 3, 2, 3, 500, 20], [["unidad", 250]]],
  ["Pizza de pepperoni", "Restaurantes", "🍕", [298, 12.6, 32, 13, 2.3, 3.8, 5.5, 690, 26], [["trozo", 110]]],
  ["Pollo frito", "Restaurantes", "🍗", [260, 20, 9, 16, 0.5, 0, 4, 600, 90], [["presa", 130]]],

  // ---------- Carnes ----------
  ["Lomo vetado", "Res", "🥩", [250, 24, 0, 17, 0, 0, 7, 55, 80], [["porción", 150]]],
  ["Plateada", "Res", "🥩", [230, 27, 0, 13, 0, 0, 5, 60, 85], [["porción", 150]]],
  ["Asado de tira", "Res", "🥩", [300, 22, 0, 24, 0, 0, 10, 60, 85], [["porción", 150]]],
  ["Hígado de vacuno", "Res", "🥩", [175, 27, 5, 5, 0, 0, 1.7, 80, 380], [["porción", 100]]],
  ["Costillar de cerdo", "Cerdo", "🍖", [290, 23, 0, 22, 0, 0, 8, 80, 90], [["porción", 150]]],
  ["Pulpa de cerdo", "Cerdo", "🍖", [200, 27, 0, 10, 0, 0, 3.5, 60, 80], [["porción", 150]]],
  ["Chorizo parrillero", "Fiambres", "🌭", [300, 15, 2, 26, 0, 1, 10, 800, 60], [["unidad", 80]]],
  ["Longaniza", "Fiambres", "🌭", [310, 15, 2, 27, 0, 1, 10, 900, 70], [["unidad", 80]]],
  ["Prieta", "Fiambres", "🌭", [380, 14, 13, 30, 0, 0, 12, 680, 120], [["unidad", 100]]],
  ["Mortadela", "Fiambres", "🥪", [311, 16, 3, 25, 0, 1, 9, 1250, 56], [["lámina", 15]]],
  ["Alitas de pollo", "Pollo", "🍗", [290, 27, 0, 19, 0, 0, 5.5, 82, 140], [["unidad", 30]]],
  ["Huevo frito", "Huevo", "🍳", [196, 13.6, 0.8, 14.8, 0, 0.4, 4.3, 207, 401], [["unidad", 46]]],

  // ---------- Pescados y mariscos ----------
  ["Jurel en lata", "Pescado", "🐟", [150, 22, 0, 7, 0, 0, 2, 350, 60], [["porción", 100], ["lata escurrida", 225]]],
  ["Atún en aceite", "Pescado", "🐟", [198, 29, 0, 8.2, 0, 0, 1.5, 350, 18], [["lata", 120]]],
  ["Salmón ahumado", "Pescado", "🐟", [117, 18, 0, 4.3, 0, 0, 0.9, 1700, 23], [["lámina", 20]]],
  ["Congrio", "Pescado", "🐟", [85, 18, 0, 1, 0, 0, 0.2, 80, 50], [["filete", 150]]],
  ["Kanikama", "Mariscos", "🦀", [95, 7.6, 15, 0.9, 0, 6, 0.2, 700, 30], [["barra", 17]]],
  ["Pulpo cocido", "Mariscos", "🐙", [164, 30, 4.4, 2.1, 0, 0, 0.5, 460, 96], [["porción", 100]]],

  // ---------- Lácteos ----------
  ["Queso chanco", "Quesos", "🧀", [350, 24, 1, 28, 0, 0.5, 17, 600, 85], [["lámina", 15]]],
  ["Quesillo", "Quesos", "🧀", [180, 14, 3, 12, 0, 3, 7.5, 300, 40], [["rebanada", 30]]],
  ["Ricotta", "Quesos", "🧀", [174, 11, 3, 13, 0, 0.3, 8, 84, 51], [["cucharada", 30]]],
  ["Leche sin lactosa semidescremada", "Leche", "🥛", [46, 3.2, 4.8, 1.5, 0, 4.8, 1, 45, 6], [["vaso", 200]], "ml"],
  ["Leche chocolatada", "Leche", "🥛", [75, 3.2, 11, 1.8, 0.5, 10, 1.1, 50, 6], [["caja", 200]], "ml"],
  ["Leche en polvo entera", "Leche", "🥛", [496, 26, 38, 27, 0, 38, 17, 370, 97], [["cucharada", 10]]],
  ["Crema de leche", "Leche", "🥛", [290, 2.5, 3.5, 30, 0, 3, 19, 40, 100], [["cucharada", 15]]],
  ["Leche condensada", "Dulces", "🥛", [321, 7.9, 54, 8.7, 0, 54, 5.5, 127, 34], [["cucharada", 20]]],
  ["Yogurt proteico", "Yogurt", "🍶", [60, 9, 5, 0.3, 0, 4.5, 0.2, 50, 3], [["unidad", 155]]],

  // ---------- Proteína vegetal ----------
  ["Tofu", "Legumbres", "🧊", [76, 8, 1.9, 4.8, 0.3, 0.6, 0.7, 7, 0], [["porción", 100]]],
  ["Carne de soya hidratada", "Legumbres", "🫘", [110, 17, 10, 0.4, 5.5, 3, 0, 5, 0], [["taza", 100]]],
  ["Edamame", "Legumbres", "🫛", [121, 11.9, 8.9, 5.2, 5.2, 2.2, 0.6, 6, 0], [["taza", 155]]],
  ["Habas cocidas", "Legumbres", "🫘", [110, 7.6, 19.7, 0.4, 5.4, 1.8, 0.1, 5, 0], [["taza", 170]]],

  // ---------- Frutas ----------
  ["Pomelo", "Frutas", "🍊", [42, 0.8, 10.7, 0.1, 1.6, 6.9, 0, 0, 0], [["mitad", 120]]],
  ["Membrillo", "Frutas", "🍐", [57, 0.4, 15.3, 0.1, 1.9, 12, 0, 4, 0], [["unidad", 90]]],
  ["Tuna", "Frutas", "🌵", [41, 0.7, 9.6, 0.5, 3.6, 7, 0.1, 5, 0], [["unidad", 100]]],
  ["Higos", "Frutas", "🫐", [74, 0.8, 19, 0.3, 2.9, 16, 0.1, 1, 0], [["unidad", 50]]],
  ["Damasco", "Frutas", "🍑", [48, 1.4, 11, 0.4, 2, 9.2, 0, 1, 0], [["unidad", 35]]],
  ["Nectarín", "Frutas", "🍑", [44, 1.1, 10.6, 0.3, 1.7, 7.9, 0, 0, 0], [["unidad", 140]]],
  ["Lúcuma", "Frutas", "🥭", [99, 1.5, 25, 0.5, 1.3, 15, 0.1, 10, 0], [["unidad", 150]]],
  ["Maracuyá", "Frutas", "🟣", [97, 2.2, 23, 0.7, 10.4, 11, 0.1, 28, 0], [["unidad", 18]]],
  ["Moras", "Frutas", "🫐", [43, 1.4, 9.6, 0.5, 5.3, 4.9, 0, 1, 0], [["taza", 145]]],
  ["Dátiles", "Frutas", "🌴", [282, 2.5, 75, 0.4, 8, 63, 0, 2, 0], [["unidad", 8]]],
  ["Ciruelas secas", "Frutas", "🟤", [240, 2.2, 64, 0.4, 7, 38, 0, 2, 0], [["unidad", 10]]],
  ["Coco rallado", "Frutos secos", "🥥", [660, 6.9, 24, 64, 16, 7, 57, 37, 0], [["cucharada", 5]]],
  ["Ensalada de frutas", "Frutas", "🍓", [50, 0.6, 12.5, 0.2, 1.4, 10, 0, 3, 0], [["taza", 180]]],

  // ---------- Verduras ----------
  ["Acelga cocida", "Verduras", "🥬", [20, 1.9, 4.1, 0.1, 2.1, 1.1, 0, 179, 0], [["taza", 175]]],
  ["Arvejas", "Verduras", "🫛", [81, 5.4, 14.5, 0.4, 5.1, 5.7, 0.1, 5, 0], [["taza", 145]]],
  ["Rúcula", "Verduras", "🥬", [25, 2.6, 3.7, 0.7, 1.6, 2, 0.1, 27, 0], [["taza", 20]]],
  ["Palmitos", "Verduras", "🌴", [28, 2.5, 4.6, 0.6, 2.4, 0, 0.1, 426, 0], [["unidad", 33]]],
  ["Alcachofa", "Verduras", "🥬", [53, 2.9, 12, 0.3, 8.6, 1, 0.1, 60, 0], [["unidad", 120]]],
  ["Rabanitos", "Verduras", "🔴", [16, 0.7, 3.4, 0.1, 1.6, 1.9, 0, 39, 0], [["unidad", 9]]],
  ["Aceitunas", "Verduras", "🫒", [145, 1, 3.8, 15, 3.3, 0.5, 2, 1556, 0], [["unidad", 4]]],
  ["Papa al horno", "Tubérculos", "🥔", [93, 2.5, 21, 0.1, 2.2, 1.2, 0, 10, 0], [["unidad", 170]]],

  // ---------- Frutos secos y semillas ----------
  ["Avellanas", "Frutos secos", "🌰", [628, 15, 17, 61, 9.7, 4.3, 4.5, 0, 0], [["puñado", 28]]],
  ["Maní confitado", "Snacks", "🥜", [500, 15, 45, 30, 4, 35, 5, 20, 0], [["puñado", 30]]],
  ["Mix de frutos secos", "Frutos secos", "🥜", [600, 17, 22, 52, 7, 6, 6, 100, 0], [["puñado", 30]]],
  ["Sésamo", "Semillas", "🌱", [573, 17.7, 23.5, 49.7, 11.8, 0.3, 7, 11, 0], [["cucharada", 9]]],

  // ---------- Salsas y aliños ----------
  ["Aliño de aceite y vinagre", "Salsas", "🫗", [450, 0, 1, 50, 0, 0.5, 7, 500, 0], [["cucharada", 15]]],
  ["Mayonesa light", "Salsas", "🥫", [238, 0.4, 9, 22, 0, 4, 3.5, 800, 20], [["cucharada", 15]]],
  ["Salsa BBQ", "Salsas", "🥫", [172, 0.8, 41, 0.6, 0.9, 33, 0.1, 1027, 0], [["cucharada", 17]]],

  // ---------- Snacks ----------
  ["Ramitas", "Snacks", "🥨", [490, 8, 62, 23, 3, 2, 10, 1100, 0], [["bolsa", 45]]],
  ["Galletas de arroz", "Snacks", "🍘", [387, 8, 81, 2.8, 4.2, 0.9, 0.6, 29, 0], [["unidad", 9]]],
  ["Barra de proteína", "Suplementos", "🍫", [360, 30, 40, 10, 5, 15, 5, 250, 10], [["unidad", 50]]],
  ["Nachos", "Snacks", "🌮", [489, 7, 63, 23, 5, 1, 3, 400, 0], [["porción", 28]]],
  ["Suflés de maíz", "Snacks", "🧀", [560, 6, 53, 35, 1.5, 2, 5, 800, 0], [["bolsa", 30]]],

  // ---------- Dulces y postres ----------
  ["Kuchen de manzana", "Dulces", "🥧", [260, 3.5, 38, 10, 1.3, 20, 5, 150, 40], [["trozo", 100]]],
  ["Torta de mil hojas", "Dulces", "🎂", [400, 5, 50, 20, 0.5, 32, 10, 150, 50], [["trozo", 100]]],
  ["Berlín", "Dulces", "🍩", [340, 6, 42, 16, 1, 15, 5, 250, 20], [["unidad", 80]]],
  ["Brazo de reina", "Dulces", "🍰", [350, 5, 55, 12, 0.5, 38, 6, 150, 60], [["trozo", 80]]],
  ["Calzones rotos", "Dulces", "🍩", [400, 6, 50, 19, 1, 12, 4, 200, 40], [["unidad", 30]]],
  ["Leche asada", "Dulces", "🍮", [150, 5, 22, 4.5, 0, 21, 2.5, 70, 90], [["porción", 120]]],
  ["Flan de vainilla", "Dulces", "🍮", [110, 3, 18, 3, 0, 17, 1.6, 70, 10], [["unidad", 120]]],
  ["Arroz con leche", "Dulces", "🍚", [130, 3.5, 22, 3, 0.2, 13, 1.8, 50, 10], [["taza", 200]]],
  ["Sémola con leche", "Dulces", "🥣", [120, 4, 20, 2.8, 0.3, 11, 1.7, 50, 10], [["taza", 200]]],
  ["Gelatina", "Dulces", "🍮", [62, 1.2, 14, 0, 0, 13, 0, 40, 0], [["taza", 150]]],
  ["Mote con huesillo", "Dulces", "🍑", [110, 1, 26, 0.2, 1.2, 20, 0, 10, 0], [["vaso", 300]]],
  ["Chocolate blanco", "Chocolates", "🍫", [539, 5.9, 59, 32, 0, 59, 19, 90, 21], [["barra", 25]]],
  ["Helado de chocolate", "Helados", "🍨", [216, 3.8, 28, 11, 1.2, 25, 7, 76, 34], [["porción", 65]]],
  ["Helado de crema con cobertura", "Helados", "🍦", [300, 3.5, 27, 20, 0.8, 24, 15, 60, 25], [["unidad", 60]]],

  // ---------- Bebidas ----------
  ["Jugo en polvo preparado", "Bebidas", "🧃", [30, 0, 7.5, 0, 0, 7.5, 0, 10, 0], [["vaso", 250]], "ml"],
  ["Bebida de naranja", "Bebidas", "🥤", [48, 0, 12, 0, 0, 12, 0, 10, 0], [["lata", 350]], "ml"],
  ["Agua mineral con gas", "Bebidas", "💧", [0, 0, 0, 0, 0, 0, 0, 10, 0], [["vaso", 250]], "ml"],
  ["Bebida energética", "Bebidas", "⚡", [45, 0, 11, 0, 0, 11, 0, 80, 0], [["lata", 250]], "ml"],
  ["Batido de plátano con leche", "Bebidas", "🥤", [80, 3, 13, 1.6, 0.8, 11, 1, 40, 6], [["vaso", 300]], "ml"],
  ["Café cortado", "Café e infusiones", "☕", [30, 1.5, 2, 1.5, 0, 2, 1, 20, 5], [["taza", 100]], "ml"],
  ["Café latte", "Café e infusiones", "☕", [55, 3.2, 4.6, 2.8, 0, 4.6, 1.8, 45, 10], [["vaso", 350]], "ml"],
  ["Chocolate caliente", "Café e infusiones", "☕", [85, 3.3, 12, 2.4, 0.8, 10, 1.5, 45, 6], [["taza", 250]], "ml"],
  ["Cerveza sin alcohol", "Bebidas alcohólicas", "🍺", [25, 0.3, 5.5, 0, 0, 3, 0, 5, 0], [["lata", 350]], "ml"],
  ["Cerveza artesanal", "Bebidas alcohólicas", "🍺", [60, 0.5, 4.5, 0, 0, 0.5, 0, 5, 0], [["botella", 330]], "ml"],
  ["Espumante", "Bebidas alcohólicas", "🥂", [80, 0.1, 1.5, 0, 0, 0.5, 0, 5, 0], [["copa", 150]], "ml"],
  ["Pisco", "Bebidas alcohólicas", "🥃", [200, 0, 0, 0, 0, 0, 0, 0, 0], [["corto", 45]], "ml"],
  ["Whisky", "Bebidas alcohólicas", "🥃", [250, 0, 0, 0, 0, 0, 0, 0, 0], [["medida", 45]], "ml"],
  ["Ron", "Bebidas alcohólicas", "🥃", [231, 0, 0, 0, 0, 0, 0, 0, 0], [["medida", 45]], "ml"],
  ["Terremoto", "Bebidas alcohólicas", "🍹", [120, 0.5, 16, 1.5, 0, 15, 1, 15, 3], [["vaso", 500]], "ml"],

  // ---------- Suplementos ----------
  ["Caseína", "Suplementos", "💪", [360, 80, 6, 2, 0, 2, 1, 350, 15], [["scoop", 30]]]
];

/*
 * Sinónimos de búsqueda: palabra que escribe el usuario -> palabra usada en la base.
 * Cubre variantes de otros países hispanohablantes y nombres coloquiales.
 */
const SEARCH_ALIASES = {
  aguacate: "palta", banana: "platano", banano: "platano", guineo: "platano",
  fresa: "frutilla", fresas: "frutillas", elote: "choclo", maiz: "choclo",
  frijol: "poroto", frijoles: "porotos", judias: "porotos", alubias: "porotos",
  ejote: "poroto verde", ejotes: "porotos verdes", calabaza: "zapallo", auyama: "zapallo",
  zucchini: "zapallo italiano", calabacin: "zapallo italiano", remolacha: "betarraga",
  melocoton: "durazno", albaricoque: "damasco", pimiento: "pimenton", morron: "pimenton",
  cacahuate: "mani", cacahuete: "mani", guisantes: "arvejas", chicharos: "arvejas",
  patata: "papa", patatas: "papas", batata: "camote", boniato: "camote",
  "dulce de leche": "manjar", arequipe: "manjar", salchicha: "vienesa", salchichas: "vienesa",
  gaseosa: "bebida", refresco: "bebida", soda: "bebida", coca: "cola",
  chancho: "cerdo", vacuno: "res", carne: "res", ananas: "pina", anana: "pina",
  muslo: "trutro", pierna: "trutro", palomitas: "palomitas", cabritas: "palomitas", popcorn: "palomitas",
  bizcocho: "queque", toronja: "pomelo", surimi: "kanikama", mejillones: "choritos",
  chela: "cerveza", "hot dog": "completo", zumo: "jugo", yogur: "yogurt",
  spaghetti: "fideos", espagueti: "fideos", tallarines: "fideos", pasta: "fideos",
  "pan frances": "marraqueta", "pan batido": "marraqueta", sanguche: "sandwich", sandwich: "sandwich",
  queso: "queso", tortilla: "tortilla", pollo: "pollo", soja: "soya", aceituna: "aceitunas",
  pochoclo: "palomitas", jamon: "jamon", tocineta: "tocino", bacon: "tocino", panceta: "tocino"
};
