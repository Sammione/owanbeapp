"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AREAS } from "@/lib/constants";
import { Icon } from "@/components/Icon";
import { registerVendor } from "./actions";

export function VendorForm({
  userEmail,
  defaultArea,
  defaultVendorType,
}: {
  userEmail: string;
  defaultArea: string | null;
  defaultVendorType?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [vendorType, setVendorType] = useState(defaultVendorType || "equipment_rental");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await registerVendor(null, formData);
      if (!res.ok) {
        setError(res.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push(vendorType === "hall_manager" ? "/list?type=venue" : "/list");
          router.refresh();
        }, 1200);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="stack g16">
      <div className="box" style={{ background: "rgba(22, 83, 55, 0.08)", borderColor: "rgba(22, 83, 55, 0.25)" }}>
        <div className="row g10" style={{ alignItems: "center" }}>
          <Icon name={vendorType === "hall_manager" ? "shield" : "utensils"} size={24} stroke={2} />
          <div>
            <strong style={{ fontSize: 16 }}>Owambe Vendor &amp; Venue Network</strong>
            <p className="tiny muted" style={{ margin: "2px 0 0" }}>
              {vendorType === "hall_manager"
                ? "List your event hall or marquee. Receive direct WhatsApp inspection leads from Lagos couples and event planners. Free 30-day launch trial included."
                : "Get verified for party catering, heavy equipment rentals (coolers/pots), or cocktail bars. Earn 80% with automated Paystack NUBAN payouts."}
            </p>
          </div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="biz_name">Business or Brand Name *</label>
        <input
          id="biz_name"
          name="business_name"
          className="input"
          placeholder={vendorType === "hall_manager" ? "e.g. The Grand Oasis Event & Banquet Center" : "e.g. Egbeda Party Rentals & Coolers or Royal Jollof Caterers"}
          required
          maxLength={90}
        />
      </div>

      <div className="grid2">
        <div className="field">
          <label htmlFor="v_type">Vendor Type / Specialty *</label>
          <select
            id="v_type"
            name="vendor_type"
            className="input"
            value={vendorType}
            onChange={(e) => setVendorType(e.target.value)}
          >
            <option value="hall_manager">Event Hall &amp; Marquee Venue Manager (30-Day Free Trial / ₦7,500/mo)</option>
            <option value="equipment_rental">Event Equipment Hire (Coolers, Pots, Warmers, Furniture)</option>
            <option value="caterer">Party Catering &amp; Main Courses (Jollof, Soups, Asun)</option>
            <option value="small_chops">Small Chops &amp; Finger Foods (Pastries, Appetizers)</option>
            <option value="drinks">Cocktail Bar &amp; Beverage Management (Tubs, Bars)</option>
            <option value="event_services">Event Ushers &amp; Protocol Hospitality</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="area">Primary Lagos Base Area *</label>
          <select id="area" name="area" className="input" defaultValue={defaultArea || "Ikotun"}>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a} &amp; surrounding zones
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid2">
        <div className="field">
          <label htmlFor="phone">Official WhatsApp / Call Phone *</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="input"
            placeholder="080 1234 5678"
            required
            maxLength={16}
          />
        </div>

        <div className="field">
          <label htmlFor="email">Registered Email</label>
          <input id="email" className="input" value={userEmail} disabled />
        </div>
      </div>

      <div className="field">
        <label htmlFor="desc">
          {vendorType === "hall_manager" ? "Venue Overview & Amenities" : "Fleet / Menu Description"}
        </label>
        <textarea
          id="desc"
          name="description"
          className="input"
          placeholder={
            vendorType === "hall_manager"
              ? "e.g. 500-capacity fully air-conditioned ballroom with 250kVA standby generator, 80 car parking lot, and luxury bridal dressing suite located in Egbeda."
              : "e.g. We have 12 large 150L coolers, 6 size-50 cast iron pots with industrial gas burners, and 40 chafing dishes ready for weekend hire across Lagos."
          }
          maxLength={400}
        />
      </div>

      <div className="box">
        {vendorType === "hall_manager" ? (
          <>
            <div className="line">
              <span>Listing Model</span>
              <strong style={{ color: "var(--grade-a, #165337)" }}>30-Day Free Trial (renews ₦7,500/mo)</strong>
            </div>
            <div className="line">
              <span>Booking Inflow</span>
              <strong>Direct WhatsApp &amp; Physical Tour Requests</strong>
            </div>
            <div className="line">
              <span>Take Rate</span>
              <strong>0% commission on your hall rental fee</strong>
            </div>
          </>
        ) : (
          <>
            <div className="line">
              <span>Vendor Payout Share</span>
              <strong>80% of booking amount</strong>
            </div>
            <div className="line">
              <span>Payment Model</span>
              <strong>Paystack Automated Bank Transfer</strong>
            </div>
            <div className="line">
              <span>Escrow &amp; Dispute Security</span>
              <strong>100% Platform Protected</strong>
            </div>
          </>
        )}
      </div>

      {error && <p className="notice bad" role="alert">{error}</p>}
      {success && <p className="notice ok" role="status">Welcome to the Owambe Vendor Network! Opening listing creator…</p>}

      <button className="btn block" disabled={isPending || success}>
        {isPending
          ? "Submitting Application…"
          : vendorType === "hall_manager"
          ? "Register Event Hall (Start 30-Day Free Trial)"
          : "Complete Vendor Onboarding"}
      </button>
    </form>
  );
}
