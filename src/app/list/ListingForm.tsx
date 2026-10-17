"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORIES,
  FASHION_CATEGORIES,
  EQUIPMENT_CATEGORIES,
  SERVICE_CATEGORIES,
  EQUIPMENT_CAPACITIES,
  CATERING_CAPACITIES,
  EVENTS,
  OWNER_SHARE,
  VENDOR_SHARE,
  EU_SHOE_SIZES,
  HEEL_HEIGHTS,
  FOOTWEAR_STYLES,
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
}: {
  userId: string;
  hubs: Hub[];
  defaultArea: string | null;
}) {
  const router = useRouter();
  const [listingType, setListingType] = useState<"fashion" | "equipment" | "service">("fashion");

  const [f, setF] = useState({
    title: "",
    category: FASHION_CATEGORIES[0] as string,
    size_label: "",
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

  const slots = isService
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

  const [photos, setPhotos] = useState<(File | null)[]>(GARMENT_SLOTS.map(() => null));
  const [previews, setPreviews] = useState<(string | null)[]>(GARMENT_SLOTS.map(() => null));
  const [events, setEvents] = useState<string[]>(["Wedding"]);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  function onSwitchType(type: "fashion" | "equipment" | "service") {
    setListingType(type);
    if (type === "fashion") {
      setF((prev) => ({ ...prev, category: FASHION_CATEGORIES[0] }));
    } else if (type === "equipment") {
      setF((prev) => ({ ...prev, category: EQUIPMENT_CATEGORIES[0], size_label: EQUIPMENT_CAPACITIES[0] }));
    } else {
      setF((prev) => ({ ...prev, category: SERVICE_CATEGORIES[0], size_label: CATERING_CAPACITIES[1] }));
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
    if (!f.hub_id && !isService) return setError("Choose your neighborhood drop-off hub.");
    if (!agree) return setError("Please confirm you own or operate this service/equipment.");

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
      }

      const { error } = await supabase.from("items").insert({
        owner_id: userId,
        hub_id: f.hub_id || null,
        title: f.title.trim(),
        description: f.description.trim() || null,
        category: f.category,
        events,
        size_label: computedSize,
        pieces: computedPieces,
        bust: isFootwear || isEquipment || isService ? null : num(f.bust),
        waist: isFootwear || isEquipment || isService ? null : num(f.waist),
        hip: isFootwear || isEquipment || isService ? null : num(f.hip),
        length: isFootwear || isEquipment || isService ? null : num(f.length),
        sleeve: isFootwear || isEquipment || isService ? null : num(f.sleeve),
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
      {/* 3-Pillar Listing Type Switcher */}
      <div className="field">
        <span className="label">What are you listing on Owambe Closet?</span>
        <div className="seg" role="group" aria-label="Listing Category Type">
          <button
            type="button"
            aria-pressed={listingType === "fashion"}
            onClick={() => onSwitchType("fashion")}
          >
            <strong>Attire &amp; Footwear</strong>
            <small>Aso-ebi, Agbada, Gele, Heels</small>
          </button>
          <button
            type="button"
            aria-pressed={listingType === "equipment"}
            onClick={() => onSwitchType("equipment")}
          >
            <strong>Event Equipment</strong>
            <small>Coolers, Pots, Warmers, Chairs</small>
          </button>
          <button
            type="button"
            aria-pressed={listingType === "service"}
            onClick={() => onSwitchType("service")}
          >
            <strong>Catering &amp; Hospitality</strong>
            <small>Party Jollof, Small Chops, Bar, Ushers</small>
          </button>
        </div>
      </div>

      <div
        className="partner-hub-card"
        style={{
          background: isService
            ? "rgba(22, 83, 55, 0.08)"
            : "rgba(212, 175, 55, 0.08)",
          borderColor: isService
            ? "rgba(22, 83, 55, 0.3)"
            : "rgba(212, 175, 55, 0.3)",
        }}
      >
        <Icon name={isService ? "utensils" : isEquipment ? "box" : "shield"} size={24} stroke={2} />
        <div className="stack g2" style={{ flex: 1 }}>
          <strong className="small">
            {isService
              ? "Verified Vendor & Escrow Protection"
              : isEquipment
              ? "Commercial Equipment Rental Fleet"
              : "100% Anonymous & Protected Closet Sharing"}
          </strong>
          <span className="tiny muted">
            {isService
              ? "Celebrants pay upfront into Paystack escrow. Payout is released directly to your bank after the event."
              : isEquipment
              ? "Fleet items undergo sanitization & valve inspection. Van delivery available across Lagos zones."
              : "Renters never see your personal contact details. All logistics, cleaning, and payouts are managed securely."}
          </span>
        </div>
      </div>

      <div className="field">
        <span className="label">Photos (at least 3 photos)</span>
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
          {isService
            ? "Upload past event catering photos, food presentation, and uniformed serving team."
            : isEquipment
            ? "Clear photos of full equipment unit, interior/tank cleanliness, and valves/handles."
            : "Good lighting on plain background. Show flaws honestly: hub checks every item."}
        </span>
      </div>

      <div className="field">
        <label htmlFor="title">
          {isService
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
            isService
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
            {(listingType === "equipment"
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
        {listingType === "equipment" ? (
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
            <label htmlFor="style">Silhouette & Style</label>
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
        <label htmlFor="pieces">What’s included in this listing</label>
        <input
          id="pieces"
          className="input"
          value={f.pieces}
          onChange={set("pieces")}
          placeholder={
            isService
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
        <label htmlFor="desc">Description & details for celebrants</label>
        <textarea
          id="desc"
          className="input"
          value={f.description}
          onChange={set("description")}
          maxLength={600}
          placeholder={
            isService
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
            {isService ? "Package Price (₦)" : "Rental Price (3 Days) (₦)"}
          </label>
          <input
            id="price"
            className="input"
            inputMode="numeric"
            value={f.price}
            onChange={set("price")}
            placeholder={isService ? "150000" : isEquipment ? "12000" : "15000"}
          />
        </div>
        {!isService ? (
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
            <label>Service Delivery Zone</label>
            <input className="input" disabled value="All Lagos Event Venues (On-Site)" />
          </div>
        )}
      </div>

      <div className="band">
        <div>
          <p style={{ marginTop: 0 }}>
            {isService || isEquipment ? "Partner Vendor Share (80%)" : "Wardrobe Owner Share (70%)"}
          </p>
          <h2>
            {price >= 1000
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
          I own or am licensed to supply this {isService ? "catering/event service" : isEquipment ? "event equipment" : "outfit/shoes"}. I understand payouts happen after verified event completion or clean return.
        </span>
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      {status && <p className="notice" role="status">{status}</p>}
      <button className="btn block" disabled={busy}>
        {busy
          ? "Please wait…"
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
