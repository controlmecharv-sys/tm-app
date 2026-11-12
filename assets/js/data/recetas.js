/*
 * Recetas. La información nutricional se calcula sumando los ingredientes
 * (cada ingrediente referencia por nombre a un alimento de alimentos.js).
 * comida: desayuno | almuerzo | cena | snacks
 */
const RAW_RECIPES = [
  {
    name: "Avena con plátano y chía", icon: "🥣", meal: "desayuno", servings: 1, minutes: 10,
    ingredients: [["Avena en hojuelas", 40], ["Leche descremada", 200], ["Plátano", 65], ["Semillas de chía", 12], ["Miel", 7]],
    steps: [
      "Calienta la leche en una olla a fuego medio.",
      "Agrega la avena y cocina 4–5 minutos revolviendo hasta que espese.",
      "Sirve y cubre con el plátano en rodajas, la chía y un hilo de miel."
    ]
  },
  {
    name: "Tostadas con palta y huevo", icon: "🥑", meal: "desayuno", servings: 1, minutes: 10,
    ingredients: [["Pan integral de molde", 56], ["Palta", 60], ["Huevo", 50], ["Tomate", 40]],
    steps: [
      "Tuesta las rebanadas de pan.",
      "Muele la palta con sal y pimienta y úntala sobre el pan.",
      "Cocina el huevo a la plancha o pochado y colócalo encima con rodajas de tomate."
    ]
  },
  {
    name: "Yogurt griego con granola y frutos rojos", icon: "🍓", meal: "desayuno", servings: 1, minutes: 5,
    ingredients: [["Yogurt griego 0%", 150], ["Granola", 30], ["Frambuesas", 50], ["Arándanos", 40]],
    steps: [
      "Sirve el yogurt en un bowl.",
      "Agrega la granola y los frutos rojos por encima."
    ]
  },
  {
    name: "Omelette de espinaca y queso", icon: "🍳", meal: "desayuno", servings: 1, minutes: 10,
    ingredients: [["Huevo", 100], ["Clara de huevo", 66], ["Espinaca", 30], ["Queso mozzarella", 28], ["Aceite de oliva", 4.5]],
    steps: [
      "Bate los huevos y las claras con sal y pimienta.",
      "Saltea la espinaca en el aceite durante 1 minuto.",
      "Vierte el huevo, cocina a fuego bajo y agrega el queso antes de doblar."
    ]
  },
  {
    name: "Panqueques de avena y plátano", icon: "🥞", meal: "desayuno", servings: 2, minutes: 15,
    ingredients: [["Avena en hojuelas", 80], ["Huevo", 100], ["Plátano", 130], ["Leche descremada", 100], ["Aceite de coco", 4.5]],
    steps: [
      "Licúa la avena, los huevos, el plátano y la leche hasta obtener una mezcla homogénea.",
      "Calienta un sartén con un poco de aceite de coco.",
      "Cocina porciones pequeñas 2 minutos por lado."
    ]
  },
  {
    name: "Pollo con arroz y brócoli", icon: "🍗", meal: "almuerzo", servings: 1, minutes: 25,
    ingredients: [["Pechuga de pollo a la plancha", 150], ["Arroz blanco cocido", 158], ["Brócoli", 91], ["Aceite de oliva", 4.5]],
    steps: [
      "Sazona la pechuga y cocínala a la plancha 6–7 minutos por lado.",
      "Cuece el brócoli al vapor durante 5 minutos.",
      "Sirve con el arroz y un hilo de aceite de oliva."
    ]
  },
  {
    name: "Ensalada de atún y garbanzos", icon: "🥗", meal: "almuerzo", servings: 1, minutes: 10,
    ingredients: [["Atún en agua", 105], ["Garbanzos cocidos", 120], ["Tomate", 100], ["Pepino", 75], ["Cebolla", 30], ["Aceite de oliva", 13.5], ["Limón", 15]],
    steps: [
      "Pica el tomate, el pepino y la cebolla.",
      "Mezcla con los garbanzos y el atún escurrido.",
      "Aliña con aceite de oliva, jugo de limón y sal."
    ]
  },
  {
    name: "Pasta integral con salsa boloñesa", icon: "🍝", meal: "almuerzo", servings: 1, minutes: 25,
    ingredients: [["Pasta integral cocida", 140], ["Carne molida 10% grasa", 100], ["Salsa de tomate", 122], ["Cebolla", 30], ["Ajo", 3], ["Queso parmesano", 5]],
    steps: [
      "Sofríe la cebolla y el ajo picados.",
      "Agrega la carne y dórala; incorpora la salsa de tomate y cocina 10 minutos.",
      "Sirve sobre la pasta y termina con parmesano."
    ]
  },
  {
    name: "Lentejas con arroz", icon: "🫘", meal: "almuerzo", servings: 4, minutes: 40,
    ingredients: [["Lentejas cocidas", 600], ["Arroz blanco cocido", 316], ["Zanahoria", 120], ["Cebolla", 110], ["Pimentón", 120], ["Aceite de oliva", 13.5], ["Ajo", 6]],
    steps: [
      "Sofríe la cebolla, el ajo, el pimentón y la zanahoria en el aceite.",
      "Agrega las lentejas con un poco de agua y cocina 15 minutos.",
      "Incorpora el arroz cocido, rectifica la sal y sirve."
    ]
  },
  {
    name: "Bowl de quinoa vegetariano", icon: "🥙", meal: "almuerzo", servings: 1, minutes: 15,
    ingredients: [["Quinoa cocida", 185], ["Garbanzos cocidos", 82], ["Palta", 60], ["Tomate", 60], ["Espinaca", 30], ["Semillas de girasol", 9], ["Aceite de oliva", 6.75]],
    steps: [
      "Coloca la quinoa como base del bowl.",
      "Agrega los garbanzos, la palta, el tomate y la espinaca.",
      "Termina con las semillas y aceite de oliva."
    ]
  },
  {
    name: "Salmón al horno con quinoa y espárragos", icon: "🐟", meal: "cena", servings: 1, minutes: 25,
    ingredients: [["Salmón", 150], ["Quinoa cocida", 140], ["Espárragos", 80], ["Aceite de oliva", 4.5], ["Limón", 15]],
    steps: [
      "Precalienta el horno a 200 °C.",
      "Hornea el salmón y los espárragos con aceite, sal y limón durante 15 minutos.",
      "Sirve junto a la quinoa."
    ]
  },
  {
    name: "Tacos de pollo", icon: "🌮", meal: "cena", servings: 2, minutes: 20,
    ingredients: [["Tortilla de maíz", 104], ["Pechuga de pollo a la plancha", 240], ["Palta", 100], ["Tomate", 123], ["Cebolla", 55], ["Lechuga", 36], ["Limón", 30]],
    steps: [
      "Cocina el pollo y córtalo en tiras.",
      "Calienta las tortillas en un sartén.",
      "Arma los tacos con pollo, palta, tomate, cebolla, lechuga y limón."
    ]
  },
  {
    name: "Wrap de pavo y queso crema", icon: "🌯", meal: "cena", servings: 1, minutes: 5,
    ingredients: [["Tortilla de trigo", 45], ["Jamón de pavo", 60], ["Queso crema", 15], ["Lechuga", 20], ["Tomate", 60]],
    steps: [
      "Unta la tortilla con el queso crema.",
      "Agrega el jamón de pavo, la lechuga y el tomate.",
      "Enrolla y corta por la mitad."
    ]
  },
  {
    name: "Batido de proteína con plátano", icon: "🥤", meal: "snacks", servings: 1, minutes: 5,
    ingredients: [["Proteína whey", 30], ["Leche descremada", 250], ["Plátano", 130], ["Mantequilla de maní", 16]],
    steps: [
      "Agrega todos los ingredientes a la licuadora.",
      "Licúa 30 segundos y sirve frío."
    ]
  },
  {
    name: "Hummus con bastones de zanahoria", icon: "🥕", meal: "snacks", servings: 1, minutes: 5,
    ingredients: [["Hummus", 60], ["Zanahoria", 122]],
    steps: [
      "Corta las zanahorias en bastones.",
      "Sirve junto al hummus para untar."
    ]
  },
  {
    name: "Manzana con mantequilla de maní", icon: "🍎", meal: "snacks", servings: 1, minutes: 3,
    ingredients: [["Manzana", 175], ["Mantequilla de maní", 16]],
    steps: [
      "Corta la manzana en gajos.",
      "Acompaña con la mantequilla de maní."
    ]
  }
];
