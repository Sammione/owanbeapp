export const AREAS = ["Ikotun", "Egbeda", "Igando"] as const;
export const EVENTS = ["Wedding", "Burial", "Birthday", "Naming", "Church", "Party"] as const;
export const VENUE_CATEGORIES = [
  "Event Halls & Marquees",
  "Garden & Outdoor Venues",
] as const;

export const CATEGORIES = [
  // Luxury Wardrobe & Footwear
  "Aso-ebi / lace",
  "Agbada",
  "Gele",
  "Beads & jewelry",
  "Shoes & Footwear",
  "Ankara",
  "Accessories",
  // Event Halls & Venues
  "Event Halls & Marquees",
  "Garden & Outdoor Venues",
  // Event Equipment & Hardware
  "Coolers & Ice Chests",
  "Cooking Pots & Burners",
  "Chafing Dishes & Food Warmers",
  "Canopies, Tables & Chairs",
  "Generators & Sound Systems",
  // Catering & Party Services
  "Party Catering & Jollof",
  "Small Chops & Finger Foods",
  "Cocktails & Drinks Bar",
  "Event Ushers & Protocol",
] as const;

export const EQUIPMENT_CATEGORIES = [
  "Coolers & Ice Chests",
  "Cooking Pots & Burners",
  "Chafing Dishes & Food Warmers",
  "Canopies, Tables & Chairs",
  "Generators & Sound Systems",
] as const;

export const SERVICE_CATEGORIES = [
  "Party Catering & Jollof",
  "Small Chops & Finger Foods",
  "Cocktails & Drinks Bar",
  "Event Ushers & Protocol",
] as const;

export const FASHION_CATEGORIES = [
  "Aso-ebi / lace",
  "Agbada",
  "Gele",
  "Beads & jewelry",
  "Shoes & Footwear",
  "Ankara",
  "Accessories",
] as const;

export const VENUE_SLOTS = [
  "Main Stage & Hall View",
  "Banquet Seating Layout",
  "Gate, Compound & Parking",
  "VIP / Bridal Dressing Suite",
  "Restrooms & Caterer Prep Area",
] as const;

export const VENUE_CAPACITIES = [
  "Intimate Hall (80 - 150 Guests)",
  "Standard Banquet (200 - 350 Guests)",
  "Grand Marquee (400 - 650 Guests)",
  "Mega Convention (800 - 1,500+ Guests)",
] as const;

export const VENUE_AMENITIES = [
  "Full Central / Standing AC Chillers",
  "Heavy Duty Standby Generator (Included)",
  "Secured Interlocked Parking (80+ Cars)",
  "Dedicated VIP / Bridal Dressing Suite",
  "Elevated Stage & Ambient Lighting Rig",
  "Caterer Prep Kitchen & Washing Bay",
  "Uniformed Security & Bouncers",
] as const;

export const VENUE_SUBSCRIPTION_NGN = 7500;
export const VENUE_INSPECTION_ESCROW_NGN = 50000;

export const EQUIPMENT_CAPACITIES = [
  "50L Beverage Cooler (50-70 drinks)",
  "100L Party Cooler (100-140 drinks)",
  "150L Industrial Chest (150-200 drinks + 4 ice bags)",
  "Size 30 Cooking Pot (Serves 60-80)",
  "Size 40 Cooking Pot (Serves 120-150)",
  "Size 50 Giant Cast-Iron Pot (Serves 250+)",
  "Single Roll-Top Chafing Dish",
  "Set of 4 Chafing Dishes (Complete Buffet)",
  "10 Chiavari Chairs Set",
  "50 Banquet Chairs + 5 Large Tables",
  "Standard 10x10 Event Canopy",
  "3.5kVA Generator (Sound & Fans)",
  "Party PA Speaker + Dual Mics",
] as const;

export const CATERING_CAPACITIES = [
  "Intimate Gathering (30 - 50 Guests)",
  "Standard Owambe (80 - 120 Guests)",
  "Grand Reception (150 - 250 Guests)",
  "Mega Celebration (300+ Guests)",
] as const;

export function isVenueCategory(category?: string | null): boolean {
  if (!category) return false;
  return (VENUE_CATEGORIES as readonly string[]).includes(category);
}

export function isEquipmentCategory(category?: string | null): boolean {
  if (!category) return false;
  return (EQUIPMENT_CATEGORIES as readonly string[]).includes(category);
}

export function isServiceCategory(category?: string | null): boolean {
  if (!category) return false;
  return (SERVICE_CATEGORIES as readonly string[]).includes(category);
}

export function isFashionCategory(category?: string | null): boolean {
  if (!category) return true;
  return (FASHION_CATEGORIES as readonly string[]).includes(category);
}

export const EU_SHOE_SIZES = [
  "EU 36 (UK 3)",
  "EU 37 (UK 4)",
  "EU 38 (UK 5)",
  "EU 39 (UK 6)",
  "EU 40 (UK 6.5)",
  "EU 41 (UK 7)",
  "EU 42 (UK 8)",
  "EU 43 (UK 9)",
  "EU 44 (UK 10)",
  "EU 45 (UK 11)",
  "EU 46 (UK 12)",
] as const;

export const HEEL_HEIGHTS = [
  "Flat (0 - 1 in)",
  "Low Heel (1.5 - 2 in)",
  "Mid Heel (2.5 - 3.5 in)",
  "High Stiletto (4+ in)",
  "Platform / Wedge",
  "Men's Flat Sole / Loafer",
] as const;

export const FOOTWEAR_STYLES = [
  "Women's Embellished Stilettos",
  "Women's Block Heel Sandals",
  "Women's Regal Mules / Slippers",
  "Men's Velvet Slip-on Loafers",
  "Men's Traditional Leather Half-Shoes",
  "Beaded Traditional Slippers",
] as const;

export const COLORS = [
  { name: "Emerald Green", hex: "#0E5A3C", value: "emerald", keywords: ["emerald", "green"] },
  { name: "Midnight Navy", hex: "#121F3D", value: "navy", keywords: ["navy", "blue"] },
  { name: "Champagne Gold", hex: "#D4AF37", value: "gold", keywords: ["gold", "champagne", "yellow"] },
  { name: "Burgundy Wine", hex: "#5B1221", value: "burgundy", keywords: ["burgundy", "wine", "maroon"] },
  { name: "Lilac / Purple", hex: "#7E57C2", value: "lilac", keywords: ["lilac", "purple", "violet"] },
  { name: "Royal Coral", hex: "#E0533C", value: "coral", keywords: ["coral", "peach"] },
  { name: "Burnt Orange", hex: "#C85A17", value: "orange", keywords: ["orange", "rust", "bronze", "teal"] },
  { name: "Classic Black", hex: "#1C1C1E", value: "black", keywords: ["black", "onyx"] },
  { name: "Pristine White", hex: "#F5F5F7", value: "white", keywords: ["white", "cream", "ivory"], border: true },
] as const;

export const CLEANING_FEE = 2000;
export const DELIVERY_FEE = 2500;
export const TRUCK_DELIVERY_FEE = 8000;
export const OWNER_SHARE = 0.7;
export const VENDOR_SHARE = 0.8;
/** Days the renter keeps the item: the day before, the event day, the day after. */
export const RENTAL_DAYS = 3;
/** Days after return the item is blocked for cleaning and inspection. */
export const CLEANING_BUFFER_DAYS = 2;

export const GRADES = {
  A: { label: "Like new", note: "Worn 0–2 times. No visible flaws." },
  B: { label: "Gently used", note: "Small signs of wear guests won’t notice." },
  C: { label: "Budget", note: "Visible but acceptable wear. Priced lower." },
} as const;

export const CHECKLIST = [
  { key: "stains", label: "No stains" },
  { key: "tears", label: "No tears or loose seams" },
  { key: "stones", label: "No missing stones, beads or sequins" },
  { key: "fasteners", label: "Zips, hooks and buttons work" },
  { key: "smell", label: "Smells clean" },
  { key: "colour", label: "No fading" },
  { key: "measurements", label: "Measurements match the listing" },
  { key: "pieces", label: "All pieces present" },
] as const;

export const FALLBACK_NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "Zenith Bank", code: "057" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "United Bank For Africa (UBA)", code: "033" },
  { name: "Kuda Microfinance Bank", code: "50211" },
  { name: "OPay Digital Services", code: "999992" },
  { name: "PalmPay", code: "999991" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Fidelity Bank", code: "070" },
  { name: "Sterling Bank", code: "232" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "Wema Bank / ALAT", code: "035" },
  { name: "Moniepoint MFB", code: "50515" },
];

