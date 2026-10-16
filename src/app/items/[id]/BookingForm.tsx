"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CLEANING_FEE, DELIVERY_FEE } from "@/lib/constants";
import { addDays, naira, niceDate, todayISO } from "@/lib/format";
import { defaultDeposit, overlaps } from "@/lib/pricing";

type Range = { start_date: string; end_date: string };

export function BookingForm({ itemId, price, deposit, hubName, busy, signedIn }: { itemId: string; price: number; deposit: number; hubName: string; busy: Range[]; signedIn: boolean }) {
  const router = useRouter();
  const minDate = addDays(todayISO(), 2); // at least 2 days' notice for checks and delivery
  const maxDate = addDays(todayISO(), 180); // up to 6 months ahead
  const [eventDate, setEventDate] = useState("");
  const [delivery, setDelivery] = useState(false);
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dep = deposit > 0 ? deposit : defaultDeposit(price);
  const total = price + CLEANING_FEE + dep + (delivery ? DELIVERY_FEE : 0);
  const clash = useMemo(() => {
    if (!eventDate) return false;
    const s = addDays(eventDate, -1), e = addDays(eventDate, 1);
    return busy.some((b) => overlaps(s, e, b.start_date, b.end_date));
  }, [eventDate, busy]);

  async function rent() {
    setError("");
    if (!signedIn) { router.push(`/login?next=/items/${itemId}`); return; }
    if (!eventDate) { setError("Choose your event date first."); return; }
    if (eventDate < minDate) { setError(`Book at least 2 days ahead. The earliest event date is ${niceDate(minDate)}.`); return; }
    if (eventDate > maxDate) { setError("You can book up to 6 months ahead."); return; }
    if (clash) { setError("Someone already has it around that date. Try another date."); return; }
    if (delivery && address.trim().length < 8) { setError("Add a delivery address the rider can find."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, eventDate, delivery, address: address.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not start payment.");
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="stack g12">
      <div className="field">
        <label htmlFor="event-date">Event date</label>
        <input id="event-date" className="input" type="date" min={minDate} max={maxDate} value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        <span className="hint">
          {eventDate
            ? `Collect ${niceDate(addDays(eventDate, -1))}, return by ${niceDate(addDays(eventDate, 1))}.`
            : "You keep it for 3 days: the day before, the event day and the day after."}
        </span>
        {clash && <span className="error" role="alert">Not available around that date. Please choose another.</span>}
      </div>

      <div className="field">
        <span className="label" id="get-label">How you’ll get it</span>
        <div className="seg" role="group" aria-labelledby="get-label">
          <button type="button" aria-pressed={!delivery} onClick={() => setDelivery(false)}>
            <strong>Pickup</strong><small>Free at {hubName}</small>
          </button>
          <button type="button" aria-pressed={delivery} onClick={() => setDelivery(true)}>
            <strong>Delivery</strong><small>{naira(DELIVERY_FEE)} within the zone</small>
          </button>
        </div>
      </div>

      {delivery && (
        <div className="field">
          <label htmlFor="addr">Delivery address</label>
          <textarea id="addr" className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House number, street, landmark, area" maxLength={300} />
        </div>
      )}

      <div className="box">
        <div className="line"><span>Rental (3 days)</span><strong>{naira(price)}</strong></div>
        <div className="line"><span>Cleaning fee</span><span>{naira(CLEANING_FEE)}</span></div>
        {delivery && <div className="line"><span>Delivery</span><span>{naira(DELIVERY_FEE)}</span></div>}
        <div className="line"><span>Refundable deposit</span><span>{naira(dep)}</span></div>
        <div className="hr" />
        <div className="line"><strong>Pay today</strong><strong>{naira(total)}</strong></div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="sticky-pay">
        <div className="stack">
          <span className="tiny muted">Pay today</span>
          <strong style={{ fontSize: 20 }}>{naira(total)}</strong>
        </div>
        <button className="btn" onClick={rent} disabled={loading || clash}>
          {loading ? "Opening Paystack…" : signedIn ? "Rent with Paystack" : "Sign in to rent"}
        </button>
      </div>
    </div>
  );
}
