"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Photo } from "@/components/Photo";
import { Icon } from "@/components/Icon";
import { useCart } from "@/context/CartContext";
import { naira } from "@/lib/format";
import { CURATED_BUNDLES, calculateBundlePricing, type BundleItem, type CuratedBundlePreset } from "@/lib/bundles";

export default function BundlesPage() {
  const { addMultipleItems } = useCart();
  const [selectedPresetId, setSelectedPresetId] = useState<string>("bundle-royal-emerald");
  const [activePreset, setActivePreset] = useState<CuratedBundlePreset>(CURATED_BUNDLES[0]);
  const [selectedSlots, setSelectedSlots] = useState<Record<string, boolean>>({
    attire: true,
    gele: true,
    beads: true,
    shoes: true,
  });
  const [added, setAdded] = useState(false);

  function handleSelectPreset(preset: CuratedBundlePreset) {
    setSelectedPresetId(preset.id);
    setActivePreset(preset);
    setSelectedSlots({ attire: true, gele: true, beads: true, shoes: true });
  }

  function toggleSlot(slot: string) {
    setSelectedSlots((prev) => ({ ...prev, [slot]: !prev[slot] }));
  }

  const selectedItems: BundleItem[] = [
    selectedSlots.attire ? activePreset.items.attire : null,
    selectedSlots.gele ? activePreset.items.gele : null,
    selectedSlots.beads ? activePreset.items.beads : null,
    selectedSlots.shoes ? activePreset.items.shoes : null,
  ].filter((x): x is BundleItem => x !== null);

  const pricing = calculateBundlePricing(selectedItems);

  function handleAddBundle() {
    addMultipleItems(
      selectedItems.map((it) => ({
        id: it.id,
        title: it.title,
        price: it.price,
        deposit: it.deposit,
        category: it.category,
        photos: it.photos,
        size_label: it.size_label,
        quantity: 1,
      }))
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="container">
      {/* Top Breadcrumb */}
      <div className="row between" style={{ alignItems: "center", marginBottom: 16 }}>
        <Link href="/" className="iconbtn" aria-label="Back to explore">
          <Icon name="back" stroke={2} />
        </Link>
        <span className="pill ok" style={{ textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 1 }}>
          ✨ Complete The Look Studio
        </span>
      </div>

      {/* Hero Header */}
      <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 24px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>Outfit Bundle Builder</h1>
        <p className="muted" style={{ fontSize: "1rem" }}>
          Never worry about mismatched colors or last-minute shoe hunting. Pair your Aso-ebi or Agbada with matching Auto-Gele, royal coral beads, and designer footwear as a <strong>15% discounted bundle</strong>.
        </p>
      </div>

      {/* Preset Selector */}
      <div className="row g10 wrap" style={{ justifyContent: "center", marginBottom: 24 }}>
        {CURATED_BUNDLES.map((bundle) => {
          const isSelected = selectedPresetId === bundle.id;
          return (
            <button
              key={bundle.id}
              type="button"
              onClick={() => handleSelectPreset(bundle)}
              style={{
                padding: "10px 18px",
                borderRadius: "var(--radius-pill)",
                border: isSelected ? "2px solid var(--accent-gold)" : "1px solid var(--border)",
                background: isSelected ? "var(--accent-gold-soft)" : "var(--bg-elevated)",
                color: isSelected ? "var(--ink)" : "var(--ink-secondary)",
                fontWeight: isSelected ? 700 : 500,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {bundle.gender === "women" ? "👑 " : "🤴 "} {bundle.title}
            </button>
          );
        })}
      </div>

      {/* Active Bundle Showcase Grid */}
      <div className="grid2" style={{ gap: 24, alignItems: "start" }}>
        {/* Left Column: 4 Bundle Slots */}
        <div className="stack g14">
          <div className="row between" style={{ alignItems: "baseline" }}>
            <h2 style={{ fontSize: "1.2rem", margin: 0 }}>4-Piece Ensemble Elements</h2>
            <span className="tiny muted">Toggle elements to customize</span>
          </div>

          {[
            { key: "attire", label: "1. Traditional Attire", item: activePreset.items.attire },
            { key: "gele", label: activePreset.gender === "women" ? "2. Auto-Gele & Headtie" : "2. Embroidered Velvet Fila", item: activePreset.items.gele },
            { key: "beads", label: "3. Royal Coral Beads & Jewelry", item: activePreset.items.beads },
            { key: "shoes", label: "4. Designer Footwear & Heels", item: activePreset.items.shoes },
          ].map(({ key, label, item }) => {
            const isChecked = selectedSlots[key];
            return (
              <div
                key={key}
                onClick={() => toggleSlot(key)}
                className="box"
                style={{
                  padding: 14,
                  borderRadius: "var(--radius-md)",
                  border: isChecked ? "1.5px solid var(--accent-gold)" : "1px solid var(--border)",
                  background: isChecked ? "var(--bg-elevated)" : "var(--bg-inset)",
                  opacity: isChecked ? 1 : 0.6,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div className="row between" style={{ alignItems: "center" }}>
                  <div className="row g12" style={{ alignItems: "center", flex: 1, minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      aria-label={`Toggle ${item.title}`}
                      style={{ width: 18, height: 18, accentColor: "var(--accent-gold)" }}
                    />
                    <Photo
                      src={item.photos?.[0]}
                      alt={item.title}
                      className="cart-item-thumb"
                      style={{ width: 56, height: 56, borderRadius: "var(--radius-sm)" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="tiny-label" style={{ color: "var(--accent-gold)", display: "block" }}>
                        {label}
                      </span>
                      <strong className="small" style={{ display: "block", marginTop: 2 }}>
                        {item.title}
                      </strong>
                      <span className="tiny muted">
                        {item.size_label || item.category}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", marginLeft: 12 }}>
                    <strong style={{ fontSize: "1rem" }}>{naira(item.price)}</strong>
                    <span className="tiny muted" style={{ display: "block" }}>+{naira(item.deposit)} dep.</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Pricing & 1-Click Booking */}
        <div
          className="box sticky-summary"
          style={{
            padding: 24,
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(26, 26, 28, 0.96) 100%)",
            borderColor: "var(--accent-gold)",
            color: "#ffffff",
          }}
        >
          <div className="row between" style={{ alignItems: "center", marginBottom: 8 }}>
            <span className="pill ok" style={{ fontSize: "0.75rem", background: "#165337", color: "#fff" }}>
              {activePreset.tag}
            </span>
            <span className="tiny" style={{ color: "rgba(255,255,255,0.7)" }}>
              {selectedItems.length} Pieces Selected
            </span>
          </div>

          <h3 style={{ fontSize: "1.3rem", margin: "8px 0 4px", color: "#ffffff" }}>
            {activePreset.title}
          </h3>
          <p className="tiny" style={{ color: "rgba(255,255,255,0.7)", margin: "0 0 16px", lineHeight: 1.5 }}>
            {activePreset.subtitle}
          </p>

          <div className="hr" style={{ borderColor: "rgba(255,255,255,0.15)", margin: "14px 0" }} />

          <div className="stack g8" style={{ fontSize: "0.9rem" }}>
            <div className="line" style={{ color: "rgba(255,255,255,0.8)" }}>
              <span>Standard Individual Hire</span>
              <span style={{ textDecoration: "line-through" }}>{naira(pricing.originalRentalTotal)}</span>
            </div>

            {pricing.discountNaira > 0 && (
              <div className="line" style={{ color: "#4ADE80", fontWeight: 700 }}>
                <span>Complete the Look Discount (15% OFF)</span>
                <span>-{naira(pricing.discountNaira)}</span>
              </div>
            )}

            <div className="line" style={{ color: "rgba(255,255,255,0.8)" }}>
              <span>Refundable Security Deposit (100% Back)</span>
              <span>{naira(pricing.totalDeposit)}</span>
            </div>

            <div className="hr" style={{ borderColor: "rgba(255,255,255,0.15)", margin: "8px 0" }} />

            <div className="line" style={{ fontSize: "1.15rem", color: "#ffffff" }}>
              <strong>Grand Total Due Now</strong>
              <strong style={{ color: "#D4AF37", fontSize: "1.3rem" }}>{naira(pricing.grandBundleTotal)}</strong>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              type="button"
              onClick={handleAddBundle}
              className="btn block"
              disabled={selectedItems.length === 0}
              style={{
                height: 50,
                background: "linear-gradient(90deg, #D4AF37 0%, #B89728 100%)",
                color: "#111",
                fontWeight: 800,
                fontSize: "1rem",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {added ? (
                <>✔ Complete Look Added to Basket!</>
              ) : (
                <>✨ Add Complete Look to Basket ({selectedItems.length} Pieces) →</>
              )}
            </button>
            <span
              className="tiny"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: 8,
                color: "rgba(255,255,255,0.65)",
              }}
            >
              Instant reservation · Pre-sanitized and ready for your celebration
            </span>
          </div>

          <div className="stack g6" style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
            <div className="row g6 tiny" style={{ color: "rgba(255,255,255,0.8)" }}>
              <span style={{ color: "#4ADE80" }}>✔</span>
              <span>All 4 elements color-matched by professional owambe stylists</span>
            </div>
            <div className="row g6 tiny" style={{ color: "rgba(255,255,255,0.8)" }}>
              <span style={{ color: "#4ADE80" }}>✔</span>
              <span>Hospital-grade dry cleaned &amp; boxed together</span>
            </div>
            <div className="row g6 tiny" style={{ color: "rgba(255,255,255,0.8)" }}>
              <span style={{ color: "#4ADE80" }}>✔</span>
              <span>Consolidated single delivery fee across all 4 items</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
