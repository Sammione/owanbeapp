"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function registerVendor(_: unknown, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in first." };

  const business_name = String(formData.get("business_name") ?? "").trim().slice(0, 100);
  const vendor_type = String(formData.get("vendor_type") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").replace(/[^\d+]/g, "").slice(0, 16);
  const area = String(formData.get("area") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim().slice(0, 400);

  if (business_name.length < 3) {
    return { ok: false, message: "Please enter your business or brand name." };
  }
  if (!phone || phone.replace(/\D/g, "").length < 10) {
    return { ok: false, message: "Please provide a valid WhatsApp phone number." };
  }

  // Update profile
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: business_name,
      phone: phone || null,
      area: area || null,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message || "Failed to update vendor profile." };
  }

  // Save vendor metadata on user
  await supabase.auth.updateUser({
    data: {
      is_vendor: true,
      business_name,
      vendor_type,
      vendor_description: description,
    },
  });

  revalidatePath("/me");
  return { ok: true, message: "Vendor onboarding complete!" };
}
