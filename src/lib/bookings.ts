import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/paystack";
import type { Booking } from "@/lib/types";

/**
 * Confirms a booking after Paystack says it was paid. Safe to call many
 * times (from the webhook and from the return page).
 */
export async function confirmAllBookings(reference: string): Promise<Booking[]> {
  const admin = createAdminClient();
  const { data: bookings } = await admin.from("bookings").select("*").eq("paystack_ref", reference);
  if (!bookings || bookings.length === 0) return [];

  const pending = bookings.filter((b) => b.status === "pending_payment");
  if (pending.length === 0) return bookings;

  const totalSum = bookings.reduce((sum, b) => sum + b.total, 0);
  const tx = await verifyTransaction(reference);

  if (!tx || tx.status !== "success" || tx.currency !== "NGN" || tx.amount !== totalSum * 100) {
    return bookings;
  }

  const updatedBookings: Booking[] = [];
  for (const b of pending) {
    const { data: updated, error } = await admin
      .from("bookings")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", b.id)
      .eq("status", "pending_payment")
      .select("*")
      .maybeSingle<Booking>();

    if (error) {
      if (error.code === "23P01") {
        const { data: c } = await admin
          .from("bookings")
          .update({ status: "conflict", paid_at: new Date().toISOString() })
          .eq("id", b.id)
          .select("*")
          .maybeSingle<Booking>();
        if (c) updatedBookings.push(c);
      } else {
        console.error("confirmAllBookings update error", error);
        updatedBookings.push(b);
      }
    } else if (updated) {
      updatedBookings.push(updated);
    }
  }

  return updatedBookings.length ? updatedBookings : bookings;
}

/**
 * Confirms a booking after Paystack says it was paid. Safe to call many
 * times (from the webhook and from the return page).
 */
export async function confirmBooking(reference: string): Promise<Booking | null> {
  const all = await confirmAllBookings(reference);
  return all.length ? all[0] : null;
}
