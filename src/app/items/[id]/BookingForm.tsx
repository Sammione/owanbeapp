"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CLEANING_FEE,
  DELIVERY_FEE,
  TRUCK_DELIVERY_FEE,
  isVenueCategory,
  isEquipmentCategory,
  isServiceCategory,
  isSouvenirCategory,
  VENUE_INSPECTION_ESCROW_NGN,
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
  const isVenue = isVenueCategory(category);
  const isEquipment = isEquipmentCategory(category);
  const isService = isServiceCategory(category);
  const isSouvenir = isSouvenirCategory(category);

  const minDaysNotice = isSouvenir ? 5 : 2;
  const minDate = addDays(todayISO(), minDaysNotice);
  const maxDate = addDays(todayISO(), 180);
  const [eventDate, setEventDate] = useState("");
  const [delivery, setDelivery] = useState(isSouvenir);
  const [address, setAddress] = useState("");
  const [customText, setCustomText] = useState("");
  const [proofPhone, setProofPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const deliveryFee = !delivery || isVenue ? 0 : isEquipment ? TRUCK_DELIVERY_FEE : isService || isSouvenir ? 0 : DELIVERY_FEE;
  const cleaningFee = isService || isVenue || isSouvenir ? 0 : CLEANING_FEE;
  const dep = isVenue ? VENUE_INSPECTION_ESCROW_NGN : isService || isSouvenir ? 0 : deposit > 0 ? deposit : defaultDeposit(price);
  const total = isVenue ? VENUE_INSPECTION_ESCROW_NGN : price + cleaningFee + dep + deliveryFee;

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
    if (isSouvenir && customText.trim().length < 3) {
      setError("Please enter the couple/celebrant name or monogram to print.");
      return;
    }
    if ((delivery || isService || isSouvenir) && address.trim().length < 8) {
      setError("Add the event venue or delivery address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          eventDate,
          delivery: delivery || isService || isSouvenir,
          address: address.trim(),
          customDetails: isSouvenir ? `${customText} (WhatsApp: ${proofPhone})` : undefined,
        }),
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
            ? isSouvenir
              ? `Production scheduled. Target delivery 2 days prior (${niceDate(addDays(eventDate, -2))}).`
              : isVenue
              ? `Inspection / Reservation requested for ${niceDate(eventDate)}.`
              : isService
              ? `Service scheduled for ${niceDate(eventDate)}.`
              : `Collect ${niceDate(addDays(eventDate, -1))}, return by ${niceDate(addDays(eventDate, 1))}.`
            : isSouvenir
            ? "Choose your party date. We require 5 days to laser-engrave, package, and deliver your batch."
            : isVenue
            ? "Choose your celebration date to check hall availability and schedule a walkthrough."
            : isService
            ? "Choose your celebration date so the vendor can reserve their team."
            : "You keep it for 3 days: the day before, the event day, and the day after."}
        </span>
        {clash && <span className="error" role="alert">Not available around that date. Please choose another.</span>}
      </div>

      {isSouvenir && (
        <div className="box" style={{ background: "rgba(212, 175, 55, 0.05)", borderColor: "rgba(212, 175, 55, 0.3)" }}>
          <div className="row g8" style={{ alignItems: "center", marginBottom: 10 }}>
            <Icon name="sparkles" size={18} stroke={2} />
            <strong className="small" style={{ color: "var(--accent-gold, #D4AF37)" }}>Custom Souvenir Branding Details</strong>
          </div>
          <div className="field">
            <label htmlFor="custom-text">Celebrant / Couple Names &amp; Details to Print</label>
            <input
              id="custom-text"
              className="input"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g. Tobi & Adeola 2026 (#TobiAdeola26)"
              maxLength={120}
            />
            <span className="hint">We laser-engrave or foil-stamp these exact details onto your souvenirs &amp; gift boxes.</span>
          </div>
          <div className="field" style={{ marginTop: 10 }}>
            <label htmlFor="proof-phone">WhatsApp Phone for 3D Proof Approval</label>
            <input
              id="proof-phone"
              className="input"
              type="tel"
              value={proofPhone}
              onChange={(e) => setProofPhone(e.target.value)}
              placeholder="e.g. 080 3322 1100"
              maxLength={20}
            />
            <span className="hint">Our production team sends a 3D digital mockup on WhatsApp before mass printing.</span>
          </div>
          <a
            href={`https://wa.me/2348033221100?text=${encodeURIComponent(
              `Hello owambeFit, I want to order custom souvenirs: "${title || "Souvenir Batch"}" for my event on ${eventDate ? niceDate(eventDate) : "an upcoming date"}. Names to print: ${customText || "[Pending]"}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn ghost block small"
            style={{ borderColor: "#25D366", color: "#165337", marginTop: 12, textAlign: "center" }}
          >
            Chat with Souvenir Desk on WhatsApp
          </a>
        </div>
      )}

      {isVenue ? (
        <div className="box" style={{ background: "rgba(37, 211, 102, 0.08)", borderColor: "rgba(37, 211, 102, 0.3)" }}>
          <div className="row g10" style={{ alignItems: "center" }}>
            <Icon name="whatsapp" size={24} stroke={2} />
            <div className="stack g2" style={{ flex: 1 }}>
              <strong className="small" style={{ color: "#165337" }}>Schedule Free Physical Tour</strong>
              <span className="tiny muted">
                Chat directly with the hall manager on WhatsApp to confirm date availability and schedule your on-site inspection.
              </span>
            </div>
          </div>
          <a
            href={`https://wa.me/2348033221100?text=${encodeURIComponent(
              `Hello, I saw your hall "${title || "Event Hall"}" on owambeFit. I would like to schedule a physical tour and check availability for my event on ${eventDate ? niceDate(eventDate) : "an upcoming date"}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn block small"
            style={{ background: "#25D366", color: "#fff", borderColor: "#25D366", marginTop: 10, textAlign: "center" }}
          >
            Chat on WhatsApp for Free Tour
          </a>
        </div>
      ) : !isService && !isSouvenir ? (
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
          <label htmlFor="addr">{isSouvenir ? "Delivery Venue or Doorstep Address" : "Event venue & address"}</label>
          <textarea
            id="addr"
            className="input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={isSouvenir ? "Event Hall or Home Address, Landmark, Lagos" : "Event Hall / Venue address, Landmark, Lagos"}
            maxLength={300}
          />
          <span className="hint">
            {isSouvenir
              ? "All souvenir gift boxes are carefully packed in cartons and dispatched directly to this address."
              : "The catering/service team will arrive at this location 2 hours before your event."}
          </span>
        </div>
      )}

      {!isService && !isVenue && !isSouvenir && delivery && (
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

      {isSouvenir ? (
        <div className="box">
          <div className="line">
            <span>Custom Souvenir Batch</span>
            <strong>{naira(price)}</strong>
          </div>
          <div className="line" style={{ color: "var(--grade-a, #165337)" }}>
            <span>Digital 3D Design Proof Mockup</span>
            <strong>FREE</strong>
          </div>
          <div className="line" style={{ color: "var(--grade-a, #165337)" }}>
            <span>Gift Box Packaging &amp; Ribbons</span>
            <strong>INCLUDED</strong>
          </div>
          <div className="line">
            <span>Lagos Logistics &amp; Dispatch</span>
            <strong style={{ color: "var(--grade-a, #165337)" }}>FREE</strong>
          </div>
          <div className="line" style={{ color: "var(--ink-secondary)" }}>
            <span>Refundable Deposit</span>
            <span>₦0 (Keepsake Gift)</span>
          </div>
          <div className="hr" />
          <div className="line">
            <strong>Total Order Value</strong>
            <strong>{naira(total)}</strong>
          </div>
        </div>
      ) : isVenue ? (
        <div className="box">
          <div className="line">
            <span>Venue Rental Fee (Full Day)</span>
            <strong>{naira(price)}</strong>
          </div>
          <div className="line" style={{ color: "var(--grade-a, #165337)" }}>
            <span>Physical Walkthrough Tour</span>
            <strong>FREE</strong>
          </div>
          <div className="line">
            <span>Date Reservation Escrow (Deposit)</span>
            <span>{naira(VENUE_INSPECTION_ESCROW_NGN)}</span>
          </div>
          <div className="hr" />
          <div className="line">
            <strong>Escrow Hold Today</strong>
            <strong>{naira(total)}</strong>
          </div>
          <span className="tiny muted" style={{ display: "block", marginTop: 6 }}>
            * Your ₦50,000 commitment deposit is held safely in owambeFit Escrow until physical inspection is concluded. Balance paid before event date.
          </span>
        </div>
      ) : (
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
      )}

      {/* Cross-Sell Event Essentials Bundle */}
      {isVenue && (
        <div className="box" style={{ background: "rgba(212, 175, 55, 0.08)", borderColor: "rgba(212, 175, 55, 0.3)" }}>
          <div className="row g8" style={{ alignItems: "center" }}>
            <Icon name="box" size={18} stroke={2} />
            <strong className="small">Hosting at this Hall? Add Matching Essentials</strong>
          </div>
          <p className="tiny muted" style={{ margin: "4px 0 8px" }}>
            Need 50 Chiavari chairs, 150L ice coolers, or party catering for this venue? Add essentials with 1-click.
          </p>
          <div className="row g6" style={{ flexWrap: "wrap" }}>
            <a href="/?pillar=equipment" className="pill" style={{ textDecoration: "none" }}>Explore Coolers &amp; Chairs</a>
            <a href="/?pillar=services" className="pill" style={{ textDecoration: "none" }}>Party Catering &amp; Jollof</a>
          </div>
        </div>
      )}

      {error && <p className="error" role="alert">{error}</p>}

      {!isVenue && (
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
      )}

      <div className="sticky-pay">
        <div className="stack">
          <span className="tiny muted">{isVenue ? "Escrow Hold" : "Pay today"}</span>
          <strong style={{ fontSize: 20 }}>{naira(total)}</strong>
        </div>
        <button className="btn" onClick={rent} disabled={loading || clash}>
          {loading
            ? "Opening Paystack…"
            : signedIn
            ? isSouvenir
              ? `Order Custom Souvenirs (${naira(total)})`
              : isVenue
              ? "Lock Date with Escrow (₦50,000)"
              : isService
              ? "Book Service via Escrow"
              : isEquipment
              ? "Rent Equipment via Paystack"
              : "Rent with Paystack"
            : isSouvenir
            ? "Sign in to order"
            : "Sign in to book"}
        </button>
      </div>
    </div>
  );
}
