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
    grandTotal,
    clearCart,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
              Bundle your traditional attire with matching designer footwear, coolers, or party pots for one seamless celebration booking.
            </p>
            <button
              type="button"
              className="btn small"
              onClick={closeCart}
              style={{ marginTop: 12 }}
            >
              Browse Event Essentials
            </button>
          </div>
        ) : (
          <>
            <div className="cart-content-scroll">
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

            {/* Error Message */}
            {error && (
              <p className="error small" role="alert" style={{ margin: "8px 0" }}>
                {error}
              </p>
            )}

            {/* Cost Breakdown */}
            <div className="cart-summary-card">
              <div className="line">
                <span>Rental Hire Total</span>
                <strong>{naira(rentalSubtotal)}</strong>
              </div>
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
