// data/initialData.js

const initialProducts = [
  // === Staples & Grains ===
  {
    id: "PROD001",
    name: "Kakira Sugar 1kg",
    unit: "Kg",
    sellingPrice: 5000,
    costPrice: 4500,
    quantity: 50,
    category: "Staples",
    description: "Kakira White Granulated Sugar (1kg pack)",
    voiceKeywords: [
      "kakira sugar",
      "sugar kakira",
      "sugar",
      "sukari",
      "sukaali",
      "kilo sugar",
      "sugar one kg",
      "sweetener",
      "kawunga ke sukari",
      "kadogo sukari",
      "eka sukari",
      "sugar ekimu",
      "kakira", // Short brand
    ],
  },
  {
    id: "PROD051", // New ID for Lugazi Sugar
    name: "Lugazi Sugar 1kg",
    unit: "Kg",
    sellingPrice: 4900, // Slightly different price for variation
    costPrice: 4400,
    quantity: 40,
    category: "Staples",
    description: "Lugazi White Granulated Sugar (1kg pack)",
    voiceKeywords: [
      "lugazi sugar",
      "sugar lugazi",
      "sugar", // Generic for all sugars
      "sukari",
      "sukaali",
      "kilo sugar",
      "lugazi", // Short brand
    ],
  },
  {
    id: "PROD002",
    name: "Uganda Super Rice 1kg",
    unit: "Kg",
    sellingPrice: 4000,
    costPrice: 3500,
    quantity: 70,
    category: "Staples",
    description: "Uganda Super Rice (Pishori type, 1kg pack)",
    voiceKeywords: [
      "uganda super rice",
      "super rice",
      "rice",
      "mpunga",
      "kilo rice",
      "rice one kg",
      "pishori",
      "kawunga ka mpunga",
      "rice power",
      "eka mpunga",
      "mpunga ekimu",
      "uganda rice",
    ],
  },
  {
    id: "PROD003",
    name: "Silos Maize Flour 1kg",
    unit: "Kg",
    sellingPrice: 3500,
    costPrice: 3000,
    quantity: 80,
    category: "Staples",
    description: "Silos Maize Flour (Posho Flour, 1kg pack)",
    voiceKeywords: [
      "silos maize flour",
      "silos flour",
      "maize flour",
      "posho",
      "obusi",
      "kilo posho",
      "flour",
      "kawunga",
      "kawunga gano",
      "eka kawunga",
      "posho ekimu",
      "silos", // Short brand
    ],
  },
  {
    id: "PROD004",
    name: "Saka Salt 1kg",
    unit: "Kg",
    sellingPrice: 1500,
    costPrice: 1200,
    quantity: 40,
    category: "Staples",
    description: "Saka Iodized Table Salt (1kg pack)",
    voiceKeywords: [
      "saka salt",
      "salt saka",
      "salt",
      "munyu",
      "kilo salt",
      "table salt",
      "iodized salt",
      "munyu gwa meza",
      "eka munyu",
      "salt ekimu",
      "saka", // Short brand
    ],
  },
  {
    id: "PROD005",
    name: "Uganda Best Wheat Flour 1kg",
    unit: "Kg",
    sellingPrice: 4500,
    costPrice: 4000,
    quantity: 30,
    category: "Staples",
    description: "Uganda Best Wheat Flour (for baking/Ugali, 1kg pack)",
    voiceKeywords: [
      "uganda best wheat flour",
      "uganda best flour",
      "wheat flour",
      "flour baking",
      "ugali flour",
      "kawunga wa ngano",
      "ngano flour",
      "eka ngano",
      "uganda best", // Short brand
    ],
  },
  {
    id: "PROD006",
    name: "Nambale Beans (Dry) 1kg",
    unit: "Kg",
    sellingPrice: 3800,
    costPrice: 3300,
    quantity: 25,
    category: "Staples",
    description: "Dry Nambale Beans (1kg pack)",
    voiceKeywords: [
      "nambale beans",
      "beans nambale",
      "beans",
      "dry beans",
      "kilo beans",
      "doodo",
      "ebijjanjalo",
      "eka bijjanjalo",
      "nambale", // Short type
    ],
  },
  {
    id: "PROD007",
    name: "Unga Amaizing Porridge Flour 1kg",
    unit: "Kg",
    sellingPrice: 5000,
    costPrice: 4500,
    quantity: 15,
    category: "Staples",
    description: "Unga Amaizing Porridge Flour (Mixed Grains, 1kg pack)",
    voiceKeywords: [
      "unga amaizing porridge flour",
      "unga porridge flour",
      "porridge flour",
      "millet flour",
      "sorghum flour",
      "obulo",
      "kawunga wa obulo",
      "bukye",
      "eka bukye",
      "amaizing flour",
      "unga porridge",
      "unga", // Short brand
    ],
  },

  // === Cooking Oils & Fats ===
  {
    id: "PROD008",
    name: "Sunseed Cooking Oil 1L",
    unit: "Liter",
    sellingPrice: 9800,
    costPrice: 9000,
    quantity: 20,
    category: "Cooking",
    description: "Sunseed Vegetable Cooking Oil (1 Liter Bottle)",
    voiceKeywords: [
      "sunseed cooking oil",
      "cooking oil sunseed",
      "sunseed oil",
      "cooking oil",
      "oil one litre",
      "mafuta ya kupika",
      "mafuta",
      "one liter oil",
      "sunseed one litre",
      "litere emu",
      "mafuta lita emu",
      "sunseed", // Short brand
    ],
  },
  {
    id: "PROD009",
    name: "Elianto Cooking Oil 2L",
    unit: "Liter",
    sellingPrice: 19200,
    costPrice: 18000,
    quantity: 10,
    category: "Cooking",
    description: "Elianto Vegetable Cooking Oil (2 Liter Bottle)",
    voiceKeywords: [
      "elianto cooking oil",
      "cooking oil elianto",
      "elianto oil",
      "cooking oil two litre",
      "mafuta two litre",
      "two liter oil",
      "litere bbiri",
      "mafuta lita bbiri",
      "elianto", // Short brand
    ],
  },
  {
    id: "PROD052", // New ID for Bidco Cooking Oil
    name: "Bidco Cooking Oil 1L",
    unit: "Liter",
    sellingPrice: 9500, // Slightly different price for variation
    costPrice: 8800,
    quantity: 18,
    category: "Cooking",
    description: "Bidco Vegetable Cooking Oil (1 Liter Bottle)",
    voiceKeywords: [
      "bidco cooking oil",
      "cooking oil bidco",
      "bidco oil",
      "cooking oil", // Generic for all oils
      "oil one litre",
      "mafuta",
      "bidco one litre",
      "bidco", // Short brand
    ],
  },
  {
    id: "PROD010",
    name: "Popco Cooking Oil Sachet 250ml",
    unit: "Sachet",
    sellingPrice: 2500,
    costPrice: 2000,
    quantity: 50,
    category: "Cooking",
    description: "Popco Small Cooking Oil Sachet (250ml)",
    voiceKeywords: [
      "popco cooking oil sachet",
      "popco oil sachet",
      "oil sachet",
      "sachet oil",
      "mafuta kadogo",
      "kadogo oil",
      "mafuta ka paketi",
      "mafuta aka package",
      "popco oil",
      "popco sachet",
      "popco", // Short brand
    ],
  },
  {
    id: "PROD011",
    name: "Kimbo Cooking Fat 500g",
    unit: "500g",
    sellingPrice: 29000,
    costPrice: 27000,
    quantity: 10,
    category: "Cooking",
    description: "Kimbo White Cooking Fat (500g tub)",
    voiceKeywords: [
      "kimbo cooking fat",
      "cooking fat kimbo",
      "kimbo", // Short brand
      "cooking fat",
      "kimbo fat",
      "mafuta ga kimbo",
      "kimbo gramu tano",
      "kimbo five hundred grams",
    ],
  },

  // === Beverages (Non-alcoholic) ===
  {
    id: "PROD012",
    name: "Coca-Cola Soda 500ml",
    unit: "Bottle",
    sellingPrice: 1500,
    costPrice: 1200,
    quantity: 60,
    category: "Beverages",
    description: "Coca-Cola (500ml bottle)",
    voiceKeywords: [
      "coca-cola soda",
      "coke soda",
      "coca-cola",
      "coke", // Short brand
      "soda",
      "fanta", // Still include other common types that might be stocked for broader search
      "sprite",
      "mirinda",
      "pepsi",
      "drink",
      "minerals",
      "soft drink",
      "boda boda", // Common local term
      "soda nusu",
      "enkata",
      "soda emu",
      "cola",
    ],
  },
  {
    id: "PROD013",
    name: "Rwenzori Water 500ml",
    unit: "Bottle",
    sellingPrice: 1000,
    costPrice: 800,
    quantity: 40,
    category: "Beverages",
    description: "Rwenzori Bottled Drinking Water (500ml)",
    voiceKeywords: [
      "rwenzori water",
      "water rwenzori",
      "rwenzori", // Short brand
      "water",
      "maji",
      "bottled water",
      "nica water", // Another common brand in Uganda
      "kabalagala", // Another common local term
      "maji ya chupa",
      "water emu",
    ],
  },
  {
    id: "PROD014",
    name: "Minute Maid Juice 200ml",
    unit: "Pack",
    sellingPrice: 1200,
    costPrice: 1000,
    quantity: 30,
    category: "Beverages",
    description: "Minute Maid Children's Juice Pack (200ml)",
    voiceKeywords: [
      "minute maid juice",
      "juice minute maid",
      "minute maid", // Short brand
      "juice",
      "small juice",
      "paketi juice",
      "fruity juice",
      "splash", // Another common brand
      "juice kadogo",
      "juice aka package",
      "maid juice",
    ],
  },
  {
    id: "PROD015",
    name: "Ssawa Fresh Milk 500ml",
    unit: "Sachet",
    sellingPrice: 1800,
    costPrice: 1500,
    quantity: 20,
    category: "Dairy",
    description: "Ssawa Fresh Milk Sachet (500ml)",
    voiceKeywords: [
      "ssawa fresh milk",
      "ssawa milk",
      "milk ssawa",
      "milk sachet",
      "milk",
      "sachet milk",
      "fresh milk",
      "mwerere", // Luganda for milk
      "akata kamesa", // Local term for small sachet
      "kameeme", // Another local term
      "ssawa", // Short brand
    ],
  },
  {
    id: "PROD016",
    name: "Dairy Farm UHT Milk 1L",
    unit: "Liter",
    sellingPrice: 3500,
    costPrice: 3000,
    quantity: 15,
    category: "Dairy",
    description: "Dairy Farm Long Life UHT Milk (1L carton)",
    voiceKeywords: [
      "dairy farm uht milk",
      "dairy farm milk",
      "milk dairy farm",
      "uht milk",
      "long life milk",
      "dairy milk one litre",
      "multiplex milk", // Another common brand
      "fresha milk", // Another common brand
      "amata lita emu",
      "milk lita emu",
      "dairy farm", // Short brand
    ],
  },
  {
    id: "PROD053", // New ID for Lato Milk
    name: "Lato UHT Milk 500ml",
    unit: "Liter",
    sellingPrice: 1700, // Slightly different price for variation
    costPrice: 1400,
    quantity: 25,
    category: "Dairy",
    description: "Lato Long Life UHT Milk (500ml sachet)",
    voiceKeywords: [
      "lato uht milk",
      "lato milk",
      "milk lato",
      "uht milk", // Generic for UHT milk
      "long life milk",
      "lato half litre",
      "lato", // Short brand
    ],
  },
  {
    id: "PROD017",
    name: "Nescafe Instant Coffee Sachet",
    unit: "Sachet",
    sellingPrice: 500,
    costPrice: 400,
    quantity: 100,
    category: "Beverages",
    description: "Nescafe Instant Coffee Sachet",
    voiceKeywords: [
      "nescafe instant coffee",
      "nescafe coffee",
      "coffee nescafe",
      "coffee sachet",
      "nescafe", // Short brand
      "instant coffee",
      "kawa", // Swahili/Luganda for coffee
      "afri cafe", // Another common brand
      "kawa kadogo",
      "coffee aka package",
    ],
  },
  {
    id: "PROD018",
    name: "Safari Tea Leaves Sachet",
    unit: "Sachet",
    sellingPrice: 500,
    costPrice: 400,
    quantity: 80,
    category: "Beverages",
    description: "Safari Tea Leaves Sachet",
    voiceKeywords: [
      "safari tea leaves",
      "safari tea",
      "tea safari",
      "tea leaves",
      "chai sachet",
      "tea sachet",
      "black tea",
      "chai", // Swahili/Luganda for tea
      "chai kadogo",
      "chai aka package",
      "safari", // Short brand
    ],
  },

  // === Confectionery & Snacks ===
  {
    id: "PROD019",
    name: "Britania Biscuits Small Pack",
    unit: "Pack",
    sellingPrice: 1000,
    costPrice: 800,
    quantity: 50,
    category: "Snacks",
    description:
      "Britania Assorted Biscuits (e.g., Digestives, Glucose, Small Pack)",
    voiceKeywords: [
      "britania biscuits",
      "biscuits britania",
      "britania", // Short brand
      "biscuits",
      "cookies",
      "small biscuits",
      "digestive", // Common types
      "glucose", // Common types
      "kadogo biscuit",
      "biskuti", // Swahili/Luganda for biscuits
      "paketi ya biskuti",
    ],
  },
  {
    id: "PROD020",
    name: "Crown Sweets Small Pack",
    unit: "Pack",
    sellingPrice: 500,
    costPrice: 350,
    quantity: 70,
    category: "Snacks",
    description: "Crown Sweets Assorted Candies (Small Pack)",
    voiceKeywords: [
      "crown sweets",
      "sweets crown",
      "crown", // Short brand
      "sweets",
      "candies",
      "lollipops",
      "bubblegum",
      "kabubu", // Local term for chewing gum
      "bombo", // Swahili for sweets
      "peremende", // Swahili for sweets
      "peremende kadogo",
    ],
  },
  {
    id: "PROD021",
    name: "Mukene Bread Small Loaf",
    unit: "Loaf",
    sellingPrice: 4000,
    costPrice: 3500,
    quantity: 15,
    category: "Bakery",
    description: "Mukene Small Sliced Bread Loaf",
    voiceKeywords: [
      "mukene bread",
      "bread mukene",
      "mukene", // Short brand
      "bread",
      "loaf of bread",
      "sliced bread",
      "katogo bread", // Local term
      "muwanda", // Local term
      "mukate", // Luganda for bread
      "bread emu",
    ],
  },
  {
    id: "PROD022",
    name: "Mandazi (Piece)",
    unit: "Piece",
    sellingPrice: 500,
    costPrice: 300,
    quantity: 30,
    category: "Bakery",
    description: "Freshly Made Mandazi (single piece)",
    voiceKeywords: [
      "mandazi",
      "chapati", // Common related item, often sold together
      "mandazi piece",
      "chapati piece",
      "chapati satu",
      "mandazi satu",
      "mandazi emu",
      "chapati emu",
    ],
  },
  {
    id: "PROD023",
    name: "Simba Crisps Small Pack",
    unit: "Pack",
    sellingPrice: 1000,
    costPrice: 800,
    quantity: 40,
    category: "Snacks",
    description: "Simba Potato Crisps (Small Pack)",
    voiceKeywords: [
      "simba crisps",
      "crisps simba",
      "simba chips",
      "simba", // Short brand
      "crisps",
      "chips",
      "potato chips",
      "chips kadogo",
      "paketi ya chipsi",
    ],
  },
  {
    id: "PROD024",
    name: "Indomie Instant Noodles Packet",
    unit: "Packet",
    sellingPrice: 1000,
    costPrice: 800,
    quantity: 30,
    category: "Staples",
    description: "Indomie Instant Noodles (Single Packet)",
    voiceKeywords: [
      "indomie instant noodles",
      "indomie noodles",
      "noodles indomie",
      "indomie", // Short brand
      "noodles",
      "instant noodles",
      "indomie kadogo",
      "paketi ya indomie",
      "indomie aka package",
    ],
  },

  // === Household & Personal Care ===
  {
    id: "PROD025",
    name: "Jamaa Laundry Bar Soap 1kg",
    unit: "Piece",
    sellingPrice: 5900,
    costPrice: 5000,
    quantity: 25,
    category: "Household",
    description: "Jamaa Laundry Bar Soap (1kg)",
    voiceKeywords: [
      "jamaa laundry bar soap",
      "jamaa soap",
      "soap jamaa",
      "jamaa", // Short brand
      "bar soap",
      "laundry soap",
      "blue band soap", // Common alternative
      "white star soap", // Common alternative
      "naira soap", // Common alternative
      "saponj", // Swahili/Luganda for soap
      "sabuuni", // Swahili/Luganda for soap
      "sabuuni ekimu",
      "sabuuni gwa kusamba", // Luganda for washing soap
    ],
  },
  {
    id: "PROD054", // New ID for Mukwano Soap
    name: "Mukwano Laundry Bar Soap 1kg",
    unit: "Piece",
    sellingPrice: 5800, // Slightly different price for variation
    costPrice: 4900,
    quantity: 20,
    category: "Household",
    description: "Mukwano Laundry Bar Soap (1kg)",
    voiceKeywords: [
      "mukwano laundry bar soap",
      "mukwano soap",
      "soap mukwano",
      "mukwano", // Short brand
      "bar soap", // Generic for all bar soaps
      "laundry soap",
      "sabuuni",
    ],
  },
  {
    id: "PROD026",
    name: "Omo Washing Powder Sachet",
    unit: "Sachet",
    sellingPrice: 1000,
    costPrice: 800,
    quantity: 60,
    category: "Household",
    description: "Omo Washing Powder Sachet",
    voiceKeywords: [
      "omo washing powder",
      "omo powder",
      "washing powder omo",
      "omo sachet",
      "omo", // Short brand
      "washing powder",
      "nepa sachet", // Common alternative
      "powder soap",
      "omo kadogo",
      "sabuuni ya powder",
      "powder aka package",
    ],
  },
  {
    id: "PROD055", // New ID for Sunlight Washing Powder
    name: "Sunlight Washing Powder Sachet",
    unit: "Sachet",
    sellingPrice: 1100, // Slightly different price for variation
    costPrice: 850,
    quantity: 50,
    category: "Household",
    description: "Sunlight Washing Powder Sachet",
    voiceKeywords: [
      "sunlight washing powder",
      "sunlight powder",
      "washing powder sunlight",
      "sunlight sachet",
      "sunlight", // Short brand
      "washing powder", // Generic for all washing powders
      "powder soap",
      "sabuuni ya powder",
    ],
  },
  {
    id: "PROD027",
    name: "Mama Lemon Dishwashing Liquid Small",
    unit: "Bottle",
    sellingPrice: 3000,
    costPrice: 2500,
    quantity: 15,
    category: "Household",
    description: "Mama Lemon Small Dishwashing Liquid Bottle",
    voiceKeywords: [
      "mama lemon dishwashing liquid",
      "mama lemon liquid",
      "dishwashing liquid mama lemon",
      "mama lemon", // Short brand
      "dish soap",
      "washing liquid",
      "sabuuni wa kubiikira", // Luganda for dish soap
      "liquid sabuuni",
      "mama lemon soap",
    ],
  },
  {
    id: "PROD028",
    name: "Kifaru Matches Box",
    unit: "Box",
    sellingPrice: 200,
    costPrice: 150,
    quantity: 100,
    category: "Household",
    description: "Kifaru Small Box of Matches",
    voiceKeywords: [
      "kifaru matches",
      "matches kifaru",
      "kifaru", // Short brand
      "matches",
      "matchbox",
      "fire matches",
      "kabiriiti", // Swahili/Luganda for matches
      "kandila", // Swahili/Luganda for candle, sometimes confused
      "kabiriiti akamu",
    ],
  },
  {
    id: "PROD029",
    name: "Rosepetals Toilet Paper Roll",
    unit: "Roll",
    sellingPrice: 1000,
    costPrice: 800,
    quantity: 30,
    category: "Personal Care",
    description: "Rosepetals Single Toilet Paper Roll",
    voiceKeywords: [
      "rosepetals toilet paper",
      "toilet paper rosepetals",
      "rosepetals", // Short brand
      "toilet paper",
      "tissue", // Common alternative name
      "toilet roll",
      "papeya", // Luganda for paper
      "toilet paper emu",
      "tissue paper",
    ],
  },
  {
    id: "PROD030",
    name: "Always Sanitary Pads Packet",
    unit: "Packet",
    sellingPrice: 5000,
    costPrice: 4500,
    quantity: 20,
    category: "Personal Care",
    description: "Always Packet of Sanitary Pads",
    voiceKeywords: [
      "always sanitary pads",
      "sanitary pads always",
      "always pads",
      "always", // Short brand
      "pads",
      "females pads",
      "obubugo", // Luganda for pads/diapers
      "koti", // Common local term for pads
      "paketi ya pads",
    ],
  },
  {
    id: "PROD031",
    name: "Colgate Toothpaste Small Tube",
    unit: "Tube",
    sellingPrice: 3000,
    costPrice: 2500,
    quantity: 15,
    category: "Personal Care",
    description: "Colgate Small Tube of Toothpaste",
    voiceKeywords: [
      "colgate toothpaste",
      "toothpaste colgate",
      "colgate", // Short brand
      "toothpaste",
      "sensodyne", // Common alternative
      "toothbrush paste",
      "mukka", // Local term for paste
      "paseti", // Swahili for paste
      "toothpaste kadogo",
      "colgate paste",
    ],
  },
  {
    id: "PROD032",
    name: "Tiger Razor Blades Small Pack",
    unit: "Pack",
    sellingPrice: 1000,
    costPrice: 800,
    quantity: 25,
    category: "Personal Care",
    description: "Tiger Disposable Razor Blades (Small Pack)",
    voiceKeywords: [
      "tiger razor blades",
      "razor blades tiger",
      "tiger blades",
      "tiger", // Short brand
      "razors",
      "blades",
      "shaving blades",
      "kali", // Local term for sharp items
      "blades kadogo",
      "blades aka package",
      "blade emu",
    ],
  },
  {
    id: "PROD033",
    name: "Dettol Disinfectant 100ml",
    unit: "Bottle",
    sellingPrice: 4000,
    costPrice: 3500,
    quantity: 10,
    category: "Household",
    description: "Dettol Antiseptic/Disinfectant (100ml bottle)",
    voiceKeywords: [
      "dettol disinfectant",
      "dettol antiseptic",
      "disinfectant dettol",
      "dettol", // Short brand
      "antiseptic",
      "germ killer",
      "dettol kadogo",
      "omuganda", // Local term for antiseptic
      "dettol aka chupa",
      "dettol bottle",
    ],
  },

  // === Energy & Fuel ===
  {
    id: "PROD034",
    name: "Paraffin Kerosene 1L",
    unit: "Liter",
    sellingPrice: 4000,
    costPrice: 3500,
    quantity: 10,
    category: "Energy",
    description: "Kerosene/Paraffin for lamps/stoves (1L)",
    voiceKeywords: [
      "paraffin kerosene",
      "paraffin",
      "kerosene",
      "petrol", // Sometimes confused
      "oil light",
      "gaasi", // Swahili/Luganda for kerosene/gas
      "ebbuga", // Local term for fuel
      "paraffin lita emu",
      "gaasi lita emu",
    ],
  },
  {
    id: "PROD035",
    name: "Charcoal Small Bag",
    unit: "Bag",
    sellingPrice: 5000,
    costPrice: 4000,
    quantity: 5,
    category: "Energy",
    description: "Small Bag of Charcoal (e.g., small basin equivalent)",
    voiceKeywords: [
      "charcoal small bag",
      "charcoal",
      "makala", // Swahili/Luganda for charcoal
      "bag of charcoal",
      "basin charcoal",
      "makala kadogo",
      "gunia ya makala",
      "makala akamu",
    ],
  },
  {
    id: "PROD036",
    name: "Eveready AA Batteries Pair",
    unit: "Pair",
    sellingPrice: 2000,
    costPrice: 1500,
    quantity: 20,
    category: "Electronics",
    description: "Eveready AA Batteries (Pair)",
    voiceKeywords: [
      "eveready AA batteries",
      "AA batteries eveready",
      "eveready batteries",
      "eveready", // Short brand
      "AA batteries",
      "double A batteries",
      "torch batteries",
      "battery ya tochi",
      "kali", // Local term for powerful/sharp
      "betri bbiri", // Luganda for two batteries
      "eveready AA",
    ],
  },
  {
    id: "PROD037",
    name: "Philips AAA Batteries Pair",
    unit: "Pair",
    sellingPrice: 2000,
    costPrice: 1500,
    quantity: 20,
    category: "Electronics",
    description: "Philips AAA Batteries (Pair)",
    voiceKeywords: [
      "philips AAA batteries",
      "AAA batteries philips",
      "philips batteries",
      "philips", // Short brand
      "AAA batteries",
      "triple A batteries",
      "small batteries",
      "battery kadogo",
      "betri ttondo", // Luganda for small battery
      "philips AAA",
    ],
  },

  // === Dairy & Produce (common small shop items) ===
  {
    id: "PROD038",
    name: "Eggs Tray of 30",
    unit: "Tray",
    sellingPrice: 13000,
    costPrice: 11000,
    quantity: 5,
    category: "Dairy & Produce",
    description: "Tray of 30 Eggs",
    voiceKeywords: [
      "eggs tray",
      "tray of eggs",
      "thirty eggs",
      "amayanda gombi", // Luganda for a tray of eggs (or many eggs)
      "eggs nusu dazen", // Half dozen (common for 30 in a tray)
      "tray ya mayai", // Swahili for egg tray
      "eggs",
    ],
  },
  {
    id: "PROD039",
    name: "Eggs (Piece)",
    unit: "Piece",
    sellingPrice: 500,
    costPrice: 400,
    quantity: 100,
    category: "Dairy & Produce",
    description: "Single Egg",
    voiceKeywords: [
      "egg",
      "single egg",
      "one egg",
      "egg moja", // Swahili for one egg
      "egyi", // Luganda for egg
      "eggi", // Another Luganda for egg
      "eggi limu", // Luganda for one egg
    ],
  },
  {
    id: "PROD040",
    name: "Local Tomatoes 1kg",
    unit: "Kg",
    sellingPrice: 3000,
    costPrice: 2500,
    quantity: 5,
    category: "Fresh Produce",
    description: "Fresh Local Tomatoes (1kg)",
    voiceKeywords: [
      "local tomatoes",
      "tomatoes local",
      "tomatoes",
      "nyanya", // Swahili/Luganda for tomatoes
      "kilo tomatoes",
      "nyanya kilo",
      "tomatoes kilo",
      "eka nyanya", // Luganda for one kilo of tomatoes
      "fresh tomatoes",
    ],
  },
  {
    id: "PROD041",
    name: "Red Onions 1kg",
    unit: "Kg",
    sellingPrice: 2500,
    costPrice: 2000,
    quantity: 5,
    category: "Fresh Produce",
    description: "Fresh Red Onions (1kg)",
    voiceKeywords: [
      "red onions",
      "onions red",
      "onions",
      "vitunguu", // Swahili for onions
      "kilo onions",
      "katungulu", // Luganda for onions
      "onions kilo",
      "eka vitunguu", // Luganda for one kilo of onions
    ],
  },

  // === Miscellaneous ===
  {
    id: "PROD042",
    name: "MTN Airtime Card 1000",
    unit: "Card",
    sellingPrice: 1000,
    costPrice: 950,
    quantity: 20,
    category: "Telecommunication",
    description: "MTN Airtime Scratch Card UGX 1,000",
    voiceKeywords: [
      "mtn airtime card 1000",
      "mtn airtime",
      "airtime mtn",
      "mtn 1000 airtime",
      "mtn scratch card",
      "elimu mtn", // Local term for 1000 airtime
      "kaadi mtn", // Luganda for MTN card
      "mtn eludi", // Local slang for MTN airtime
      "mtn akakadi", // Local term for small MTN card
      "mtn", // Short brand for easy voice entry
      "m t n", // Pronunciation help
      "one thousand mtn", // Common phrasing
    ],
  },
  {
    id: "PROD043",
    name: "Airtel Airtime Card 2000",
    unit: "Card",
    sellingPrice: 2000,
    costPrice: 1900,
    quantity: 15,
    category: "Telecommunication",
    description: "Airtel Airtime Scratch Card UGX 2,000",
    voiceKeywords: [
      "airtel airtime card 2000",
      "airtel airtime",
      "airtime airtel",
      "airtel 2000 airtime",
      "airtel scratch card",
      "kaadi airtel", // Luganda for Airtel card
      "airtel eludi", // Local slang for Airtel airtime
      "airtel akakadi", // Local term for small Airtel card
      "airtel", // Short brand for easy voice entry
      "two thousand airtel", // Common phrasing
    ],
  },
  {
    id: "PROD044",
    name: "Embassy Cigarettes (Stick)",
    unit: "Stick",
    sellingPrice: 500,
    costPrice: 400,
    quantity: 100,
    category: "Tobacco",
    description: "Embassy Single Cigarette Stick",
    voiceKeywords: [
      "embassy cigarettes",
      "cigarettes embassy",
      "embassy stick",
      "embassy", // Short brand
      "cigarette",
      "fag", // Slang
      "stick cigarette",
      "rolex", // Slang (though also a food item, context dependent)
      "sigara", // Swahili/Luganda for cigarette
      "sigara moja", // Swahili for one cigarette
      "fag emu", // Luganda for one fag
    ],
  },
  {
    id: "PROD045",
    name: "Local Sweet Potatoes 1kg",
    unit: "Kg",
    sellingPrice: 1500,
    costPrice: 1200,
    quantity: 10,
    category: "Fresh Produce",
    description: "Local Sweet Potatoes (1kg)",
    voiceKeywords: [
      "local sweet potatoes",
      "sweet potatoes local",
      "sweet potatoes",
      "lumonde", // Luganda for sweet potatoes
      "kilo lumonde",
      "obutaka", // Another local term
      "lumonde kilo",
      "eka lumonde", // Luganda for one kilo of sweet potatoes
    ],
  },
  {
    id: "PROD046",
    name: "Kinigi Irish Potatoes 1kg",
    unit: "Kg",
    sellingPrice: 2000,
    costPrice: 1700,
    quantity: 10,
    category: "Fresh Produce",
    description: "Kinigi Irish Potatoes (1kg)",
    voiceKeywords: [
      "kinigi irish potatoes",
      "irish potatoes kinigi",
      "kinigi potatoes",
      "kinigi", // Short type
      "irish potatoes",
      "potatoes",
      "kilo potatoes",
      "obumonde bwa kizungu", // Luganda for Irish potatoes
      "entulege", // Another local term for potatoes
      "eka entulege", // Luganda for one kilo of potatoes
    ],
  },
  {
    id: "PROD047",
    name: "Cooking Gas Refill Small Cylinder",
    unit: "Cylinder",
    sellingPrice: 40000,
    costPrice: 35000,
    quantity: 2,
    category: "Energy",
    description: "Small Cooking Gas Cylinder Refill (e.g., 6kg)",
    voiceKeywords: [
      "cooking gas refill",
      "gas refill",
      "small gas",
      "gas cylinder",
      "gas emu", // Luganda for one gas cylinder
      "refill gas",
      "ka gas", // Local term for small gas
      "gas", // Short term
    ],
  },
  {
    id: "PROD048",
    name: "Vaseline Body Lotion Small",
    unit: "Bottle",
    sellingPrice: 5000,
    costPrice: 4000,
    quantity: 10,
    category: "Personal Care",
    description: "Vaseline Small Body Lotion Bottle (e.g., 100ml)",
    voiceKeywords: [
      "vaseline body lotion",
      "body lotion vaseline",
      "vaseline lotion",
      "vaseline", // Short brand
      "lotion",
      "body lotion",
      "small lotion",
      "lotion kadogo",
      "mafuta ga mukwano", // Local term for lotion/moisturizer
      "lotion aka chupa", // Local term for bottle of lotion
    ],
  },
  {
    id: "PROD049",
    name: "Afro Rich Hair Oil Sachet",
    unit: "Sachet",
    sellingPrice: 500,
    costPrice: 300,
    quantity: 30,
    category: "Personal Care",
    description: "Afro Rich Hair Oil Sachet",
    voiceKeywords: [
      "afro rich hair oil",
      "hair oil afro rich",
      "afro rich oil",
      "afro oil", // Short brand
      "hair oil",
      "sachet hair oil",
      "afro hair oil",
      "mafuta ga nviiri", // Luganda for hair oil
      "oil kadogo",
      "mafuta aka package",
      "afro rich", // Full brand
    ],
  },
  {
    id: "PROD050",
    name: "Nomi Ketchup Sachet",
    unit: "Sachet",
    sellingPrice: 500,
    costPrice: 300,
    quantity: 40,
    category: "Condiments",
    description: "Nomi Tomato Ketchup Sachet",
    voiceKeywords: [
      "nomi ketchup sachet",
      "ketchup nomi",
      "nomi ketchup",
      "nomi", // Short brand
      "ketchup",
      "sachet ketchup",
      "tomato sauce sachet",
      "sauce kadogo",
      "ketchup kadogo",
      "sauce ya nyanya", // Swahili for tomato sauce
      "ketchup aka package",
    ],
  },
];

const initialNetworks = [
  {
    id: "NET001",
    name: "Mtn",
    commissionRate: {
      deposit: 0.005,
      withdrawal: 0.015,
    },
    float: 500000,
    voiceKeywords: [
      "mtn", // Crucial short term for easy voice entry
      "mtn mobile money",
      "mtn momo",
      "yellow money",
      "momo",
      "mtn cash",
      "momo mtn",
      "m t n", // Pronunciation helper
    ],
  },
  {
    id: "NET002",
    name: "Airtel",
    commissionRate: {
      deposit: 0.006,
      withdrawal: 0.016,
    },
    float: 400000,
    voiceKeywords: [
      "airtel", // Crucial short term for easy voice entry
      "airtel money",
      "airtel momo",
      "red money",
      "momo airtel",
      "airtel cash",
    ],
  },
];

const initialTransactions = [];

export { initialProducts, initialNetworks, initialTransactions };
