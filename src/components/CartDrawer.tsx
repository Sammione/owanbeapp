"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Icon } from "@/components/Icon";
import { Photo } from "@/components/Photo";
import { naira, niceDate } from "@/lib/format";

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    itemCount,
    eventDate,
    setEventDate,
    delivery,
    setDelivery,
    deliveryAddress,
    setDeliveryAddress,
    rentalSubtotal,
    depositSubtotal,
    deliveryFee,
    hasHeavyEquipment,
    referralCode,
    referralDiscount,
    bundleDiscount,
    isBundleActive,
    totalDiscount,
    grandTotal,
    applyReferralCode,
    removeReferralCode,
    clearCart,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  if (!isOpen) return null;

  function handleApplyPromo(e: React.FormEvent) {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyReferralCode(promoInput);
    if (res.success) {
      setPromoMessage({ text: res.message, type: "ok" });
      setPromoInput("");
    } else {
      setPromoMessage({ text: res.message, type: "err" });
    }
  }

  async function handleCheckout() {
    setError(null);
    if (!eventDate) {
      setError("Please select your celebration/event date.");
      return;
    }
    if (delivery && (!deliveryAddress || deliveryAddress.trim().length < 8)) {
      setError("Please enter your complete delivery address in Lagos.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/paystack/initialize-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((it) => ({
            id: it.id,
            quantity: it.quantity,
          })),
          eventDate,
          delivery,
          deliveryAddress,
          referralCode: referralCode || undefined,
          bundleDiscount,
          totalDiscount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          closeCart();
          router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        throw new Error(data.error || "Unable to proceed to Paystack.");
      }

      if (data.url) {
        clearCart();
        window.location.href = data.url;
      } else {
        throw new Error("No payment link returned.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cart-backdrop" onClick={closeCart} role="dialog" aria-modal="true" aria-label="Event Basket">
      <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
        {/* Cart Header */}
        <div className="cart-header">
          <div className="row g8" style={{ alignItems: "center" }}>
            <Icon name="bag" size={20} stroke={2} />
            <h2 style={{ fontSize: "1.15rem", margin: 0, fontWeight: 700 }}>
              Event Basket ({itemCount})
            </h2>
          </div>
          <button
            type="button"
            className="iconbtn"
            onClick={closeCart}
            aria-label="Close basket"
            style={{ width: 36, height: 36 }}
          >
            <Icon name="x" size={18} stroke={2} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty-state">
            <div className="cart-empty-icon">
              <Icon name="bag" size={40} stroke={1.5} />
            </div>
            <h3>Your Event Basket is Empty</h3>
            <p className="muted small">
              Bundle your traditional attire with matching designer footwear, auto-gele, or party pots for one seamless celebration booking.
            </p>
            <Link
              href="/bundles"
              className="btn small"
              onClick={closeCart}
              style={{ marginTop: 12, display: "inline-block" }}
            >
              ✨ Try Outfit Bundle Builder (15% Off)
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-content-scroll">
              {/* Bundle Promotion Callout */}
              {isBundleActive ? (
                <div
                  className="box"
                  style={{
                    background: "rgba(22, 83, 55, 0.09)",
                    borderColor: "rgba(22, 83, 55, 0.35)",
                    padding: "10px 12px",
                    marginBottom: 12,
                  }}
                >
                  <div className="row g6" style={{ alignItems: "center" }}>
                    <span style={{ color: "var(--grade-a)", fontSize: "1.1rem" }}>✨</span>
                    <strong style={{ color: "var(--grade-a)", fontSize: "0.86rem" }}>
                      Complete the Look Bundle Active!
                    </strong>
                  </div>
                  <span className="tiny muted" style={{ display: "block", marginTop: 2 }}>
                    You’re pairing multiple outfit pieces together — <strong>15% bundle discount ({naira(bundleDiscount)})</strong> has been applied to your hire!
                  </span>
                </div>
              ) : (
                <div
                  className="box"
                  style={{
                    background: "rgba(212, 175, 55, 0.08)",
                    borderColor: "rgba(212, 175, 55, 0.25)",
                    padding: "8px 12px",
                    marginBottom: 12,
                  }}
                >
                  <div className="row between" style={{ alignItems: "center" }}>
                    <span className="tiny" style={{ color: "var(--ink)" }}>
                      💡 Pair <strong>Attire + Gele + Shoes</strong> to get <strong>15% off</strong>
                    </span>
                    <Link
                      href="/bundles"
                      onClick={closeCart}
                      className="tiny"
                      style={{ color: "var(--accent-gold)", fontWeight: 700 }}
                    >
                      Bundle &amp; Save →
                    </Link>
                  </div>
                </div>
              )}

              {/* Event Date Selector Card */}
              <div className="cart-date-card">
                <div className="row between" style={{ alignItems: "center", marginBottom: 6 }}>
                  <span className="tiny-label">Celebration / Party Date *</span>
                  <span className="tiny muted">{niceDate(eventDate)}</span>
                </div>
                <input
                  type="date"
                  className="input small"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  min={new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)}
                  max={new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10)}
                  required
                />
                <span className="hint" style={{ marginTop: 4, display: "block", fontSize: "0.75rem" }}>
                  All items in this basket will be reserved and pre-sanitized for this date.
                </span>
              </div>

              {/* Items List */}
              <div className="cart-items-list">
                {items.map((item) => (
                  <div key={item.id} className="cart-item-row">
                    <Photo
                      src={item.photos?.[0]}
                      alt={item.title}
                      className="cart-item-thumb"
                    />
                    <div className="cart-item-info">
                      <div className="row between" style={{ alignItems: "flex-start", gap: 6 }}>
                        <Link
                          href={`/items/${item.id}`}
                          onClick={closeCart}
                          className="cart-item-title"
                        >
                          {item.title}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="cart-remove-btn"
                          aria-label={`Remove ${item.title}`}
                        >
                          <Icon name="x" size={14} stroke={2} />
                        </button>
                      </div>

                      <div className="row g6 wrap" style={{ margin: "4px 0" }}>
                        {item.size_label && (
                          <span className="pill small">{item.size_label}</span>
                        )}
                        <span className="tiny muted">{item.category}</span>
                      </div>

                      <div className="row between" style={{ alignItems: "center", marginTop: 6 }}>
                        <div>
                          <strong className="cart-item-price">
                            {naira(item.price * item.quantity)}
                          </strong>
                          {item.deposit > 0 && (
                            <span className="tiny muted" style={{ display: "block" }}>
                              +{naira(item.deposit * item.quantity)} deposit
                            </span>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="cart-qty-controls">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Logistics Option */}
              <div className="cart-logistics-box">
                <span className="tiny-label" style={{ marginBottom: 8, display: "block" }}>
                  Handover &amp; Logistics
                </span>
                <div className="seg" role="group" aria-label="Logistics Mode">
                  <button
                    type="button"
                    aria-pressed={!delivery}
                    onClick={() => setDelivery(false)}
                  >
                    <strong>Hub Pickup (Free)</strong>
                    <small>Collect at neighborhood partner hub</small>
                  </button>
                  <button
                    type="button"
                    aria-pressed={delivery}
                    onClick={() => setDelivery(true)}
                  >
                    <strong>
                      {hasHeavyEquipment ? "Van Dispatch (₦8,000)" : "Bike Dispatch (₦2,500)"}
                    </strong>
                    <small>
                      {hasHeavyEquipment
                        ? "Heavy van for coolers/pots"
                        : "Direct doorstep delivery"}
                    </small>
                  </button>
                </div>

                {delivery && (
                  <div className="field" style={{ marginTop: 10 }}>
                    <label htmlFor="cart-address" className="tiny muted">
                      Delivery Address in Lagos *
                    </label>
                    <textarea
                      id="cart-address"
                      className="input small"
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Street address, building, landmark, area (e.g. 14 Akowonjo Road, Egbeda)"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Referral / Promo Code Box */}
              <div className="cart-promo-box" style={{ marginTop: 12, padding: "10px 12px", background: "var(--bg-inset)", borderRadius: "var(--radius-md)" }}>
                <span className="tiny-label" style={{ display: "block", marginBottom: 6 }}>
                  Referral / Invite Code (₦500 Off)
                </span>
                {referralCode ? (
                  <div className="row between" style={{ alignItems: "center", background: "rgba(22, 83, 55, 0.12)", border: "1px solid rgba(22, 83, 55, 0.3)", borderRadius: "var(--radius-sm)", padding: "6px 10px" }}>
                    <div className="row g6" style={{ alignItems: "center" }}>
                      <span style={{ color: "var(--grade-a)" }}>✔</span>
                      <span className="small">
                        Code <strong>{referralCode}</strong> applied (-{naira(referralDiscount)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeReferralCode}
                      className="tiny muted"
                      style={{ background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="row g6">
                    <input
                      type="text"
                      className="input small"
                      placeholder="e.g. FIT-KEMI or OWANBEFIT"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      style={{ flex: 1, textTransform: "uppercase" }}
                    />
                    <button type="submit" className="btn small" style={{ whiteSpace: "nowrap" }}>
                      Apply
                    </button>
                  </form>
                )}
                {promoMessage && (
                  <span
                    className="tiny"
                    style={{
                      display: "block",
                      marginTop: 4,
                      color: promoMessage.type === "ok" ? "var(--grade-a)" : "var(--bad)",
                    }}
                  >
                    {promoMessage.text}
                  </span>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <p className="error small" role="alert" style={{ margin: "8px 0" }}>
                  {error}
                </p>
              )}

              {/* Cost Breakdown */}
              <div className="cart-summary-card" style={{ marginTop: 14 }}>
                <div className="line">
                  <span>Rental Hire Subtotal</span>
                  <strong>{naira(rentalSubtotal)}</strong>
                </div>

                {bundleDiscount > 0 && (
                  <div className="line" style={{ color: "var(--grade-a)" }}>
                    <span>Complete the Look Bundle (15% Off)</span>
                    <strong>-{naira(bundleDiscount)}</strong>
                  </div>
                )}

                {referralDiscount > 0 && (
                  <div className="line" style={{ color: "var(--grade-a)" }}>
                    <span>Referral / Invite Discount</span>
                    <strong>-{naira(referralDiscount)}</strong>
                  </div>
                )}

                <div className="line">
                  <span>Refundable Security Deposit</span>
                  <strong style={{ color: "var(--grade-a)" }}>{naira(depositSubtotal)}</strong>
                </div>
                <div className="line muted tiny" style={{ paddingLeft: 8 }}>
                  <span className="row g4" style={{ alignItems: "center" }}>
                    <Icon name="check" size={12} stroke={2.5} />
                    <span>100% returned within 24h after clean return</span>
                  </span>
                </div>
                <div className="line">
                  <span>Delivery Logistics</span>
                  <span>{delivery ? naira(deliveryFee) : "Free (Hub Pickup)"}</span>
                </div>
                <div className="hr" style={{ margin: "8px 0" }} />
                <div className="line" style={{ fontSize: "1.05rem" }}>
                  <strong>Grand Total Due Now</strong>
                  <strong style={{ color: "var(--ink)" }}>{naira(grandTotal)}</strong>
                </div>
              </div>
            </div>

            {/* Pinned Checkout Action */}
            <div className="cart-pinned-footer">
              <button
                type="button"
                className="btn block"
                disabled={loading}
                onClick={handleCheckout}
                style={{ height: 48, fontSize: "0.95rem", width: "100%" }}
              >
                {loading
                  ? "Securing Paystack Session…"
                  : `Pay with Paystack (${naira(grandTotal)}) →`}
              </button>
              <span className="tiny muted" style={{ textAlign: "center", display: "block", marginTop: 6, fontSize: "0.76rem" }}>
                Payments &amp; deposit escrow held securely by Paystack
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
