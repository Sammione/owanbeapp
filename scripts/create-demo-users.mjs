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
} catch (e) {
  console.error("Could not read .env.local", e);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || envFile.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envFile.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE credentials");
  process.exit(1);
}

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class DummyWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  };
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const DEMO_ACCOUNTS = [
  {
    email: "admin@owanbefit.com",
    password: "OwambeAdmin2026!",
    profile: {
      full_name: "OwanbeFit Admin / Staff",
      phone: "08012345678",
      area: "Ikotun",
      role: "admin",
      is_vendor: false,
    },
  },
  {
    email: "borrower@owanbefit.com",
    password: "OwambeBorrower2026!",
    profile: {
      full_name: "Chioma Adebayo (Borrower)",
      phone: "08023456789",
      area: "Egbeda",
      role: "user",
      is_vendor: false,
    },
  },
  {
    email: "vendor@owanbefit.com",
    password: "OwambeVendor2026!",
    profile: {
      full_name: "Kudirat Balogun (Vendor)",
      phone: "08034567890",
      area: "Igando",
      role: "user",
      is_vendor: true,
      business_name: "Kudirat Event Essentials & Catering",
      vendor_type: "both",
      verified_vendor: true,
    },
  },
  {
    email: "hallowner@owanbefit.com",
    password: "OwambeHall2026!",
    profile: {
      full_name: "Babatunde Adeleke (Venue Manager)",
      phone: "08056789012",
      area: "Egbeda",
      role: "user",
      is_vendor: true,
      business_name: "The Grand Oasis Event & Banquet Center",
      vendor_type: "hall_manager",
      verified_vendor: true,
    },
  },
  {
    email: "sammione531@gmail.com",
    password: "OwambeAdmin2026!",
    profile: {
      full_name: "Samson O. (Lead Admin)",
      phone: "08012345678",
      area: "Ikotun",
      role: "admin",
      is_vendor: false,
    },
  },
];

async function run() {
  console.log("Fetching existing users...");
  const { data: userList, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) {
    console.error("Error listing users:", listErr);
    process.exit(1);
  }

  const existingMap = new Map();
  for (const u of userList.users) {
    if (u.email) existingMap.set(u.email.toLowerCase(), u);
  }

  for (const acc of DEMO_ACCOUNTS) {
    const key = acc.email.toLowerCase();
    let userId;

    if (existingMap.has(key)) {
      const existing = existingMap.get(key);
      userId = existing.id;
      console.log(`Updating password and confirmed status for existing user: ${acc.email} (${userId})`);
      const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.profile.full_name },
      });
      if (updErr) console.error(`Error updating user ${acc.email}:`, updErr);
    } else {
      console.log(`Creating new demo user: ${acc.email}`);
      const { data: created, error: crtErr } = await admin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.profile.full_name },
      });
      if (crtErr) {
        console.error(`Error creating user ${acc.email}:`, crtErr);
        continue;
      }
      userId = created.user.id;
      console.log(`Created user ${acc.email} with ID ${userId}`);
    }

    // Now upsert the profile
    console.log(`Upserting profile for ${acc.email} (role: ${acc.profile.role})...`);
    const { error: profErr } = await admin.from("profiles").upsert({
      id: userId,
      ...acc.profile,
    });
    if (profErr) {
      console.error(`Error upserting profile for ${acc.email}:`, profErr);
    } else {
      console.log(`✓ Profile synced for ${acc.email}`);
    }
  }

  console.log("\n=================================");
  console.log("DEMO ACCOUNTS READY:");
  for (const acc of DEMO_ACCOUNTS) {
    console.log(`- Email: ${acc.email}`);
    console.log(`  Password: ${acc.password}`);
    console.log(`  Role: ${acc.profile.role}`);
    console.log(`  Name: ${acc.profile.full_name}\n`);
  }
}

run().catch(console.error);
