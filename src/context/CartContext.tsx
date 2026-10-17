"use client";
import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  deposit: number;
  category: string;
  photos: string[];
  size_label?: string | null;
  pieces?: string | null;
  hub_area?: string | null;
  quantity: number;
  isHeavy?: boolean;
};

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  eventDate: string;
  delivery: boolean;
  deliveryAddress: string;
  itemCount: number;
  rentalSubtotal: number;
  depositSubtotal: number;
  hasHeavyEquipment: boolean;
  deliveryFee: number;
  grandTotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setEventDate: (date: string) => void;
  setDelivery: (delivery: boolean) => void;
  setDeliveryAddress: (address: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getNextSaturday(): string {
  const d = new Date();
  // We want at least 3 days ahead
  d.setDate(d.getDate() + 3);
  const day = d.getDay();
  // Saturday is day 6
  const diff = (6 - day + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

const HEAVY_CATEGORIES = [
  "Coolers & Ice Chests",
  "Cooking Pots & Burners",
  "Canopies, Tables & Chairs",
  "Generators & Sound Systems",
  "Chafing Dishes & Food Warmers",
];

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [eventDate, setEventDate] = useState<string>(getNextSaturday);
  const [delivery, setDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("owambe_event_cart_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.items)) setItems(parsed.items);
        if (parsed.eventDate) setEventDate(parsed.eventDate);
        if (typeof parsed.delivery === "boolean") setDelivery(parsed.delivery);
        if (parsed.deliveryAddress) setDeliveryAddress(parsed.deliveryAddress);
      }
    } catch (e) {
      console.warn("Could not load cart from localStorage", e);
    }
    setIsLoaded(true);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        "owambe_event_cart_v1",
        JSON.stringify({
          items,
          eventDate,
          delivery,
          deliveryAddress,
        })
      );
    } catch (e) {
      console.warn("Could not save cart to localStorage", e);
    }
  }, [items, eventDate, delivery, deliveryAddress, isLoaded]);

  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    const isHeavy = HEAVY_CATEGORIES.includes(item.category);
    setItems((prev) => {
      const existing = prev.find((it) => it.id === item.id);
      if (existing) {
        return prev.map((it) =>
          it.id === item.id ? { ...it, quantity: it.quantity + quantity } : it
        );
      }
      return [...prev, { ...item, quantity: Math.max(1, quantity), isHeavy }];
    });
    setIsOpen(true);
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, quantity } : it))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  // Computed properties
  const itemCount = useMemo(
    () => items.reduce((sum, it) => sum + (it.quantity || 1), 0),
    [items]
  );

  const rentalSubtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.price * (it.quantity || 1), 0),
    [items]
  );

  const depositSubtotal = useMemo(
    () => items.reduce((sum, it) => sum + (it.deposit || 0) * (it.quantity || 1), 0),
    [items]
  );

  const hasHeavyEquipment = useMemo(
    () => items.some((it) => it.isHeavy || HEAVY_CATEGORIES.includes(it.category)),
    [items]
  );

  const deliveryFee = useMemo(() => {
    if (!delivery) return 0;
    return hasHeavyEquipment ? 8000 : 2500;
  }, [delivery, hasHeavyEquipment]);

  const grandTotal = useMemo(
    () => rentalSubtotal + depositSubtotal + deliveryFee,
    [rentalSubtotal, depositSubtotal, deliveryFee]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        eventDate,
        delivery,
        deliveryAddress,
        itemCount,
        rentalSubtotal,
        depositSubtotal,
        hasHeavyEquipment,
        deliveryFee,
        grandTotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
        setEventDate,
        setDelivery,
        setDeliveryAddress,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
