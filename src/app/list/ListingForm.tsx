"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORIES,
  FASHION_CATEGORIES,
  EQUIPMENT_CATEGORIES,
  SERVICE_CATEGORIES,
  VENUE_CATEGORIES,
  VENUE_SLOTS,
  VENUE_CAPACITIES,
  VENUE_AMENITIES,
  VENUE_SUBSCRIPTION_NGN,
  VENUE_INSPECTION_ESCROW_NGN,
  EQUIPMENT_CAPACITIES,
  CATERING_CAPACITIES,
  EVENTS,
  OWNER_SHARE,
  VENDOR_SHARE,
  EU_SHOE_SIZES,
  HEEL_HEIGHTS,
  FOOTWEAR_STYLES,
  isVenueCategory,
  isEquipmentCategory,
  isServiceCategory,
} from "@/lib/constants";
import { naira } from "@/lib/format";
import type { Hub } from "@/lib/types";
import { Icon } from "@/components/Icon";

const GARMENT_SLOTS = ["Front View", "Back View", "Fabric Close-up", "Inside Label", "Any Flaws"];
const SHOE_SLOTS = ["Pair (Top View)", "Sole & Heel", "Side Profile", "Embellishments", "Inner Sole / Label"];
const EQUIPMENT_SLOTS = ["Full Unit (Front)", "Interior / Tank", "Valves / Handles", "Fleet Tag / Brand", "Marks / Scratches"];
const SERVICE_SLOTS = ["Presentation / Buffet", "Food / Drink Close-up", "Setup at Event", "Staff in Uniform", "Menu / Branding"];

const NO_MEASURE = [
  "Gele",
  "Beads & jewelry",
  "Accessories",
  "Shoes & Footwear",
  ...VENUE_CATEGORIES,
  ...EQUIPMENT_CATEGORIES,
  ...SERVICE_CATEGORIES,
];

/** Shrinks a photo to max 1400px wide JPEG so uploads are fast on mobile data. */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("Could not read photo"))), "image/jpeg", 0.82)
  );
}

export function ListingForm({
  userId,
  hubs,
  defaultArea,
  initialType = "fashion",
  userVendorType,
}: {
  userId: string;
  hubs: Hub[];
  defaultArea: string | null;
  initialType?: "fashion" | "equipment" | "service" | "venue";
  userVendorType?: string | null;
}) {
  const router = useRouter();
  const [listingType, setListingType] = useState<"fashion" | "equipment" | "service" | "venue">(initialType);

  const initialCat =
    initialType === "venue"
      ? VENUE_CATEGORIES[0]
      : initialType === "equipment"
      ? EQUIPMENT_CATEGORIES[0]
      : initialType === "service"
      ? SERVICE_CATEGORIES[0]
      : FASHION_CATEGORIES[0];

  const initialSize =
    initialType === "venue"
      ? "Banquet: 350 · Theater: 600"
      : initialType === "equipment"
      ? EQUIPMENT_CAPACITIES[0]
      : initialType === "service"
      ? CATERING_CAPACITIES[1]
      : "";

  const [f, setF] = useState({
    title: "",
    category: initialCat as string,
    size_label: initialSize,
    pieces: "",
    description: "",
    price: "",
    bust: "",
    waist: "",
    hip: "",
    length: "",
    sleeve: "",
    hub_id: hubs.find((h) => h.area === defaultArea)?.id ?? hubs[0]?.id ?? "",
  });

  const isFootwear = f.category === "Shoes & Footwear";
  const isEquipment = isEquipmentCategory(f.category) || listingType === "equipment";
  const isService = isServiceCategory(f.category) || listingType === "service";
  const isVenue = isVenueCategory(f.category) || listingType === "venue";

  const slots = isVenue
    ? VENUE_SLOTS
    : isService
    ? SERVICE_SLOTS
    : isEquipment
    ? EQUIPMENT_SLOTS
    : isFootwear
    ? SHOE_SLOTS
    : GARMENT_SLOTS;

  const [shoeSize, setShoeSize] = useState<string>(EU_SHOE_SIZES[3]);
  const [heelHeight, setHeelHeight] = useState<string>(HEEL_HEIGHTS[2]);
  const [footwearStyle, setFootwearStyle] = useState<string>(FOOTWEAR_STYLES[0]);
  const [equipmentCapacity, setEquipmentCapacity] = useState<string>(EQUIPMENT_CAPACITIES[0]);
  const [cateringCapacity, setCateringCapacity] = useState<string>(CATERING_CAPACITIES[1]);

  const [venueBanquet, setVenueBanquet] = useState<string>("350 Guests Banquet Style");
  const [venueTheater, setVenueTheater] = useState<string>("600 Guests Theater Style");
  const [venueParking, setVenueParking] = useState<string>("Secured Paved Parking (80+ Vehicles)");
  const [venueGenPolicy, setVenueGenPolicy] = useState<string>("250kVA Standby Gen Included (8 Hours)");
  const [venueACType, setVenueACType] = useState<string>("Full Central Air Conditioning / 10 Standing Chillers");
  const [venueAddress, setVenueAddress] = useState<string>("");
  const [venueWhatsApp, setVenueWhatsApp] = useState<string>("");
  const [venueAmenities, setVenueAmenities] = useState<string[]>([...VENUE_AMENITIES.slice(0, 4)]);

  const initialSlots =
    initialType === "venue"
      ? VENUE_SLOTS
      : initialType === "service"
      ? SERVICE_SLOTS
      : initialType === "equipment"
      ? EQUIPMENT_SLOTS
      : GARMENT_SLOTS;

  const [photos, setPhotos] = useState<(File | null)[]>(initialSlots.map(() => null));
  const [previews, setPreviews] = useState<(string | null)[]>(initialSlots.map(() => null));
  const [events, setEvents] = useState<string[]>(["Wedding"]);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  function onSwitchType(type: "fashion" | "equipment" | "service" | "venue") {
    setListingType(type);
    const targetSlots =
      type === "venue"
        ? VENUE_SLOTS
        : type === "service"
        ? SERVICE_SLOTS
        : type === "equipment"
        ? EQUIPMENT_SLOTS
        : GARMENT_SLOTS;
    setPhotos(targetSlots.map(() => null));
    setPreviews(targetSlots.map(() => null));

    if (type === "fashion") {
      setF((prev) => ({ ...prev, category: FASHION_CATEGORIES[0], size_label: "" }));
    } else if (type === "equipment") {
      setF((prev) => ({ ...prev, category: EQUIPMENT_CATEGORIES[0], size_label: EQUIPMENT_CAPACITIES[0] }));
    } else if (type === "service") {
      setF((prev) => ({ ...prev, category: SERVICE_CATEGORIES[0], size_label: CATERING_CAPACITIES[1] }));
    } else {
      setF((prev) => ({ ...prev, category: VENUE_CATEGORIES[0], size_label: "Banquet: 350 · Theater: 600" }));
    }
  }

  const set = (k: keyof typeof f) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setF({ ...f, [k]: e.target.value });

  const price = parseInt(f.price.replace(/\D/g, "")) || 0;
  const needsMeasure = !NO_MEASURE.includes(f.category) && listingType === "fashion";

  function pick(i: number, file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a photo.");
      return;
    }
    const p = [...photos];
    p[i] = file;
    setPhotos(p);
    const v = [...previews];
    if (v[i]) URL.revokeObjectURL(v[i]!);
    v[i] = URL.createObjectURL(file);
    setPreviews(v);
  }

  function remove(i: number) {
    const p = [...photos];
    p[i] = null;
    setPhotos(p);
    const v = [...previews];
    if (v[i]) URL.revokeObjectURL(v[i]!);
    v[i] = null;
    setPreviews(v);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const chosen = photos.filter(Boolean) as File[];
    if (f.title.trim().length < 3) return setError("Give your listing a clear title.");
    if (chosen.length < 3) return setError("Add at least 3 photos.");
    if (!events.length) return setError("Pick at least one event it suits.");
    if (price < 1000) return setError("Set a price of at least ₦1,000.");
    if (needsMeasure && (!f.bust || !f.waist || !f.length))
      return setError("Add at least bust, waist and length so renters know it will fit.");
    if (!f.hub_id && !isService && !isVenue) return setError("Choose your neighborhood drop-off hub.");
    if (isVenue && !venueAddress.trim()) return setError("Please enter the exact venue address and landmark.");
    if (!agree) return setError("Please confirm you own or operate this service/equipment/venue.");

    const supabase = createClient();
    try {
      const urls: string[] = [];
      for (let i = 0; i < chosen.length; i++) {
        setStatus(`Uploading photo ${i + 1} of ${chosen.length}…`);
        const blob = await compress(chosen[i]);
        const path = `${userId}/${crypto.randomUUID()}.jpg`;
        const up = await supabase.storage.from("item-photos").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw up.error;
        urls.push(supabase.storage.from("item-photos").getPublicUrl(path).data.publicUrl);
      }
      setStatus("Saving your listing…");
      const num = (s: string) => (s ? Number(s) : null);

      let computedSize = f.size_label.trim() || null;
      let computedPieces = f.pieces.trim() || null;

      if (isFootwear) {
        computedSize = `${shoeSize} · ${heelHeight}`;
        computedPieces = computedPieces || `${footwearStyle} (Pair + Dustbag)`;
      } else if (isEquipment) {
        computedSize = equipmentCapacity;
        computedPieces = computedPieces || "Hardware Unit + Accessories";
      } else if (isService) {
        computedSize = cateringCapacity;
        computedPieces = computedPieces || "Service Staff + Warmers + Cutlery";
      } else if (isVenue) {
        computedSize = `${venueBanquet} · ${venueTheater}`;
        computedPieces = `${venueACType} · ${venueGenPolicy} · ${venueParking}`;
      }

      let computedDesc = f.description.trim() || null;
      if (isVenue) {
        computedDesc = `${computedDesc ? computedDesc + "\n\n" : ""}📍 Address: ${venueAddress || "Lagos"}\n📞 WhatsApp: ${venueWhatsApp || "Direct via Owambe Closet"}\n✨ Amenities: ${venueAmenities.join(", ")}`;
      }

      const { error } = await supabase.from("items").insert({
        owner_id: userId,
        hub_id: f.hub_id || null,
        title: f.title.trim(),
        description: computedDesc,
        category: f.category,
        events,
        size_label: computedSize,
        pieces: computedPieces,
        bust: isFootwear || isEquipment || isService || isVenue ? null : num(f.bust),
        waist: isFootwear || isEquipment || isService || isVenue ? null : num(f.waist),
        hip: isFootwear || isEquipment || isService || isVenue ? null : num(f.hip),
        length: isFootwear || isEquipment || isService || isVenue ? null : num(f.length),
        sleeve: isFootwear || isEquipment || isService || isVenue ? null : num(f.sleeve),
        price,
        photos: urls,
      });
      if (error) throw error;
      router.push("/me?mode=lender&tab=listings&listed=1");
      router.refresh();
    } catch (err) {
      setStatus("");
      setError(err instanceof Error ? err.message : "Upload failed. Check your connection and try again.");
    }
  }

  const busy = !!status;

  return (
    <form onSubmit={submit} className="stack g16">
      {/* Dynamic Header based on Listing Type */}
      <div className="stack g6" style={{ marginBottom: 8 }}>
        <div className="row between" style={{ alignItems: "center" }}>
          <span
            className={`pill ${isVenue ? "ok" : isService || isEquipment ? "warn" : ""}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <Icon name={isVenue ? "shield" : isService ? "utensils" : isEquipment ? "box" : "shield"} size={13} stroke={2.2} />
            {isVenue
              ? "Venue Partner Listing · 30-Day Free Trial"
              : isService
              ? "Party Catering & Services Partner"
              : isEquipment
              ? "Equipment Rental Fleet"
              : "Wardrobe Sharing Partner (70% Payout)"}
          </span>
        </div>
        <h1 style={{ fontSize: "clamp(24px, 3.5vw, 32px)", lineHeight: 1.15, margin: "4px 0 2px" }}>
          {isVenue
            ? "List Your Event Hall or Marquee"
            : isService
            ? "List Catering & Party Services"
            : isEquipment
            ? "List Event Hardware & Equipment"
            : "Let your wardrobe pay you"}
        </h1>
        <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>
          {isVenue
            ? "Showcase your event center, banquet ballroom, or marquee pavilion with 5 guided photos, seating capacity, standby generator specs, and direct WhatsApp tour booking. 0% commission on your hall rental fee."
            : isService
            ? "Offer party jollof, small chops, cocktail bars, or hospitality protocol directly to Lagos celebrants. Guaranteed Paystack escrow and direct bank transfers."
            : isEquipment
            ? "List heavy-duty beverage coolers, cast-iron party pots, food warmers, and event chairs. Earn 80% with automated Paystack NUBAN payouts."
            : "Snap it and set a price. Drop it at a hub, and we inspect, clean, grade and photograph it before renters see it. You earn 70% of every rental."}
        </p>
      </div>

      {/* 4-Pillar Listing Type Switcher */}
      <div className="field">
        <span className="label">Listing Category</span>
        <div className="seg" role="group" aria-label="Listing Category Type">
          <button
            type="button"
            aria-pressed={listingType === "fashion"}
            onClick={() => onSwitchType("fashion")}
          >
            <strong>Attire &amp; Shoes</strong>
            <small>Aso-ebi, Agbada, Gele, Heels</small>
          </button>
          <button
            type="button"
            aria-pressed={listingType === "venue"}
            onClick={() => onSwitchType("venue")}
          >
            <strong>Halls &amp; Venues</strong>
            <small>Marquees, Ballrooms, Gardens</small>
          </button>
          <button
            type="button"
            aria-pressed={listingType === "equipment"}
            onClick={() => onSwitchType("equipment")}
          >
            <strong>Equipment</strong>
            <small>Coolers, Pots, Warmers, Chairs</small>
          </button>
          <button
            type="button"
            aria-pressed={listingType === "service"}
            onClick={() => onSwitchType("service")}
          >
            <strong>Catering</strong>
            <small>Jollof, Small Chops, Drinks Bar</small>
          </button>
        </div>
      </div>

      <div
        className="partner-hub-card"
        style={{
          background: isVenue
            ? "rgba(22, 83, 55, 0.08)"
            : isService
            ? "rgba(22, 83, 55, 0.08)"
            : "rgba(212, 175, 55, 0.08)",
          borderColor: isVenue
            ? "rgba(22, 83, 55, 0.3)"
            : isService
            ? "rgba(22, 83, 55, 0.3)"
            : "rgba(212, 175, 55, 0.3)",
        }}
      >
        <Icon name={isVenue ? "shield" : isService ? "utensils" : isEquipment ? "box" : "shield"} size={24} stroke={2} />
        <div className="stack g2" style={{ flex: 1 }}>
          <strong className="small">
            {isVenue
              ? "Verified Venue Partner Network (30-Day Free Trial)"
              : isService
              ? "Verified Vendor & Escrow Protection"
              : isEquipment
              ? "Commercial Equipment Rental Fleet"
              : "100% Anonymous & Protected Closet Sharing"}
          </strong>
          <span className="tiny muted">
            {isVenue
              ? "Receive direct WhatsApp inspection bookings and physical tour requests from wedding couples. Free 30-day launch trial (renews ₦7,500/mo, 0% commission)."
              : isService
              ? "Celebrants pay upfront into Paystack escrow. Payout is released directly to your bank after the event."
              : isEquipment
              ? "Fleet items undergo sanitization & valve inspection. Van delivery available across Lagos zones."
              : "Renters never see your personal contact details. All logistics, cleaning, and payouts are managed securely."}
          </span>
        </div>
      </div>

      <div className="field">
        <span className="label">
          {isVenue ? "5 Guided Venue Photos (High-Resolution Showcase)" : "Photos (at least 3 photos)"}
        </span>
        <div className="uploads">
          {slots.map((label, i) => (
            <div key={label} className="upload">
              {previews[i] ? (
                <>
                  <img src={previews[i]!} alt={label} />
                  <button
                    type="button"
                    className="remove"
                    aria-label={`Remove ${label} photo`}
                    onClick={() => remove(i)}
                  >
                    <Icon name="x" size={14} stroke={2.4} />
                  </button>
                </>
              ) : (
                <>
                  <Icon name="cam" size={22} />
                  {label}
                  <input
                    type="file"
                    accept="image/*"
                    aria-label={`Add ${label} photo`}
                    onChange={(e) => pick(i, e.target.files?.[0])}
                  />
                </>
              )}
            </div>
          ))}
        </div>
        <span className="hint">
          {isVenue
            ? "5 guided photos: Main hall & stage, Banquet seating, Gate & parking lot, VIP changing suite, and clean restrooms."
            : isService
            ? "Upload past event catering photos, food presentation, and uniformed serving team."
            : isEquipment
            ? "Clear photos of full equipment unit, interior/tank cleanliness, and valves/handles."
            : "Good lighting on plain background. Show flaws honestly: hub checks every item."}
        </span>
      </div>

      <div className="field">
        <label htmlFor="title">
          {isVenue
            ? "Hall / Venue Name"
            : isService
            ? "Service / Package Title"
            : isEquipment
            ? "Equipment Title"
            : isFootwear
            ? "Footwear / Shoe Title"
            : "Outfit Title"}
        </label>
        <input
          id="title"
          className="input"
          value={f.title}
          onChange={set("title")}
          maxLength={90}
          placeholder={
            isVenue
              ? "e.g. The Grand Oasis Event Center & Marquee (Egbeda)"
              : isService
              ? "e.g. Royal Owambe Party Jollof & Asun Buffet (100 Guests)"
              : isEquipment
              ? "e.g. 150L Heavy-Duty Beverage Ice Chest with Tap"
              : isFootwear
              ? "e.g. Gold Crystal Stiletto Sandals or Navy Velvet Loafers"
              : "e.g. Purple Sequin Lace Iro & Buba"
          }
        />
      </div>

      <div className="grid2">
        <div className="field">
          <label htmlFor="cat">Category</label>
          <select id="cat" className="input" value={f.category} onChange={set("category")}>
            {(listingType === "venue"
              ? VENUE_CATEGORIES
              : listingType === "equipment"
              ? EQUIPMENT_CATEGORIES
              : listingType === "service"
              ? SERVICE_CATEGORIES
              : FASHION_CATEGORIES
            ).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Capacity / Sizing */}
        {listingType === "venue" ? (
          <div className="field">
            <label htmlFor="venue_banq">Banquet Seating Capacity</label>
            <select
              id="venue_banq"
              className="input"
              value={venueBanquet}
              onChange={(e) => setVenueBanquet(e.target.value)}
            >
              {VENUE_CAPACITIES.map((cap) => (
                <option key={cap} value={cap}>
                  {cap}
                </option>
              ))}
            </select>
          </div>
        ) : listingType === "equipment" ? (
          <div className="field">
            <label htmlFor="eq_cap">Capacity & Spec</label>
            <select
              id="eq_cap"
              className="input"
              value={equipmentCapacity}
              onChange={(e) => setEquipmentCapacity(e.target.value)}
            >
              {EQUIPMENT_CAPACITIES.map((cap) => (
                <option key={cap} value={cap}>
                  {cap}
                </option>
              ))}
            </select>
          </div>
        ) : listingType === "service" ? (
          <div className="field">
            <label htmlFor="cat_cap">Guest Capacity</label>
            <select
              id="cat_cap"
              className="input"
              value={cateringCapacity}
              onChange={(e) => setCateringCapacity(e.target.value)}
            >
              {CATERING_CAPACITIES.map((cap) => (
                <option key={cap} value={cap}>
                  {cap}
                </option>
              ))}
            </select>
          </div>
        ) : !isFootwear ? (
          <div className="field">
            <label htmlFor="size">Size Label</label>
            <input
              id="size"
              className="input"
              value={f.size_label}
              onChange={set("size_label")}
              placeholder="e.g. 12–14 or L"
              maxLength={20}
            />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="shoe_size">Shoe Size (EU / UK)</label>
            <select id="shoe_size" className="input" value={shoeSize} onChange={(e) => setShoeSize(e.target.value)}>
              {EU_SHOE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isFootwear && (
        <div className="grid2">
          <div className="field">
            <label htmlFor="heel">Heel / Sole Height</label>
            <select id="heel" className="input" value={heelHeight} onChange={(e) => setHeelHeight(e.target.value)}>
              {HEEL_HEIGHTS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="style">Silhouette &amp; Style</label>
            <select id="style" className="input" value={footwearStyle} onChange={(e) => setFootwearStyle(e.target.value)}>
              {FOOTWEAR_STYLES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isVenue && (
        <div className="stack g12 box" style={{ background: "rgba(22, 83, 55, 0.04)", borderColor: "rgba(22, 83, 55, 0.2)" }}>
          <strong style={{ fontSize: 16 }}>Venue Architecture &amp; Capacity Specs</strong>

          <div className="grid2">
            <div className="field">
              <label htmlFor="v_theater">Theater / Cinema Capacity</label>
              <input
                id="v_theater"
                className="input"
                value={venueTheater}
                onChange={(e) => setVenueTheater(e.target.value)}
                placeholder="e.g. 600 Guests Theater Style"
              />
            </div>
            <div className="field">
              <label htmlFor="v_parking">Parking Capacity &amp; Security</label>
              <input
                id="v_parking"
                className="input"
                value={venueParking}
                onChange={(e) => setVenueParking(e.target.value)}
                placeholder="e.g. Secured Paved Parking (80+ Vehicles)"
              />
            </div>
          </div>

          <div className="grid2">
            <div className="field">
              <label htmlFor="v_gen">Generator &amp; Standby Power Policy</label>
              <input
                id="v_gen"
                className="input"
                value={venueGenPolicy}
                onChange={(e) => setVenueGenPolicy(e.target.value)}
                placeholder="e.g. 250kVA Standby Gen Included (8 Hours)"
              />
            </div>
            <div className="field">
              <label htmlFor="v_ac">Air Conditioning &amp; Chillers</label>
              <input
                id="v_ac"
                className="input"
                value={venueACType}
                onChange={(e) => setVenueACType(e.target.value)}
                placeholder="e.g. Full Central Chillers / 10 Standing 5HP Units"
              />
            </div>
          </div>

          <div className="grid2">
            <div className="field">
              <label htmlFor="v_addr">Exact Hall Address &amp; Landmark *</label>
              <input
                id="v_addr"
                className="input"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                placeholder="Plot 15, Egbeda-Idimu Road, Opposite Zenith Bank, Egbeda, Lagos"
              />
            </div>
            <div className="field">
              <label htmlFor="v_phone">Manager WhatsApp (for Tour Alerts) *</label>
              <input
                id="v_phone"
                type="tel"
                className="input"
                value={venueWhatsApp}
                onChange={(e) => setVenueWhatsApp(e.target.value)}
                placeholder="080 1234 5678"
              />
            </div>
          </div>

          <div className="field">
            <span className="label">Included Venue Amenities</span>
            <div className="chips" role="group">
              {VENUE_AMENITIES.map((am) => {
                const active = venueAmenities.includes(am);
                return (
                  <button
                    key={am}
                    type="button"
                    className="chip"
                    aria-pressed={active}
                    onClick={() =>
                      setVenueAmenities(active ? venueAmenities.filter((x) => x !== am) : [...venueAmenities, am])
                    }
                  >
                    {am}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="field">
        <span className="label" id="ev">
          Good for Event Types
        </span>
        <div className="chips" role="group" aria-labelledby="ev">
          {EVENTS.map((e) => (
            <button
              type="button"
              key={e}
              className="chip"
              aria-pressed={events.includes(e)}
              onClick={() =>
                setEvents(events.includes(e) ? events.filter((x) => x !== e) : [...events, e])
              }
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {needsMeasure && (
        <div className="field">
          <span className="label">Measurements in inches</span>
          <div className="grid3">
            {(["bust", "waist", "hip", "length", "sleeve"] as const).map((k) => (
              <div className="field" key={k}>
                <label htmlFor={k} className="hint" style={{ fontWeight: 500 }}>
                  {k[0].toUpperCase() + k.slice(1)}
                  {["bust", "waist", "length"].includes(k) ? " *" : ""}
                </label>
                <input id={k} className="input" inputMode="decimal" value={f[k]} onChange={set(k)} placeholder="0" />
              </div>
            ))}
          </div>
          <span className="hint">Measure the outfit lying flat, then double the bust, waist and hip numbers.</span>
        </div>
      )}

      <div className="field">
        <label htmlFor="pieces">
          {isVenue ? "Included Hall Facilities & Infrastructure *" : "What’s included in this listing"}
        </label>
        <input
          id="pieces"
          className="input"
          value={f.pieces}
          onChange={set("pieces")}
          placeholder={
            isVenue
              ? "e.g. Main Ballroom, VIP Dressing Suite, 250kVA Standby Gen, Restrooms, Secured Parking"
              : isService
              ? "e.g. Lead Chef, 2 Servers, Food Warmers, Disposable Packs & Cutlery"
              : isEquipment
              ? "e.g. Cooler Tank, Drain Plug, 2 Side Carry Handles"
              : isFootwear
              ? "e.g. Pair of Shoes, Luxury Dustbag, Spare Heel Tips"
              : "e.g. Buba, Iro, Gele"
          }
          maxLength={140}
        />
      </div>

      <div className="field">
        <label htmlFor="desc">
          {isVenue ? "Hall Specifications & Booking Policies for Celebrants *" : "Description & details for celebrants"}
        </label>
        <textarea
          id="desc"
          className="input"
          value={f.description}
          onChange={set("description")}
          maxLength={600}
          placeholder={
            isVenue
              ? "Ceiling height, acoustic treatments, stage dimensions, curfew hours, decor guidelines, caution deposit policies…"
              : isService
              ? "Menu items, dietary options, setup requirements, on-site timing…"
              : isEquipment
              ? "Tank dimensions, ice retention time, burner connection type, cleanliness condition…"
              : "Fabric, condition, designer details, how many times worn…"
          }
        />
      </div>

      <div className="grid2">
        <div className="field">
          <label htmlFor="price">
            {isVenue ? "Hall Rental Rate (Per Event Day) (₦)" : isService ? "Package Price (₦)" : "Rental Price (3 Days) (₦)"}
          </label>
          <input
            id="price"
            className="input"
            inputMode="numeric"
            value={f.price}
            onChange={set("price")}
            placeholder={isVenue ? "650000" : isService ? "150000" : isEquipment ? "12000" : "15000"}
          />
        </div>
        {!isService && !isVenue ? (
          <div className="field">
            <label htmlFor="hub">Drop-off Hub / Vendor Warehouse</label>
            <select id="hub" className="input" value={f.hub_id} onChange={set("hub_id")}>
              {hubs.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.area})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="field">
            <label>{isVenue ? "Venue Access Model" : "Service Delivery Zone"}</label>
            <input className="input" disabled value={isVenue ? "Direct Guest On-Site Arrival (No Drop-off Hub)" : "All Lagos Event Venues (On-Site)"} />
          </div>
        )}
      </div>

      <div className="band">
        <div>
          <p style={{ marginTop: 0 }}>
            {isVenue
              ? "Venue Partner Listing Model"
              : isService || isEquipment
              ? "Partner Vendor Share (80%)"
              : "Wardrobe Owner Share (70%)"}
          </p>
          <h2>
            {isVenue
              ? "30-Day Free Trial (renews ₦7,500/mo) · 0% booking commission"
              : price >= 1000
              ? `${naira(price * (isService || isEquipment ? VENDOR_SHARE : OWNER_SHARE))} per booking`
              : "Set a price to see earnings"}
          </h2>
        </div>
      </div>

      <label className="row g10 small" style={{ alignItems: "flex-start" }}>
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          style={{ width: 20, height: 20, marginTop: 2 }}
        />
        <span>
          I own or manage this {isVenue ? "event hall / marquee venue" : isService ? "catering/event service" : isEquipment ? "event equipment" : "outfit/shoes"}. I confirm details are accurate and inspection walkthroughs / reserved event dates will be honored.
        </span>
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      {status && <p className="notice" role="status">{status}</p>}
      <button className="btn block" disabled={busy}>
        {busy
          ? "Please wait…"
          : isVenue
          ? "List Event Hall / Venue"
          : isService
          ? "List Catering / Party Service"
          : isEquipment
          ? "List Event Equipment"
          : isFootwear
          ? "List Footwear"
          : "List Outfit"}
      </button>
    </form>
  );
}
