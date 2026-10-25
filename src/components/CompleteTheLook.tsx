"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Photo } from "@/components/Photo";
import { Icon } from "@/components/Icon";
import { useCart } from "@/context/CartContext";
import { naira } from "@/lib/format";
import { calculateBundlePricing, type BundleItem } from "@/lib/bundles";

// Curated complementary accessory pairings
const COMPLEMENTARY_ITEMS: Record<string, BundleItem[]> = {
  women: [
    {
      id: "gele-champagne-auto",
      title: "Champagne Gold Pleated Auto-Gele & Bridal Fan",
      category: "Gele",
      price: 10000,
      deposit: 8000,
      photos: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80"],
      size_label: "Pre-tied Velcro",
      slot: "gele",
    },
    {
      id: "beads-benin-coral-collar",
      title: "Benin Royal Coral Bead Collar & Earring Set",
      category: "Beads & jewelry",
      price: 15000,
      deposit: 15000,
      photos: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80"],
      size_label: "Multi-tier Collar",
      slot: "beads",
    },
    {
      id: "shoes-ivory-bridal-pumps",
      title: "Crystal Embellished Ivory Satin Bridal Pumps",
      category: "Shoes & Footwear",
      price: 18000,
      deposit: 25000,
      photos: ["/images/shoes_bridal_heels.jpg"],
      size_label: "EU 38 (UK 5)",
      slot: "shoes",
    },
  ],
  men: [
    {
      id: "cap-velvet-fila-crest",
      title: "Embroidered Gold Crest Velvet Fila Cap",
      category: "Gele",
      price: 6000,
      deposit: 5000,
      photos: ["https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=800&q=80"],
      size_label: "Size 22.5″",
      slot: "gele",
    },
    {
      id: "beads-chieftaincy-rope",
      title: "Heavy Benin Chieftaincy Coral Bead Rope & Bracelet",
      category: "Beads & jewelry",
      price: 12000,
      deposit: 15000,
      photos: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80"],
      size_label: "Heavy Gauge",
      slot: "beads",
    },
    {
      id: "shoes-navy-velvet-loafers",
      title: "Royal Navy Velvet Loafers with Gold Tassel",
      category: "Shoes & Footwear",
      price: 22000,
      deposit: 25000,
      photos: ["/images/shoes_velvet_loafers.jpg"],
      size_label: "EU 44 (UK 10)",
      slot: "shoes",
    },
  ],
};

export function CompleteTheLook({
  currentItem,
}: {
  currentItem: {
    id: string;
    title: string;
    category: string;
    price: number;
    deposit: number;
    photos: string[];
    size_label?: string | null;
  };
}) {
  const { addMultipleItems } = useCart();
  const isMen = currentItem.category === "Agbada" || currentItem.title.toLowerCase().includes("agbada") || currentItem.title.toLowerCase().includes("men");
  const accessories = isMen ? COMPLEMENTARY_ITEMS.men : COMPLEMENTARY_ITEMS.women;

  // Track which accessories are selected
  const [selectedIds, setSelectedIds] = useState<string[]>(accessories.map((a) => a.id));
  const [added, setAdded] = useState(false);

  // Build current attire bundle item
  const attireBundleItem: BundleItem = {
    id: currentItem.id,
    title: currentItem.title,
    category: currentItem.category,
    price: currentItem.price,
    deposit: currentItem.deposit,
    photos: currentItem.photos,
    size_label: currentItem.size_label,
    slot: "attire",
  };

  const activeBundleItems: BundleItem[] = [
    attireBundleItem,
    ...accessories.filter((a) => selectedIds.includes(a.id)),
  ];

  const pricing = calculateBundlePricing(activeBundleItems);

  function toggleItem(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleAddBundleToBasket() {
    addMultipleItems(
      activeBundleItems.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        deposit: item.deposit,
        category: item.category,
        photos: item.photos,
        size_label: item.size_label,
        quantity: 1,
      }))
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div
      className="complete-the-look-card box"
      style={{
        marginTop: 20,
        padding: "18px 20px",
        background: "linear-gradient(135deg, rgba(212, 175, 55, 0.09) 0%, rgba(22, 83, 55, 0.08) 100%)",
        borderColor: "rgba(212, 175, 55, 0.35)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      {/* Header */}
      <div className="row between" style={{ alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div className="row g6" style={{ alignItems: "center" }}>
            <span style={{ fontSize: "1.2rem" }}>✨</span>
            <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: 700 }}>
              Complete the Look — Bundle &amp; Save 15%
            </h3>
          </div>
          <p className="tiny muted" style={{ margin: "4px 0 0" }}>
            Pair this {currentItem.category} with matching headwear, coral beads, and designer footwear for a cohesive owambe appearance.
          </p>
        </div>
        <span className="pill ok" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
          15% Bundle Discount
        </span>
      </div>

      {/* Outfit Slots List */}
      <div className="stack g10" style={{ margin: "14px 0" }}>
        {/* Slot 1: Current Main Outfit */}
        <div
          className="row between"
          style={{
            alignItems: "center",
            padding: "8px 12px",
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="row g10" style={{ alignItems: "center" }}>
            <span style={{ color: "var(--grade-a)", fontWeight: 700 }}>✔</span>
            <Photo src={currentItem.photos?.[0]} alt={currentItem.title} className="cart-item-thumb" style={{ width: 44, height: 44 }} />
            <div>
              <strong className="small" style={{ display: "block" }}>{currentItem.title}</strong>
              <span className="tiny muted">{currentItem.category} (Main Attire)</span>
            </div>
          </div>
          <span className="small" style={{ fontWeight: 700 }}>{naira(currentItem.price)}</span>
        </div>

        {/* Slot 2, 3, 4: Matching Accessories */}
        {accessories.map((acc) => {
          const isSelected = selectedIds.includes(acc.id);
          return (
            <div
              key={acc.id}
              onClick={() => toggleItem(acc.id)}
              className="row between"
              style={{
                alignItems: "center",
                padding: "8px 12px",
                background: isSelected ? "var(--bg-elevated)" : "var(--bg-inset)",
                borderRadius: "var(--radius-md)",
                border: isSelected ? "1px solid rgba(22, 83, 55, 0.3)" : "1px solid var(--border)",
                cursor: "pointer",
                opacity: isSelected ? 1 : 0.65,
                transition: "all 0.15s ease",
              }}
            >
              <div className="row g10" style={{ alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  aria-label={`Select ${acc.title}`}
                  style={{ width: 16, height: 16, accentColor: "var(--grade-a)" }}
                />
                <Photo src={acc.photos?.[0]} alt={acc.title} className="cart-item-thumb" style={{ width: 44, height: 44 }} />
                <div>
                  <strong className="small" style={{ display: "block" }}>{acc.title}</strong>
                  <span className="tiny muted">{acc.category} {acc.size_label ? `· ${acc.size_label}` : ""}</span>
                </div>
              </div>
              <span className="small" style={{ fontWeight: 700 }}>+{naira(acc.price)}</span>
            </div>
          );
        })}
      </div>

      {/* Pricing Summary */}
      <div
        className="box"
        style={{
          background: "var(--bg-elevated)",
          padding: "12px 14px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="line" style={{ fontSize: "0.88rem" }}>
          <span>Individual Total ({pricing.itemCount} items)</span>
          <span className="muted" style={{ textDecoration: "line-through" }}>{naira(pricing.originalRentalTotal)}</span>
        </div>
        {pricing.discountNaira > 0 && (
          <div className="line" style={{ color: "var(--grade-a)", fontWeight: 600, fontSize: "0.88rem" }}>
            <span>Bundle Special (15% OFF)</span>
            <span>-{naira(pricing.discountNaira)}</span>
          </div>
        )}
        <div className="hr" style={{ margin: "6px 0" }} />
        <div className="line" style={{ fontSize: "1rem" }}>
          <strong>Complete Look Total</strong>
          <strong style={{ color: "var(--ink)", fontSize: "1.1rem" }}>{naira(pricing.discountedRentalTotal)}</strong>
        </div>
      </div>

      {/* 1-Click Action */}
      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={handleAddBundleToBasket}
          className="btn block"
          style={{
            height: 46,
            background: "var(--ink)",
            color: "#fff",
            fontSize: "0.92rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {added ? (
            <>✔ Complete Look Added to Basket!</>
          ) : (
            <>✨ Add Complete Look to Basket ({pricing.itemCount} Items · {naira(pricing.discountedRentalTotal)}) →</>
          )}
        </button>
        <span className="tiny muted" style={{ display: "block", textAlign: "center", marginTop: 6 }}>
          {pricing.savingsText} · 100% refundable deposits held in escrow
        </span>
      </div>
    </div>
  );
}
