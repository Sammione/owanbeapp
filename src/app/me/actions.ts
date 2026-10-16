"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { AREAS } from "@/lib/constants";

export async function setListingStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["live", "paused", "retired"].includes(status)) return;
  const supabase = await createClient();
  await supabase.from("items").update({ status }).eq("id", id);
  revalidatePath("/me");
}

export async function saveProfile(_: unknown, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in again." };
  const full_name = String(formData.get("full_name") ?? "").trim().slice(0, 80);
  const phone = String(formData.get("phone") ?? "").replace(/[^\d+]/g, "").slice(0, 16);
  const areaRaw = String(formData.get("area") ?? "");
  const area = (AREAS as readonly string[]).includes(areaRaw) ? areaRaw : null;
  if (full_name.length < 2) return { ok: false, message: "Add your name." };
  if (phone && phone.replace(/\D/g, "").length < 10) return { ok: false, message: "Check your phone number." };
  const { error } = await supabase.from("profiles").update({ full_name, phone: phone || null, area }).eq("id", user.id);
  if (error) return { ok: false, message: "Couldn’t save. Please try again." };
  revalidatePath("/me");
  return { ok: true, message: "Saved." };
}

export async function saveBankDetails(_: unknown, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please sign in again." };

  const bank_name = String(formData.get("bank_name") ?? "").trim();
  const bank_code = String(formData.get("bank_code") ?? "").trim();
  const account_number = String(formData.get("account_number") ?? "").trim().replace(/\D/g, "");
  const account_name = String(formData.get("account_name") ?? "").trim();

  if (account_number.length !== 10) {
    return { ok: false, message: "Account number must be exactly 10 digits." };
  }
  if (!bank_code || !bank_name) {
    return { ok: false, message: "Please select your bank." };
  }
  if (!account_name) {
    return { ok: false, message: "Please verify your account details before saving." };
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      bank_name,
      bank_code,
      account_number,
      account_name,
      payout_verified: true,
      payout_updated_at: new Date().toISOString(),
    },
  });

  if (error) {
    return { ok: false, message: error.message || "Could not save bank details." };
  }

  revalidatePath("/me");
  return { ok: true, message: "Verified! Your 70% rental payouts will be sent to this account." };
}
