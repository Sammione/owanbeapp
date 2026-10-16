import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { confirmBooking } from "@/lib/bookings";
import { naira, niceDate } from "@/lib/format";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function Verify({ searchParams }: { searchParams: Promise<{ ref?: string; reference?: string }> }) {
  const sp = await searchParams;
  const ref = (sp.ref || sp.reference || "").slice(0, 80);
  const { user, supabase } = await requireUser(`/bookings/verify?ref=${encodeURIComponent(ref)}`);
  const booking = ref ? await confirmBooking(ref) : null;

  if (!booking || booking.renter_id !== user.id) {
    return (
      <div className="container narrow">
        <h1>We couldn’t find that payment</h1>
        <p className="muted">If money left your account, it will show in My rentals within a few minutes. Otherwise, contact us with your Paystack receipt.</p>
        <Link href="/me?tab=rentals" className="btn">Go to My rentals</Link>
      </div>
    );
  }

  const { data: item } = await supabase.from("items").select("title,hub:hubs(name,address)").eq("id", booking.item_id).maybeSingle();
  const hub = Array.isArray(item?.hub) ? item?.hub[0] : item?.hub;

  if (booking.status === "pending_payment") {
    return (
      <div className="container narrow">
        <h1>Payment not completed</h1>
        <p className="muted">Paystack hasn’t confirmed this payment. If you closed the page, you can try again.</p>
        <Link href={`/items/${booking.item_id}?cancelled=1`} className="btn">Try again</Link>
      </div>
    );
  }

  if (booking.status === "conflict") {
    return (
      <div className="container narrow">
        <p className="notice bad">Someone booked this outfit for the same dates a moment before you. Your full payment of {naira(booking.total)} will be refunded. We’re sorry about this.</p>
        <Link href="/" className="btn">Find another outfit</Link>
      </div>
    );
  }

  return (
    <div className="container narrow" style={{ alignItems: "center", textAlign: "center" }}>
      <div className="success"><Icon name="check" size={36} stroke={2.6} /></div>
      <h1>You’re booked</h1>
      <p className="muted">
        <strong style={{ color: "var(--ink)" }}>{item?.title}</strong> is yours for {niceDate(booking.event_date)}.
      </p>
      <div className="box" style={{ width: "100%", textAlign: "left" }}>
        <div className="line"><span>Pickup code</span><strong style={{ fontSize: 20, letterSpacing: 2 }}>{booking.pickup_code}</strong></div>
        <div className="line"><span>{booking.delivery ? "Delivered on" : "Collect on"}</span><strong>{niceDate(booking.start_date)}</strong></div>
        {!booking.delivery && <div className="line"><span>Where</span><span>{hub?.name ?? "Your hub"}{hub?.address ? `, ${hub.address}` : ""}</span></div>}
        <div className="line"><span>Return by</span><strong>{niceDate(booking.end_date)}</strong></div>
        <div className="hr" />
        <div className="line"><span>Paid</span><strong>{naira(booking.total)}</strong></div>
        <div className="line muted small"><span>Includes refundable deposit</span><span>{naira(booking.deposit)}</span></div>
      </div>
      <p className="small muted">Show the pickup code {booking.delivery ? "to the rider" : "at the hub"}. Late returns cost extra per day, so set a reminder.</p>
      <div className="row g8 wrap" style={{ justifyContent: "center" }}>
        <Link href="/me?tab=rentals" className="btn">View my rentals</Link>
        <Link href="/" className="btn ghost">Keep browsing</Link>
      </div>
    </div>
  );
}
