import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { confirmAllBookings } from "@/lib/bookings";
import { naira, niceDate } from "@/lib/format";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function Verify({ searchParams }: { searchParams: Promise<{ ref?: string; reference?: string }> }) {
  const sp = await searchParams;
  const ref = (sp.ref || sp.reference || "").slice(0, 80);
  const { user, supabase } = await requireUser(`/bookings/verify?ref=${encodeURIComponent(ref)}`);
  const bookings = ref ? await confirmAllBookings(ref) : [];

  if (!bookings.length || bookings[0].renter_id !== user.id) {
    return (
      <div className="container narrow">
        <h1>We couldn’t find that payment</h1>
        <p className="muted">If money left your account, it will show in My rentals within a few minutes. Otherwise, contact us with your Paystack receipt.</p>
        <Link href="/me?tab=rentals" className="btn">Go to My rentals</Link>
      </div>
    );
  }

  const primaryBooking = bookings[0];
  const itemIds = bookings.map((b) => b.item_id);
  const { data: items } = await supabase
    .from("items")
    .select("id,title,photos,hub:hubs(name,address)")
    .in("id", itemIds);

  const itemMap = new Map((items ?? []).map((it) => [it.id, it]));

  if (bookings.some((b) => b.status === "pending_payment")) {
    return (
      <div className="container narrow">
        <h1>Payment not completed</h1>
        <p className="muted">Paystack hasn’t confirmed this payment. If you closed the page, you can try again.</p>
        <Link href="/me?tab=rentals" className="btn">Check My Rentals</Link>
      </div>
    );
  }

  const totalPaid = bookings.reduce((sum, b) => sum + b.total, 0);
  const totalDeposit = bookings.reduce((sum, b) => sum + b.deposit, 0);

  return (
    <div className="container narrow" style={{ alignItems: "center", textAlign: "center" }}>
      <div className="success"><Icon name="check" size={36} stroke={2.6} /></div>
      <h1>{bookings.length > 1 ? "Event Basket Confirmed" : "You’re booked"}</h1>
      <p className="muted">
        {bookings.length > 1
          ? `${bookings.length} event items are reserved for your celebration on ${niceDate(primaryBooking.event_date)}.`
          : `${itemMap.get(primaryBooking.item_id)?.title ?? "Your outfit"} is yours for ${niceDate(primaryBooking.event_date)}.`}
      </p>

      <div className="stack g12" style={{ width: "100%", textAlign: "left" }}>
        {bookings.map((b) => {
          const it = itemMap.get(b.item_id);
          const hub = Array.isArray(it?.hub) ? it?.hub[0] : it?.hub;
          return (
            <div key={b.id} className="box">
              <div className="row between" style={{ alignItems: "flex-start", marginBottom: 6 }}>
                <strong style={{ fontSize: "1rem" }}>{it?.title}</strong>
                <span className="pill ok" style={{ textTransform: "uppercase", fontSize: "0.75rem" }}>{b.status}</span>
              </div>
              <div className="line">
                <span>Pickup / Handover Code</span>
                <strong style={{ fontSize: 18, letterSpacing: 2, color: "var(--accent-gold)" }}>{b.pickup_code}</strong>
              </div>
              <div className="line">
                <span>{b.delivery ? "Delivered on" : "Collect at Hub on"}</span>
                <strong>{niceDate(b.start_date)}</strong>
              </div>
              {!b.delivery && (
                <div className="line">
                  <span>Hub Location</span>
                  <span>{hub?.name ?? "Designated Hub"}{hub?.address ? `, ${hub.address}` : ""}</span>
                </div>
              )}
              {b.delivery && b.delivery_address && (
                <div className="line">
                  <span>Delivery Address</span>
                  <span>{b.delivery_address}</span>
                </div>
              )}
              <div className="line">
                <span>Return Date</span>
                <strong>{niceDate(b.end_date)}</strong>
              </div>
            </div>
          );
        })}

        <div className="box" style={{ background: "rgba(212, 175, 55, 0.08)", borderColor: "rgba(212, 175, 55, 0.3)" }}>
          <div className="line"><span>Total Paid (Paystack)</span><strong>{naira(totalPaid)}</strong></div>
          <div className="line muted small">
            <span>Includes 100% Refundable Deposit</span>
            <span style={{ color: "var(--grade-a)", fontWeight: 600 }}>{naira(totalDeposit)}</span>
          </div>
        </div>
      </div>

      <p className="small muted" style={{ marginTop: 16 }}>
        Present each item’s pickup code at the hub or to the delivery dispatch driver upon handover.
      </p>
      <div className="row g8 wrap" style={{ justifyContent: "center", marginTop: 8 }}>
        <Link href="/me?tab=rentals" className="btn">View My Rentals</Link>
        <Link href="/" className="btn ghost">Explore More Looks</Link>
      </div>
    </div>
  );
}
