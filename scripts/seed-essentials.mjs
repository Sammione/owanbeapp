import fs from "fs";
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
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || envFile.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envFile.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY || !SUPABASE_URL) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
  realtime: { createSocket: () => null },
});

async function main() {
  console.log("Seeding Event Equipment and Catering Packages...");
  
  // 1. Get an existing owner or admin profile
  const { data: profiles, error: profErr } = await admin.from("profiles").select("id").limit(1);
  if (profErr || !profiles?.length) {
    console.error("No profiles found to assign owner_id to.");
    return;
  }
  const ownerId = profiles[0].id;

  // 2. Get active hubs
  const { data: hubs } = await admin.from("hubs").select("id,area");
  const hubMap = Object.fromEntries((hubs ?? []).map((h) => [h.area, h.id]));
  const defaultHubId = hubs?.[0]?.id ?? null;

  const sampleItems = [
    {
      title: "150L Heavy-Duty Beverage Ice Chest with Drain Tap",
      description: "Industrial-grade roto-molded ice cooler with ultra-thick insulation. Keeps up to 200 drinks and 4 bags of ice frozen for up to 72 hours under direct Lagos sunshine. Heavy-duty swing handles and leakproof drain tap.",
      category: "Coolers & Ice Chests",
      events: ["Wedding", "Birthday", "Party"],
      size_label: "150L Industrial Chest (150-200 drinks + 4 ice bags)",
      pieces: "150L Cooler Tank, Dual Heavy-Duty Handles, Quick-Drain Plug",
      price: 9000,
      deposit: 15000,
      hub_id: hubMap["Ikotun"] || defaultHubId,
      photos: [
        "https://images.unsplash.com/photo-1584282479904-e3adcf2b9264?w=1000&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1000&auto=format&fit=crop&q=80"
      ],
      tag_code: "EQ-COOL-001",
      grade: "A",
      quality: "premium",
      status: "live",
    },
    {
      title: "Size 50 Cast-Iron Party Cooking Pot & Industrial Gas Burner",
      description: "Traditional heavy cast-iron Size 50 cooking pot for authentic woodfire or gas smokey party jollof, fried rice, or pepper soup. Includes high-pressure double-ring cast burner and gas regulator.",
      category: "Cooking Pots & Burners",
      events: ["Wedding", "Burial", "Birthday", "Party"],
      size_label: "Size 50 Giant Cast-Iron Pot (Serves 250+)",
      pieces: "Size 50 Cast Iron Pot, Snug Lid, Double-Ring Gas Burner, 2m Hose",
      price: 15000,
      deposit: 25000,
      hub_id: hubMap["Egbeda"] || defaultHubId,
      photos: [
        "https://images.unsplash.com/photo-1584990347449-39908cf69074?w=1000&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1000&auto=format&fit=crop&q=80"
      ],
      tag_code: "EQ-POT-002",
      grade: "A",
      quality: "premium",
      status: "live",
    },
    {
      title: "Royal Owambe Party Jollof & Asun Buffet Package (100 Guests)",
      description: "Authentic Lagos firewood smokey party jollof rice, seasoned fried rice, spicy grilled goat meat (Asun), moin-moin, and sweet plantain dodo. Served on-site with 2 uniformed caterers, stainless food warmers, and disposable packs.",
      category: "Party Catering & Jollof",
      events: ["Wedding", "Birthday", "Naming", "Party"],
      size_label: "Standard Owambe (80 - 120 Guests)",
      pieces: "Smokey Party Jollof, Fried Rice, Asun, 2 Servers, Food Warmers, Disposable Cutlery",
      price: 240000,
      deposit: 0,
      hub_id: hubMap["Igando"] || defaultHubId,
      photos: [
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1000&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&auto=format&fit=crop&q=80"
      ],
      tag_code: "SRV-CAT-003",
      grade: "A",
      quality: "premium",
      status: "live",
    },
    {
      title: "Set of 4 Roll-Top Stainless Steel Chafing Dish Warmers",
      description: "Luxury 9-litre roll-top stainless steel buffet warmers with glass viewing windows. Keeps party rice, meats, and soups piping hot for 6+ hours with dual fuel holders.",
      category: "Chafing Dishes & Food Warmers",
      events: ["Wedding", "Burial", "Birthday", "Party"],
      size_label: "Set of 4 Chafing Dishes (Complete Buffet)",
      pieces: "4 Roll-Top Frames, 4 Water Pans, 4 Food Pans, 8 Chafing Fuel Cans",
      price: 20000,
      deposit: 30000,
      hub_id: hubMap["Ikotun"] || defaultHubId,
      photos: [
        "https://images.unsplash.com/photo-1544025162-d76694265947?w=1000&auto=format&fit=crop&q=80"
      ],
      tag_code: "EQ-CHAF-004",
      grade: "A",
      quality: "premium",
      status: "live",
    }
  ];

  for (const item of sampleItems) {
    const { data: existing } = await admin.from("items").select("id").eq("tag_code", item.tag_code).maybeSingle();
    if (existing) {
      console.log(`Skipping existing ${item.tag_code}: ${item.title}`);
      continue;
    }
    const { error: insErr } = await admin.from("items").insert({
      ...item,
      owner_id: ownerId,
    });
    if (insErr) {
      console.warn(`Could not seed ${item.title}:`, insErr.message);
    } else {
      console.log(`✓ Seeded ${item.title}`);
    }
  }

  console.log("Done seeding essentials.");
}

main().catch(console.error);
