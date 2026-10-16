"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { requireStaff } from "@/lib/auth";
import { CHECKLIST } from "@/lib/constants";
import { lateFeePerDay, ownerEarning } from "@/lib/pricing";
import { refundTransaction } from "@/lib/paystack";
import { todayISO } from "@/lib/format";

function checklistFrom(fd: FormData) {
  return Object.fromEntries(CHECKLIST.map((c) => [c.key, fd.get(`c_${c.key}`) === "on"]));
}

async function uploadConditionPhotos(supabase: Awaited<ReturnType<typeof requireStaff>>["supabase"], itemId: string, fd: FormData) {
  const files = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 8);
  const paths: string[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) continue;
    const ext = file.type === "image/png" ? "png" : "jpg";
    const path = `${itemId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("condition-photos").upload(path, file, { contentType: file.type });
    if (!error) paths.push(path);
  }
  return paths;
}

export async function approveItem(fd: FormData) {
  const { supabase, user } = await requireStaff();
  const id = String(fd.get("id"));
  const grade = String(fd.get("grade"));
  const quality = String(fd.get("quality"));
  const deposit = Math.max(0, parseInt(String(fd.get("deposit")).replace(/\D/g, "")) || 0);
  const tag = String(fd.get("tag_code") ?? "").trim().toUpperCase() || null;
  const notes = String(fd.get("notes") ?? "").slice(0, 1000);
  if (!["A", "B", "C"].includes(grade) || !["premium", "standard"].includes(quality)) {
    redirect(`/hub/items/${id}?error=Choose+a+grade+and+fabric+quality`);
  }
  const checklist = checklistFrom(fd);
  const photos = await uploadConditionPhotos(supabase, id, fd);
  await supabase.from("condition_reports").insert({ item_id: id, kind: "intake", grade, checklist, notes, photos, created_by: user.id });
  const { error } = await supabase
    .from("items")
    .update({ status: "live", grade, quality, deposit, tag_code: tag, cleaned_at: todayISO(), rejection_reason: null })
    .eq("id", id);
  if (error) redirect(`/hub/items/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/hub");
  redirect("/hub?done=Listing+is+live");
}

export async function rejectItem(fd: FormData) {
  const { supabase, user } = await requireStaff();
  const id = String(fd.get("id"));
  const reason = String(fd.get("reason") ?? "").trim().slice(0, 300) || "Didn’t pass our quality check.";
  await supabase.from("condition_reports").insert({ item_id: id, kind: "intake", checklist: checklistFrom(fd), notes: reason, created_by: user.id });
  await supabase.from("items").update({ status: "rejected", rejection_reason: reason }).eq("id", id);
  revalidatePath("/hub");
  redirect("/hub?done=Listing+rejected.+Return+the+outfit+to+the+owner");
}

export async function checkOut(fd: FormData) {
  const { supabase, user } = await requireStaff();
  const id = String(fd.get("id"));
  const code = String(fd.get("code") ?? "").trim();
  const { data: b } = await supabase.from("bookings").select("id,item_id,status,pickup_code,delivery").eq("id", id).single();
  if (!b || b.status !== "paid") redirect(`/hub/bookings/${id}?error=This+booking+is+not+ready+for+check-out`);
  if (!b.delivery && code !== b.pickup_code) redirect(`/hub/bookings/${id}?error=Pickup+code+does+not+match`);
  const photos = await uploadConditionPhotos(supabase, b.item_id, fd);
  await supabase.from("condition_reports").insert({
    item_id: b.item_id, booking_id: id, kind: "checkout", checklist: checklistFrom(fd),
    notes: String(fd.get("notes") ?? "").slice(0, 1000), photos, created_by: user.id,
  });
  await supabase.from("bookings").update({ status: "out" }).eq("id", id);
  revalidatePath("/hub");
  redirect("/hub?done=Checked+out");
}

export async function checkIn(fd: FormData) {
  const { supabase, user } = await requireStaff();
  const id = String(fd.get("id"));
  const { data: b } = await supabase.from("bookings").select("*").eq("id", id).single();
  if (!b || b.status !== "out") redirect(`/hub/bookings/${id}?error=This+booking+is+not+out`);

  const grade = String(fd.get("grade") ?? "");
  const damage = Math.max(0, parseInt(String(fd.get("damage")).replace(/\D/g, "")) || 0);
  const today = todayISO();
  const lateDays = Math.max(0, Math.round((Date.parse(today) - Date.parse(b.end_date)) / 86400000));
  const lateFee = lateDays * lateFeePerDay(b.rental_fee);
  const refund = Math.max(0, b.deposit - lateFee - damage);
  // Owner gets 70% of the rental, all damage compensation and half the late fee.
  const payout = ownerEarning(b.rental_fee) + Math.min(damage, b.deposit) + Math.round(Math.min(lateFee, Math.max(0, b.deposit - damage)) / 2);

  const photos = await uploadConditionPhotos(supabase, b.item_id, fd);
  await supabase.from("condition_reports").insert({
    item_id: b.item_id, booking_id: id, kind: "return", grade: ["A", "B", "C"].includes(grade) ? grade : null,
    checklist: checklistFrom(fd), notes: String(fd.get("notes") ?? "").slice(0, 1000), photos, created_by: user.id,
  });

  let refundNote = "";
  if (refund > 0) {
    const r = await refundTransaction(b.paystack_ref, refund);
    refundNote = r.ok ? "Deposit refund sent" : `Refund failed (${r.message}). Refund manually in Paystack`;
  }
  await supabase
    .from("bookings")
    .update({ status: "completed", late_fee: lateFee, damage_charge: damage, deposit_refund: refund, owner_payout: payout })
    .eq("id", id);
  if (["A", "B", "C"].includes(grade)) await supabase.from("items").update({ grade, cleaned_at: today }).eq("id", b.item_id);
  else await supabase.from("items").update({ cleaned_at: today }).eq("id", b.item_id);

  revalidatePath("/hub");
  redirect(`/hub?done=${encodeURIComponent(`Returned. ${refundNote || "No deposit to refund"}.`)}`);
}

export async function refundConflict(fd: FormData) {
  const { supabase } = await requireStaff();
  const id = String(fd.get("id"));
  const { data: b } = await supabase.from("bookings").select("id,status,paystack_ref").eq("id", id).single();
  if (!b || b.status !== "conflict") redirect("/hub");
  const r = await refundTransaction(b.paystack_ref);
  if (r.ok) await supabase.from("bookings").update({ status: "cancelled", deposit_refund: 0 }).eq("id", id);
  revalidatePath("/hub");
  redirect(`/hub?done=${encodeURIComponent(r.ok ? "Full refund sent" : `Refund failed: ${r.message}`)}`);
}
