"use client";
import React from "react";
import { useCart } from "@/context/CartContext";
import { Icon } from "@/components/Icon";

export function CartButton({ className = "" }: { className?: string }) {
  const { toggleCart, itemCount } = useCart();

  return (
    <button
      type="button"
      onClick={toggleCart}
      className={`cart-trigger-btn ${className}`}
      aria-label={`View Event Basket (${itemCount} items)`}
    >
      <Icon name="bag" size={18} stroke={2} />
      <span className="cart-trigger-label">Basket</span>
      {itemCount > 0 && (
        <span className="cart-badge-count">{itemCount}</span>
      )}
    </button>
  );
}
