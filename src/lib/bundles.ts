/**
 * Outfit Bundle Builder ("Complete the Look")
 * Pair Aso-ebi + Gele + Shoes + Beads as a discounted bundle (15% OFF)
 */

export const BUNDLE_DISCOUNT_PERCENT = 15;

export type BundleSlot = "attire" | "gele" | "beads" | "shoes";

export type BundleItem = {
  id: string;
  title: string;
  category: string;
  price: number;
  deposit: number;
  photos: string[];
  size_label?: string | null;
  slot: BundleSlot;
};

export type CuratedBundlePreset = {
  id: string;
  title: string;
  subtitle: string;
  gender: "women" | "men";
  event: string;
  tag: string;
  items: {
    attire: BundleItem;
    gele: BundleItem;
    beads: BundleItem;
    shoes: BundleItem;
  };
};

/**
 * Calculate total price, bundle discount, and savings
 */
export function calculateBundlePricing(items: { price: number; deposit: number }[]) {
  const originalRentalTotal = items.reduce((sum, it) => sum + (it.price || 0), 0);
  const totalDeposit = items.reduce((sum, it) => sum + (it.deposit || 0), 0);

  // 15% discount applies when 2 or more complementary items are bundled
  const isEligible = items.length >= 2;
  const discountNaira = isEligible
    ? Math.round((originalRentalTotal * BUNDLE_DISCOUNT_PERCENT) / 100)
    : 0;
  const discountedRentalTotal = originalRentalTotal - discountNaira;
  const grandBundleTotal = discountedRentalTotal + totalDeposit;

  return {
    itemCount: items.length,
    originalRentalTotal,
    discountNaira,
    discountedRentalTotal,
    totalDeposit,
    grandBundleTotal,
    discountPercent: isEligible ? BUNDLE_DISCOUNT_PERCENT : 0,
    savingsText: `Save ₦${discountNaira.toLocaleString()} (${BUNDLE_DISCOUNT_PERCENT}% Bundle Discount)`,
  };
}

/**
 * Check whether a set of items in a cart forms an outfit bundle
 */
export function checkCartBundleEligibility(cartCategories: string[]): {
  isBundle: boolean;
  matchingCount: number;
  discountNaira: number;
} {
  const FASHION_SLOTS = [
    "Aso-ebi / lace",
    "Agbada",
    "Gele",
    "Beads & jewelry",
    "Shoes & Footwear",
    "Ankara",
  ];

  const matched = cartCategories.filter((cat) => FASHION_SLOTS.includes(cat));
  const uniqueCategories = new Set(matched);

  // Eligible if at least 2 distinct fashion categories (e.g. Attire + Gele, or Attire + Shoes + Beads)
  const isBundle = uniqueCategories.size >= 2;
  return {
    isBundle,
    matchingCount: matched.length,
    discountNaira: isBundle ? BUNDLE_DISCOUNT_PERCENT : 0,
  };
}

// Curated Showcase Bundles for the Bundle Builder Page
export const CURATED_BUNDLES: CuratedBundlePreset[] = [
  {
    id: "bundle-royal-emerald",
    title: "The Royal Emerald Matron Look",
    subtitle: "Emerald George & Blouse + Champagne Gold Pleated Auto-Gele + Coral Choker + Bridal Crystal Pumps",
    gender: "women",
    event: "Wedding / Aso-ebi",
    tag: "Most Popular Women's Bundle",
    items: {
      attire: {
        id: "attire-emerald",
        title: "Royal Emerald Green George & Blouse Set",
        category: "Aso-ebi / lace",
        price: 18000,
        deposit: 20000,
        photos: ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"],
        size_label: "L (Bust 38-40″)",
        slot: "attire",
      },
      gele: {
        id: "gele-champagne",
        title: "Champagne Gold Pleated Auto-Gele & Bridal Fan",
        category: "Gele",
        price: 10000,
        deposit: 8000,
        photos: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80"],
        size_label: "Adjustable Velcro",
        slot: "gele",
      },
      beads: {
        id: "beads-coral",
        title: "Benin Royal Coral Bead Collar & Earring Set",
        category: "Beads & jewelry",
        price: 15000,
        deposit: 15000,
        photos: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80"],
        size_label: "Multi-strand Princess Length",
        slot: "beads",
      },
      shoes: {
        id: "shoes-bridal",
        title: "Crystal Embellished Ivory Satin Bridal Pumps",
        category: "Shoes & Footwear",
        price: 18000,
        deposit: 25000,
        photos: ["/images/shoes_bridal_heels.jpg"],
        size_label: "EU 38 (UK 5)",
        slot: "shoes",
      },
    },
  },
  {
    id: "bundle-regal-navy-agbada",
    title: "The Regal Navy Groom & Chief Ensemble",
    subtitle: "Midnight Navy 3-Piece Velvet Agbada + Hand-stitched Velvet Fila + Royal Navy Velvet Tassel Loafers + Regal Coral Neckpiece",
    gender: "men",
    event: "Wedding / Coronation",
    tag: "High-Caliber Men's Bundle",
    items: {
      attire: {
        id: "attire-agbada-navy",
        title: "Midnight Navy 3-Piece Velvet Agbada Set",
        category: "Agbada",
        price: 25000,
        deposit: 25000,
        photos: ["https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80"],
        size_label: "XL (Chest 44-46″)",
        slot: "attire",
      },
      gele: {
        id: "cap-velvet-fila",
        title: "Embroidered Gold Crest Velvet Fila Cap",
        category: "Gele",
        price: 6000,
        deposit: 5000,
        photos: ["https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=800&q=80"],
        size_label: "Size 22.5″",
        slot: "gele",
      },
      beads: {
        id: "beads-chief-coral",
        title: "Heavy Benin Chieftaincy Coral Bead Rope & Bracelet",
        category: "Beads & jewelry",
        price: 12000,
        deposit: 15000,
        photos: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80"],
        size_label: "Heavy Gauge Coral",
        slot: "beads",
      },
      shoes: {
        id: "shoes-navy-loafers",
        title: "Royal Navy Velvet Loafers with Gold Tassel",
        category: "Shoes & Footwear",
        price: 22000,
        deposit: 25000,
        photos: ["/images/shoes_velvet_loafers.jpg"],
        size_label: "EU 44 (UK 10)",
        slot: "shoes",
      },
    },
  },
];
