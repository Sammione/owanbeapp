import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { naira, niceDate, todayISO } from "@/lib/format";
import { lateFeePerDay } from "@/lib/pricing";
import type { Booking } from "@/lib/types";
import { Icon } from "@/components/Icon";
import { Photo } from "@/components/Photo";
import { Checklist, PhotoInput } from "@/components/Checklist";
import { checkIn, checkOut } from "../../actions";

export default async function HubBooking({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase } = await requireStaff();
  const { data: b } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle<Booking>();
  if (!b) notFound();
  const [{ data: item }, { data: renter }] = await Promise.all([
    supabase.from("items").select("id,title,photos,grade,tag_code").eq("id", b.item_id).single(),
    supabase.from("profiles").select("full_name,phone").eq("id", b.renter_id).maybeSingle(),
  ]);
  const today = todayISO();
  const lateDays = Math.max(0, Math.round((Date.parse(today) - Date.parse(b.end_date)) / 86400000));
  const lateFee = lateDays * lateFeePerDay(b.rental_fee);

  return (
    <div className="container narrow">
      <Link href="/hub" className="iconbtn" aria-label="Back to hub"><Icon name="back" stroke={2.2} /></Link>
      {sp.error && <p className="notice bad" role="alert">{sp.error}</p>}
      <div className="listrow">
        <Photo src={item?.photos?.[0]} alt={item?.title ?? ""} className="thumb" />
        <div className="stack g4" style={{ flex: 1 }}>
          <strong>{item?.title}</strong>
          <span className="small muted">Tag {item?.tag_code ?? "—"} · Grade {item?.grade ?? "—"}</span>
        </div>
      </div>
      <div className="box">
        <div className="line"><span>Renter</span><strong>{renter?.full_name ?? "—"}</strong></div>
        <div className="line"><span>WhatsApp</span>{renter?.phone ? <a href={`https://wa.me/${renter.phone.replace(/\D/g, "").replace(/^0/, "234")}`}>{renter.phone}</a> : <span>—</span>}</div>
        <div className="line"><span>Event</span><strong>{niceDate(b.event_date)}</strong></div>
        <div className="line"><span>Out</span><span>{niceDate(b.start_date)} → back {niceDate(b.end_date)}</span></div>
        <div className="line"><span>Handover</span><span>{b.delivery ? `Delivery: ${b.delivery_address}` : "Pickup at hub"}</span></div>
        <div className="line"><span>Deposit held</span><strong>{naira(b.deposit)}</strong></div>
        <div className="line"><span>Status</span><span className="pill">{b.status}</span></div>
      </div>

      {b.status === "paid" && (
        <form action={checkOut} className="stack g16">
          <input type="hidden" name="id" value={b.id} />
          <h2>Check out</h2>
          {!b.delivery && (
            <div className="field">
              <label htmlFor="code">Renter’s pickup code</label>
              <input id="code" name="code" className="input" inputMode="numeric" maxLength={4} required />
            </div>
          )}
          <Checklist />
          <PhotoInput />
          <div className="field">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" className="input" />
          </div>
          <button className="btn block">Hand over outfit</button>
        </form>
      )}

      {b.status === "out" && (
        <form action={checkIn} className="stack g16">
          <input type="hidden" name="id" value={b.id} />
          <h2>Check in the return</h2>
          {lateDays > 0 && <p className="notice warn">{lateDays} day{lateDays === 1 ? "" : "s"} late. Late fee {naira(lateFee)} comes off the deposit.</p>}
          <Checklist />
          <div className="field">
            <label htmlFor="grade">Grade after this rental</label>
            <select id="grade" name="grade" className="input" defaultValue={item?.grade ?? ""}>
              <option value="">Keep current</option>
              <option value="A">A · Like new</option>
              <option value="B">B · Gently used</option>
              <option value="C">C · Budget</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="damage">Damage charge (₦)</label>
            <input id="damage" name="damage" className="input" inputMode="numeric" defaultValue="0" />
            <span className="hint">Only for real damage, backed by photos. It comes off the deposit and goes to the owner.</span>
          </div>
          <PhotoInput />
          <div className="field">
            <label htmlFor="notes2">Notes</label>
            <textarea id="notes2" name="notes" className="input" />
          </div>
          <button className="btn block">Complete return and refund deposit</button>
        </form>
      )}
    </div>
  );
}
