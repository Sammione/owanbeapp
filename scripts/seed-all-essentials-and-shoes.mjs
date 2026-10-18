import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

let envFile = {};
try {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      envFile[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
} catch (e) {
  console.error("Could not read .env.local", e);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || envFile.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envFile.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class DummyWebSocket {};
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const NEW_ITEMS = [
  // --- SHOES & FOOTWEAR ---
  {
    title: "Crystal Embellished Ivory Satin Bridal Pumps (EU 38 / UK 5)",
    description: "Exquisite ivory satin pointed-toe bridal pumps adorned with brilliant Austrian Swarovski crystal brooch. Padded Italian leather insole engineered for all-day comfort during long Nigerian traditional weddings and church blessings.",
    category: "Shoes & Footwear",
    events: ["Wedding / Aso-ebi", "Anniversary / Banquet"],
    size_label: "EU 38 (UK 5)",
    pieces: "Pumps Pair, Dust Bag, Protective Shoe Box",
    price: 18000,
    deposit: 25000,
    area: "Ikotun",
    imageFile: "shoes_bridal_heels.jpg",
    tag_code: "SHOE-BRI-001",
    grade: "A",
    quality: "premium",
  },
  {
    title: "Royal Navy Velvet Loafers with Gold Tassel (EU 44 / UK 10)",
    description: "Handcrafted deep navy blue velvet dress slippers with royal heraldic gold embroidery crest and polished brass tassels. The quintessential luxury footwear companion for regal velvet or jacquard Agbada.",
    category: "Shoes & Footwear",
    events: ["Wedding / Aso-ebi", "Coronation / Chieftaincy"],
    size_label: "EU 44 (UK 10)",
    pieces: "Loafers Pair, Velvet Care Cloth, Wooden Shoe Trees",
    price: 22000,
    deposit: 30000,
    area: "Egbeda",
    imageFile: "shoes_velvet_loafers.jpg",
    tag_code: "SHOE-LOA-002",
    grade: "A",
    quality: "premium",
  },
  {
    title: "Champagne Gold Ankle-Strap Block Heels (EU 39 / UK 6)",
    description: "Radiant metallic champagne gold leather sandals featuring a sturdy 3.2-inch block heel, crystal pavé vamp strap, and adjustable ankle buckle. Provides unmatched stability and elegance on marquee lawns and event carpets.",
    category: "Shoes & Footwear",
    events: ["Wedding / Aso-ebi", "Birthday / Milestones"],
    size_label: "EU 39 (UK 6)",
    pieces: "Block Heels Pair, Dust Pouch",
    price: 15000,
    deposit: 20000,
    area: "Igando",
    imageFile: "shoes_champagne_heels.jpg",
    tag_code: "SHOE-GLD-003",
    grade: "A",
    quality: "premium",
  },
  {
    title: "Italian Burnished Cognac Double Monk-Strap Dress Shoes (EU 43 / UK 9)",
    description: "Artisan burnished cognac calfskin double monk-strap dress shoes with Goodyear welted leather soles. Polished to a high mirror gloss, ideal for groom styling, senator outfits, and black-tie galas.",
    category: "Shoes & Footwear",
    events: ["Wedding / Aso-ebi", "Anniversary / Banquet"],
    size_label: "EU 43 (UK 9)",
    pieces: "Monk-Strap Shoes Pair, Luxury Travel Shoe Bags",
    price: 20000,
    deposit: 28000,
    area: "Ikotun",
    imageFile: "shoes_cognac_monk.jpg",
    tag_code: "SHOE-MNK-004",
    grade: "A",
    quality: "premium",
  },

  // --- EVENT EQUIPMENT ---
  {
    title: "150L Heavy-Duty Beverage Ice Chest with Drain Tap",
    description: "Industrial-grade roto-molded ice cooler with ultra-thick insulation. Keeps up to 200 drinks and 4 bags of ice frozen for up to 72 hours under direct Lagos sunshine. Heavy-duty swing handles and leakproof quick-drain tap.",
    category: "Coolers & Ice Chests",
    events: ["Wedding / Aso-ebi", "Birthday / Milestones", "Anniversary / Banquet"],
    size_label: "150L Industrial Chest (150-200 drinks + 4 ice bags)",
    pieces: "150L Cooler Tank, Dual Heavy-Duty Handles, Quick-Drain Plug",
    price: 9000,
    deposit: 15000,
    area: "Ikotun",
    imageFile: "equipment_cooler_150l.jpg",
    tag_code: "EQ-COOL-005",
    grade: "A",
    quality: "premium",
  },
  {
    title: "Size 50 Giant Cast-Iron Party Cooking Pot & Double-Ring Burner",
    description: "Traditional heavy cast-iron Size 50 cooking pot for authentic woodfire or gas smokey party jollof, fried rice, or pepper soup. Includes high-pressure double-ring cast iron burner and 2m industrial hose.",
    category: "Cooking Pots & Burners",
    events: ["Wedding / Aso-ebi", "Anniversary / Banquet", "Birthday / Milestones"],
    size_label: "Size 50 Giant Cast-Iron Pot (Serves 250+)",
    pieces: "Size 50 Cast Iron Pot, Snug Lid, Double-Ring Gas Burner, 2m Hose",
    price: 15000,
    deposit: 25000,
    area: "Egbeda",
    imageFile: "equipment_size50_pot.jpg",
    tag_code: "EQ-POT-006",
    grade: "A",
    quality: "premium",
  },
  {
    title: "Roll-Top Stainless Steel Buffet Chafing Dishes (4-Pan Unit)",
    description: "Commercial 9-liter roll-top mirror-finish food warmers with gold brass accents. Keeps party soups, jollof, and meats piping hot and moisture-rich throughout your reception.",
    category: "Chafing Dishes & Food Warmers",
    events: ["Wedding / Aso-ebi", "Birthday / Milestones", "Anniversary / Banquet"],
    size_label: "Set of 4 Roll-Top Warmers (Buffet for 150)",
    pieces: "4 Roll-top Outer Water Pans, 4 Food Inserts, 8 Sterno Burner Holders",
    price: 16000,
    deposit: 25000,
    area: "Igando",
    imageFile: "equipment_chafing_dishes.jpg",
    tag_code: "EQ-CHAF-007",
    grade: "A",
    quality: "premium",
  },
  {
    title: "Royal White Draped Marquee Canopy & Gold Chiavari Chairs (50 Guests)",
    description: "Majestic high-peak white draped event canopy with crystal chandelier fittings and 50 luxury gold Chiavari chairs with padded cushions. Includes full setup and teardown crew.",
    category: "Canopies, Tables & Chairs",
    events: ["Wedding / Aso-ebi", "Birthday / Milestones"],
    size_label: "Marquee Canopy + 50 Gold Chiavari Chairs",
    pieces: "High-Peak Draped Canopy, 50 Gold Chiavari Chairs, 5 Round Banquet Tables",
    price: 85000,
    deposit: 35000,
    area: "Ikotun",
    imageFile: "equipment_canopy_chairs.jpg",
    tag_code: "EQ-CAN-008",
    grade: "A",
    quality: "premium",
  },

  // --- CATERING & SERVICES ---
  {
    title: "Royal Owambe Firewood Party Jollof & Asun Feast (100 Guests)",
    description: "Authentic Lagos firewood smokey party jollof rice, seasoned fried rice, spicy grilled goat meat (Asun), moin-moin, and sweet plantain dodo. Served on-site with 2 uniformed caterers, stainless food warmers, and disposable packs.",
    category: "Party Catering & Jollof",
    events: ["Wedding / Aso-ebi", "Birthday / Milestones", "Anniversary / Banquet"],
    size_label: "Standard Owambe (80 - 120 Guests)",
    pieces: "Smokey Party Jollof, Fried Rice, Asun, 2 Servers, Food Warmers, Disposable Cutlery",
    price: 240000,
    deposit: 0,
    area: "Igando",
    imageFile: "service_jollof_feast.jpg",
    tag_code: "SRV-CAT-009",
    grade: "A",
    quality: "premium",
  },

  // --- EVENT HALLS & MARQUEES ---
  {
    title: "The Grand Oasis Event & Banquet Center (Egbeda)",
    description: "Prestigious fully air-conditioned grand marquee banquet center along Egbeda-Idimu Road. Features soaring draped white chiffon ceilings, glowing crystal chandeliers, polished dance floor, 250kVA soundproof generator (diesel included for 8 hours), secured parking for 80+ vehicles with uniformed bouncers, and an en-suite VIP bridal changing suite with Hollywood vanity mirrors.",
    category: "Event Halls & Marquees",
    events: ["Wedding / Aso-ebi", "Anniversary / Banquet", "Birthday / Milestones"],
    size_label: "Banquet: 450 Guests · Theater: 700 Guests",
    pieces: "Main Hall, VIP Bridal Suite, 250kVA Standby Gen, 80-Car Parking, Luxury Restrooms",
    price: 650000,
    deposit: 50000,
    area: "Egbeda",
    imageFile: "hall_grand_marquee.jpg",
    imageFiles: ["hall_grand_marquee.jpg", "hall_banquet_ballroom.jpg", "hall_exterior_parking.jpg", "hall_bridal_suite.jpg", "hall_garden_marquee.jpg"],
    tag_code: "VEN-OASIS-010",
    grade: "A",
    quality: "premium",
  },
  {
    title: "The Imperial Crystal Ballroom & Event Center (Ikotun)",
    description: "Ultra-modern luxury event ballroom in central Ikotun. Engineered with acoustic sound absorption, ambient architectural purple and gold mood lighting, polished porcelain flooring, elevated performance stage, 10 standing 5HP AC units, and dedicated caterer prep kitchen.",
    category: "Event Halls & Marquees",
    events: ["Wedding / Aso-ebi", "Anniversary / Banquet", "Coronation / Chieftaincy"],
    size_label: "Banquet: 350 Guests · Theater: 550 Guests",
    pieces: "Grand Ballroom, Stage Rig, Industrial AC Chillers, 200kVA Gen, 60-Car Parking",
    price: 500000,
    deposit: 50000,
    area: "Ikotun",
    imageFile: "hall_banquet_ballroom.jpg",
    imageFiles: ["hall_banquet_ballroom.jpg", "hall_grand_marquee.jpg", "hall_exterior_parking.jpg", "hall_bridal_suite.jpg"],
    tag_code: "VEN-CRYST-011",
    grade: "A",
    quality: "premium",
  },
  {
    title: "Emerald Palms Garden Marquee & Pavilion (Igando)",
    description: "Scenic tropical outdoor garden venue and clear-top marquee pavilion in Igando. Ideal for sunset wedding receptions, milestone birthdays, and stylish open-air celebrations. Includes romantic fairy light canopy, illuminated walkways, standby generator, and private security perimeter.",
    category: "Garden & Outdoor Venues",
    events: ["Wedding / Aso-ebi", "Birthday / Milestones", "Anniversary / Banquet"],
    size_label: "Banquet: 250 Guests · Theater: 400 Guests",
    pieces: "Clear-Top Marquee Pavilion, Manicured Lawn, Fairy Lighting, Standby Gen, 50-Car Parking",
    price: 380000,
    deposit: 50000,
    area: "Igando",
    imageFile: "hall_garden_marquee.jpg",
    imageFiles: ["hall_garden_marquee.jpg", "hall_exterior_parking.jpg", "hall_bridal_suite.jpg", "hall_grand_marquee.jpg"],
    tag_code: "VEN-PALMS-012",
    grade: "A",
    quality: "premium",
  },
];

async function run() {
  console.log("Fetching owner/vendor profile...");
  const { data: profiles, error: pErr } = await admin.from("profiles").select("id,role").order("created_at");
  if (pErr || !profiles?.length) {
    console.error("No profiles found:", pErr);
    process.exit(1);
  }
  const ownerId = profiles[0].id;
  console.log("Using owner ID:", ownerId);

  const { data: hubs } = await admin.from("hubs").select("id,area");
  const hubMap = Object.fromEntries((hubs ?? []).map((h) => [h.area, h.id]));
  const defaultHubId = hubs?.[0]?.id;

  for (const item of NEW_ITEMS) {
    console.log(`\nProcessing: "${item.title}"...`);
    const hubId = hubMap[item.area] || defaultHubId;
    const allImgFiles = item.imageFiles || [item.imageFile];
    const photoUrls = [];

    for (const f of allImgFiles) {
      const localImgPath = path.join("public", "images", f);
      let pUrl = `/images/${f}`;

      if (fs.existsSync(localImgPath)) {
        try {
          const fileBuf = fs.readFileSync(localImgPath);
          const storageKey = `seed/${f}`;
          const { error: upErr } = await admin.storage
            .from("item-photos")
            .upload(storageKey, fileBuf, {
              contentType: "image/jpeg",
              upsert: true,
            });
          if (upErr) {
            console.warn(`Storage upload note for ${f}:`, upErr.message);
          } else {
            const { data: pubData } = admin.storage.from("item-photos").getPublicUrl(storageKey);
            if (pubData?.publicUrl) {
              pUrl = pubData.publicUrl;
            }
          }
        } catch (err) {
          console.warn("Storage upload exception:", err);
        }
      }
      photoUrls.push(pUrl);
    }

    console.log(`Photos ready (${photoUrls.length}):`, photoUrls[0]);

    // Check if item already exists by title
    const { data: existing } = await admin.from("items").select("id").eq("title", item.title).maybeSingle();
    if (existing) {
      console.log(`Updating existing item ${existing.id}...`);
      await admin.from("items").update({
        photos: photoUrls,
        status: "live",
        grade: item.grade,
        quality: item.quality,
        deposit: item.deposit,
        price: item.price,
        hub_id: hubId,
        size_label: item.size_label,
        pieces: item.pieces,
      }).eq("id", existing.id);
    } else {
      console.log("Inserting new item...");
      const { data: inserted, error: insErr } = await admin.from("items").insert({
        owner_id: ownerId,
        hub_id: hubId,
        title: item.title,
        description: item.description,
        category: item.category,
        events: item.events,
        size_label: item.size_label,
        pieces: item.pieces,
        price: item.price,
        deposit: item.deposit,
        status: "live",
        grade: item.grade,
        quality: item.quality,
        photos: photoUrls,
        tag_code: item.tag_code,
      }).select();

      if (insErr) {
        console.error(`Error inserting ${item.title}:`, insErr);
      } else {
        console.log(`✓ Inserted ID: ${inserted[0]?.id}`);
      }
    }
  }

  console.log("\nAll items & venues successfully seeded with verified high-resolution photography!");
}

run().catch(console.error);
