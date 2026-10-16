import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/paystack";
import type { Booking } from "@/lib/types";

/**
 * Confirms a booking after Paystack says it was paid. Safe to call many
 * times (from the webhook and from the return page).
 */
export async function confirmBooking(reference: string): Promise<Booking | null> {
  const admin = createAdminClient();
  const { data: booking } = await admin.from("bookings").select("*").eq("paystack_ref", reference).maybeSingle<Booking>();
  if (!booking) return null;
  if (booking.status !== "pending_payment") return booking;

  const tx = await verifyTransaction(reference);
  if (!tx || tx.status !== "success" || tx.currency !== "NGN" || tx.amount !== booking.total * 100) {
    return booking;
  }

  const { data: updated, error } = await admin
    .from("bookings")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", booking.id)
    .eq("status", "pending_payment")
    .select("*")
    .maybeSingle<Booking>();

  if (error) {
    // 23P01 = the item was booked by someone else for overlapping dates.
    // Mark it so the team can refund this payment in full.
    if (error.code === "23P01") {
      const { data: c } = await admin
        .from("bookings")
        .update({ status: "conflict", paid_at: new Date().toISOString() })
        .eq("id", booking.id)
        .select("*")
        .maybeSingle<Booking>();
      return c;
    }
    console.error("confirmBooking", error);
    return booking;
  }
  return updated ?? booking;
}
