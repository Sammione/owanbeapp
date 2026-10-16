export const AREAS = ["Ikotun", "Egbeda", "Igando"] as const;
export const EVENTS = ["Wedding", "Burial", "Birthday", "Naming", "Church", "Party"] as const;
export const CATEGORIES = [
  "Aso-ebi / lace",
  "Agbada",
  "Gele",
  "Beads & jewelry",
  "Ankara",
  "Accessories",
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
export const OWNER_SHARE = 0.7;
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

