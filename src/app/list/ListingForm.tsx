"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, EVENTS, OWNER_SHARE } from "@/lib/constants";
import { naira } from "@/lib/format";
import type { Hub } from "@/lib/types";
import { Icon } from "@/components/Icon";

const SLOTS = ["Front", "Back", "Fabric close-up", "Inside label", "Any flaws"];
const NO_MEASURE = ["Gele", "Beads & jewelry", "Accessories"];

/** Shrinks a photo to max 1400px wide JPEG so uploads are fast on mobile data. */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Could not read photo"))), "image/jpeg", 0.82));
}

export function ListingForm({ userId, hubs, defaultArea }: { userId: string; hubs: Hub[]; defaultArea: string | null }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<(File | null)[]>(SLOTS.map(() => null));
  const [previews, setPreviews] = useState<(string | null)[]>(SLOTS.map(() => null));
  const [f, setF] = useState({
    title: "", category: CATEGORIES[0] as string, size_label: "", pieces: "", description: "", price: "",
    bust: "", waist: "", hip: "", length: "", sleeve: "",
    hub_id: hubs.find((h) => h.area === defaultArea)?.id ?? hubs[0]?.id ?? "",
  });
  const [events, setEvents] = useState<string[]>(["Wedding"]);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const price = parseInt(f.price.replace(/\D/g, "")) || 0;
  const needsMeasure = !NO_MEASURE.includes(f.category);

  function pick(i: number, file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose a photo."); return; }
    const p = [...photos]; p[i] = file; setPhotos(p);
    const v = [...previews]; if (v[i]) URL.revokeObjectURL(v[i]!); v[i] = URL.createObjectURL(file); setPreviews(v);
  }
  function remove(i: number) {
    const p = [...photos]; p[i] = null; setPhotos(p);
    const v = [...previews]; if (v[i]) URL.revokeObjectURL(v[i]!); v[i] = null; setPreviews(v);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const chosen = photos.filter(Boolean) as File[];
    if (f.title.trim().length < 3) return setError("Give your outfit a short name.");
    if (chosen.length < 3) return setError("Add at least 3 photos: front, back and a fabric close-up.");
    if (!events.length) return setError("Pick at least one event it suits.");
    if (price < 1000) return setError("Set a price of at least ₦1,000 per rental.");
    if (needsMeasure && (!f.bust || !f.waist || !f.length)) return setError("Add at least bust, waist and length so renters know it will fit.");
    if (!f.hub_id) return setError("Choose the hub where you’ll drop it off.");
    if (!agree) return setError("Please confirm you own this outfit.");

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
      const { error } = await supabase.from("items").insert({
        owner_id: userId,
        hub_id: f.hub_id,
        title: f.title.trim(),
        description: f.description.trim() || null,
        category: f.category,
        events,
        size_label: f.size_label.trim() || null,
        pieces: f.pieces.trim() || null,
        bust: num(f.bust), waist: num(f.waist), hip: num(f.hip), length: num(f.length), sleeve: num(f.sleeve),
        price,
        photos: urls,
      });
      if (error) throw error;
      router.push("/me?tab=listings&listed=1");
      router.refresh();
    } catch (err) {
      setStatus("");
      setError(err instanceof Error ? err.message : "Upload failed. Check your connection and try again.");
    }
  }

  const busy = !!status;

  return (
    <form onSubmit={submit} className="stack g16">
      <div className="field">
        <span className="label">Photos (at least 3)</span>
        <div className="uploads">
          {SLOTS.map((label, i) => (
            <div key={label} className="upload">
              {previews[i] ? (
                <>
                  <img src={previews[i]!} alt={label} />
                  <button type="button" className="remove" aria-label={`Remove ${label} photo`} onClick={() => remove(i)}><Icon name="x" size={14} stroke={2.4} /></button>
                </>
              ) : (
                <>
                  <Icon name="cam" size={22} />
                  {label}
                  <input type="file" accept="image/*" aria-label={`Add ${label} photo`} onChange={(e) => pick(i, e.target.files?.[0])} />
                </>
              )}
            </div>
          ))}
        </div>
        <span className="hint">Good light, plain background. Show flaws honestly: our hub checks every item anyway.</span>
      </div>

      <div className="field">
        <label htmlFor="title">What is it?</label>
        <input id="title" className="input" value={f.title} onChange={set("title")} maxLength={90} placeholder="e.g. Purple sequin lace iro & buba" />
      </div>

      <div className="grid2">
        <div className="field">
          <label htmlFor="cat">Category</label>
          <select id="cat" className="input" value={f.category} onChange={set("category")}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="size">Size</label>
          <input id="size" className="input" value={f.size_label} onChange={set("size_label")} placeholder="e.g. 12–14 or L" maxLength={20} />
        </div>
      </div>

      <div className="field">
        <span className="label" id="ev">Good for</span>
        <div className="chips" role="group" aria-labelledby="ev">
          {EVENTS.map((e) => (
            <button type="button" key={e} className="chip" aria-pressed={events.includes(e)}
              onClick={() => setEvents(events.includes(e) ? events.filter((x) => x !== e) : [...events, e])}>{e}</button>
          ))}
        </div>
      </div>

      {needsMeasure && (
        <div className="field">
          <span className="label">Measurements in inches</span>
          <div className="grid3">
            {(["bust", "waist", "hip", "length", "sleeve"] as const).map((k) => (
              <div className="field" key={k}>
                <label htmlFor={k} className="hint" style={{ fontWeight: 500 }}>{k[0].toUpperCase() + k.slice(1)}{["bust", "waist", "length"].includes(k) ? " *" : ""}</label>
                <input id={k} className="input" inputMode="decimal" value={f[k]} onChange={set(k)} placeholder="0" />
              </div>
            ))}
          </div>
          <span className="hint">Measure the outfit lying flat, then double the bust, waist and hip numbers.</span>
        </div>
      )}

      <div className="field">
        <label htmlFor="pieces">What’s included</label>
        <input id="pieces" className="input" value={f.pieces} onChange={set("pieces")} placeholder="e.g. Buba, iro, gele" maxLength={120} />
      </div>

      <div className="field">
        <label htmlFor="desc">Anything renters should know</label>
        <textarea id="desc" className="input" value={f.description} onChange={set("description")} maxLength={600} placeholder="Fit, fabric, how many times it’s been worn…" />
      </div>

      <div className="grid2">
        <div className="field">
          <label htmlFor="price">Price per rental (₦)</label>
          <input id="price" className="input" inputMode="numeric" value={f.price} onChange={set("price")} placeholder="15000" />
        </div>
        <div className="field">
          <label htmlFor="hub">Drop-off hub</label>
          <select id="hub" className="input" value={f.hub_id} onChange={set("hub_id")}>
            {hubs.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
      </div>

      <div className="band">
        <div>
          <p style={{ marginTop: 0 }}>You earn 70% of every rental</p>
          <h2>{price >= 1000 ? `${naira(price * OWNER_SHARE)} per rental` : "Set a price to see"}</h2>
        </div>
      </div>

      <label className="row g10 small" style={{ alignItems: "flex-start" }}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ width: 20, height: 20, marginTop: 2 }} />
        <span>I own this outfit and it’s mine to rent out. I understand the hub will check and grade it before it goes live, and payouts happen after each clean return.</span>
      </label>

      {error && <p className="error" role="alert">{error}</p>}
      {status && <p className="notice" role="status">{status}</p>}
      <button className="btn block" disabled={busy}>{busy ? "Please wait…" : "List my outfit"}</button>
    </form>
  );
}
