"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CLEANING_FEE,
  DELIVERY_FEE,
  TRUCK_DELIVERY_FEE,
  isEquipmentCategory,
  isServiceCategory,
} from "@/lib/constants";
import { addDays, naira, niceDate, todayISO } from "@/lib/format";
import { defaultDeposit, overlaps } from "@/lib/pricing";

import { useCart } from "@/context/CartContext";
import { Icon } from "@/components/Icon";

type Range = { start_date: string; end_date: string };

export function BookingForm({
  itemId,
  title,
  photos,
  sizeLabel,
  price,
  deposit,
  category,
  hubName,
  busy,
  signedIn,
}: {
  itemId: string;
  title?: string;
  photos?: string[];
  sizeLabel?: string | null;
  price: number;
  deposit: number;
  category?: string;
  hubName: string;
  busy: Range[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const minDate = addDays(todayISO(), 2); // at least 2 days' notice for checks and delivery
  const maxDate = addDays(todayISO(), 180); // up to 6 months ahead
  const [eventDate, setEventDate] = useState("");
  const [delivery, setDelivery] = useState(false);
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEquipment = isEquipmentCategory(category);
  const isService = isServiceCategory(category);

  const deliveryFee = !delivery ? 0 : isEquipment ? TRUCK_DELIVERY_FEE : isService ? 0 : DELIVERY_FEE;
  const cleaningFee = isService ? 0 : CLEANING_FEE;
  const dep = isService ? 0 : deposit > 0 ? deposit : defaultDeposit(price);
  const total = price + cleaningFee + dep + deliveryFee;

  const clash = useMemo(() => {
    if (!eventDate) return false;
    const s = addDays(eventDate, -1),
      e = addDays(eventDate, 1);
    return busy.some((b) => overlaps(s, e, b.start_date, b.end_date));
  }, [eventDate, busy]);

  async function rent() {
    setError("");
    if (!signedIn) {
      router.push(`/login?next=/items/${itemId}`);
      return;
    }
    if (!eventDate) {
      setError("Choose your event date first.");
      return;
    }
    if (eventDate < minDate) {
      setError(`Book at least 2 days ahead. The earliest date is ${niceDate(minDate)}.`);
      return;
    }
    if (eventDate > maxDate) {
      setError("You can book up to 6 months ahead.");
      return;
    }
    if (clash) {
      setError("Someone already has it booked around that date. Try another date.");
      return;
    }
    if ((delivery || isService) && address.trim().length < 8) {
      setError("Add the event venue or delivery address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, eventDate, delivery: delivery || isService, address: address.trim() }),
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
        <input
          id="event-date"
          className="input"
          type="date"
          min={minDate}
          max={maxDate}
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />
        <span className="hint">
          {eventDate
            ? isService
              ? `Service scheduled for ${niceDate(eventDate)}.`
              : `Collect ${niceDate(addDays(eventDate, -1))}, return by ${niceDate(addDays(eventDate, 1))}.`
            : isService
            ? "Choose your celebration date so the vendor can reserve their team."
            : "You keep it for 3 days: the day before, the event day, and the day after."}
        </span>
        {clash && <span className="error" role="alert">Not available around that date. Please choose another.</span>}
      </div>

      {!isService ? (
        <div className="field">
          <span className="label" id="get-label">How you’ll get it</span>
          <div className="seg" role="group" aria-labelledby="get-label">
            <button type="button" aria-pressed={!delivery} onClick={() => setDelivery(false)}>
              <strong>Pickup</strong>
              <small>Free at {hubName}</small>
            </button>
            <button type="button" aria-pressed={delivery} onClick={() => setDelivery(true)}>
              <strong>{isEquipment ? "Van / Truck Delivery" : "Bike Courier"}</strong>
              <small>{naira(isEquipment ? TRUCK_DELIVERY_FEE : DELIVERY_FEE)} Lagos zone</small>
            </button>
          </div>
        </div>
      ) : (
        <div className="field">
          <label htmlFor="addr">Event venue & address</label>
          <textarea
            id="addr"
            className="input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Event Hall / Venue address, Landmark, Lagos"
            maxLength={300}
          />
          <span className="hint">The catering/service team will arrive at this location 2 hours before your event.</span>
        </div>
      )}

      {!isService && delivery && (
        <div className="field">
          <label htmlFor="addr">Delivery address</label>
          <textarea
            id="addr"
            className="input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House number, street, landmark, area"
            maxLength={300}
          />
        </div>
      )}

      <div className="box">
        <div className="line">
          <span>{isService ? "Service Package" : isEquipment ? "Equipment Rental (3 days)" : "Rental (3 days)"}</span>
          <strong>{naira(price)}</strong>
        </div>
        {!isService && (
          <div className="line">
            <span>{isEquipment ? "Cleanliness & Sanitation audit" : "Cleaning fee"}</span>
            <span>{naira(cleaningFee)}</span>
          </div>
        )}
        {delivery && !isService && (
          <div className="line">
            <span>{isEquipment ? "Heavy Van Logistics" : "Delivery"}</span>
            <span>{naira(deliveryFee)}</span>
          </div>
        )}
        {!isService ? (
          <div className="line">
            <span>Refundable deposit</span>
            <span>{naira(dep)}</span>
          </div>
        ) : (
          <div className="line" style={{ color: "var(--grade-a, #165337)" }}>
            <span>Paystack Escrow Protection</span>
            <strong>Secured</strong>
          </div>
        )}
        <div className="hr" />
        <div className="line">
          <strong>Pay today</strong>
          <strong>{naira(total)}</strong>
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <button
        type="button"
        className="btn ghost block"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderColor: "var(--border-strong)",
          height: 46,
          fontWeight: 600,
        }}
        onClick={() => {
          addItem({
            id: itemId,
            title: title || "Celebration Item",
            price,
            deposit: dep,
            category: category || "Attire",
            photos: photos || [],
            size_label: sizeLabel,
            hub_area: hubName,
          });
        }}
      >
        <Icon name="bag" size={18} stroke={2} />
        <span>Add to Event Basket</span>
      </button>

      <div className="sticky-pay">
        <div className="stack">
          <span className="tiny muted">Pay today</span>
          <strong style={{ fontSize: 20 }}>{naira(total)}</strong>
        </div>
        <button className="btn" onClick={rent} disabled={loading || clash}>
          {loading
            ? "Opening Paystack…"
            : signedIn
            ? isService
              ? "Book Service via Escrow"
              : isEquipment
              ? "Rent Equipment via Paystack"
              : "Rent with Paystack"
            : "Sign in to book"}
        </button>
      </div>
    </div>
  );
}
