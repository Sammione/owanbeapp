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
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || envFile.NEXT_PUBLIC_SUPABASE_URL || "https://ymzqmxipiiorfgfdmlvk.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envFile.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envFile.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SERVICE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY. Please provide it in process.env or .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const OWNER_EMAIL = "sammione531@gmail.com";

async function main() {
  console.log("1. Finding or creating owner profile...");
  const { data: users, error: userErr } = await admin.auth.admin.listUsers();
  if (userErr) throw userErr;
  let owner = users.users.find((u) => u.email === OWNER_EMAIL);
  if (!owner) {
    throw new Error(`Owner ${OWNER_EMAIL} not found`);
  }
  const ownerId = owner.id;
  console.log(`Owner found: ${owner.email} (${ownerId})`);

  // Ensure role is admin
  await admin.from("profiles").upsert({
    id: ownerId,
    full_name: "Samson O.",
    phone: "08012345678",
    area: "Ikotun",
    role: "admin",
  });

  // Get hubs
  const { data: hubs, error: hubsErr } = await admin.from("hubs").select("*");
  if (hubsErr) throw hubsErr;
  const hubMap = Object.fromEntries(hubs.map((h) => [h.area, h.id]));
  console.log("Hubs mapped:", hubMap);

  // Sign in as admin to obtain staff JWT
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: OWNER_EMAIL,
  });
  if (linkErr) throw linkErr;

  const staffClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: verifyData, error: verifyErr } = await staffClient.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });
  if (verifyErr) throw verifyErr;
  console.log("Authenticated as staff:", verifyData.user?.email);

  // Images to upload
  const brainDir = "/Users/helpmumafrica/.gemini/antigravity-ide/brain/5b10382f-61f0-4aff-a38b-c2c5964695b7";
  const itemsData = [
    {
      title: "Royal Emerald Green George & Blouse Set",
      description: "Exquisite gold-embroidered emerald green lace with rich hand-beaded details. Perfect for wedding guests or mothers of the day.",
      category: "Aso-ebi / lace",
      events: ["Wedding / Aso-ebi", "Anniversary / Banquet"],
      size_label: "M (UK 12)",
      bust: 38,
      waist: 32,
      hip: 42,
      length: 60,
      pieces: "Blouse, Wrapper, Gele",
      price: 18000,
      deposit: 23400,
      area: "Ikotun",
      imageFile: "emerald_green_george_1792102959768.jpg",
      tag_code: "IKO-0001",
      grade: "A",
      quality: "premium",
    },
    {
      title: "Midnight Navy 3-Piece Velvet Agbada",
      description: "Regal 3-piece dark navy velvet Agbada with intricate geometric metallic embroidery. Includes matching cap (fila) and trousers.",
      category: "Agbada",
      events: ["Wedding / Aso-ebi", "Coronation / Chieftaincy"],
      size_label: "L (Chest 44)",
      bust: 44,
      waist: 36,
      hip: 44,
      length: 58,
      sleeve: 34,
      pieces: "Agbada, Awosoke (inner top), Sokoto (trousers), Fila",
      price: 25000,
      deposit: 32500,
      area: "Egbeda",
      imageFile: "navy_agbada_1792102978844.jpg",
      tag_code: "EGB-0002",
      grade: "A",
      quality: "premium",
    },
    {
      title: "Champagne Gold Pleated Auto-Gele & Bridal Fan",
      description: "Pre-tied luxury pleated champagne gold Auto-Gele that fits instantly without pinning. Paired with a white and gold ostrich feather hand fan.",
      category: "Gele",
      events: ["Wedding / Aso-ebi", "Birthday / Milestones"],
      size_label: "Free Size (Adjustable)",
      pieces: "Pleated Auto-Gele, Feather Fan",
      price: 10000,
      deposit: 13000,
      area: "Igando",
      imageFile: "gold_gele_fan_1792102998945.jpg",
      tag_code: "IGA-0003",
      grade: "A",
      quality: "premium",
    },
    {
      title: "Benin Royal Coral Bead Collar & Earring Set",
      description: "Heavy traditional Edo/Benin coral bead tiered collar necklace, matching cuff bracelet, and drop earrings. Pristine condition.",
      category: "Beads & jewelry",
      events: ["Traditional Engagement", "Coronation / Chieftaincy"],
      size_label: "One Size",
      pieces: "Tiered Coral Collar, Earring Pair, Coral Cuff",
      price: 15000,
      deposit: 20000,
      area: "Ikotun",
      imageFile: "coral_beads_set_1792138186961.jpg",
      tag_code: "IKO-0004",
      grade: "A",
      quality: "premium",
    },
    {
      title: "Corset Ball Gown in Orange & Teal Ankara",
      description: "Showstopping structured boned corset gown in rich African wax print with tiered full skirt. Designed for red-carpet Owambe entries.",
      category: "Ankara",
      events: ["Birthday / Milestones", "Anniversary / Banquet"],
      size_label: "S (UK 10)",
      bust: 35,
      waist: 28,
      hip: 39,
      length: 62,
      pieces: "Corset Gown",
      price: 16000,
      deposit: 20800,
      area: "Egbeda",
      imageFile: "ankara_corset_gown_1792138208912.jpg",
      tag_code: "EGB-0005",
      grade: "A",
      quality: "premium",
    },
  ];

  for (const item of itemsData) {
    console.log(`Processing: ${item.title}...`);
    const hubId = hubMap[item.area];
    if (!hubId) {
      console.warn(`No hub for area ${item.area}`);
      continue;
    }

    // Upload photo to storage
    const localPath = path.join(brainDir, item.imageFile);
    let photoUrl = "";
    if (fs.existsSync(localPath)) {
      const fileBuffer = fs.readFileSync(localPath);
      const storageKey = `seed/${path.basename(item.imageFile)}`;
      const { error: upErr } = await admin.storage
        .from("item-photos")
        .upload(storageKey, fileBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });
      if (upErr) {
        console.error("Upload error:", upErr);
      } else {
        const { data: pubUrl } = admin.storage
          .from("item-photos")
          .getPublicUrl(storageKey);
        photoUrl = pubUrl.publicUrl;
        console.log(`Uploaded photo: ${photoUrl}`);
      }
    }

    // Check if item exists by tag_code or title
    const { data: existing } = await admin
      .from("items")
      .select("id")
      .eq("title", item.title)
      .maybeSingle();

    let itemId = existing?.id;

    if (!itemId) {
      const { data: inserted, error: insErr } = await admin
        .from("items")
        .insert({
          owner_id: ownerId,
          hub_id: hubId,
          title: item.title,
          description: item.description,
          category: item.category,
          events: item.events,
          size_label: item.size_label,
          bust: item.bust || null,
          waist: item.waist || null,
          hip: item.hip || null,
          length: item.length || null,
          sleeve: item.sleeve || null,
          pieces: item.pieces,
          price: item.price,
          photos: photoUrl ? [photoUrl] : [],
        })
        .select("id")
        .single();

      if (insErr) {
        console.error("Insert error:", insErr);
        continue;
      }
      itemId = inserted.id;
    }

    // Update to live using staff client
    const { error: updateErr } = await staffClient
      .from("items")
      .update({
        hub_id: hubId,
        status: "live",
        grade: item.grade,
        quality: item.quality,
        deposit: item.deposit,
        tag_code: item.tag_code,
        cleaned_at: new Date().toISOString().slice(0, 10),
        photos: photoUrl ? [photoUrl] : [],
      })
      .eq("id", itemId);

    if (updateErr) {
      console.error(`Update error for ${item.title}:`, updateErr);
    } else {
      console.log(`Successfully made live: ${item.title} (ID: ${itemId})`);
    }
  }

  console.log("Seeding complete!");
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
