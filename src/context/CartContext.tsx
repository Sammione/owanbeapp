"use client";
import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { isValidReferralCode, normalizeReferralCode, REFERRAL_DISCOUNT_NAIRA } from "@/lib/referrals";
import { BUNDLE_DISCOUNT_PERCENT, checkCartBundleEligibility } from "@/lib/bundles";

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
  referralCode: string | null;
  referralDiscount: number;
  bundleDiscount: number;
  isBundleActive: boolean;
  totalDiscount: number;
  grandTotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  addMultipleItems: (items: (Omit<CartItem, "quantity"> & { quantity?: number })[]) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setEventDate: (date: string) => void;
  setDelivery: (delivery: boolean) => void;
  setDeliveryAddress: (address: string) => void;
  applyReferralCode: (code: string) => { success: boolean; message: string };
  removeReferralCode: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getNextSaturday(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  const day = d.getDay();
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
  const [referralCode, setReferralCodeState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount & check URL params for ?ref=
  useEffect(() => {
    try {
      const stored = localStorage.getItem("owambe_event_cart_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.items)) setItems(parsed.items);
        if (parsed.eventDate) setEventDate(parsed.eventDate);
        if (typeof parsed.delivery === "boolean") setDelivery(parsed.delivery);
        if (parsed.deliveryAddress) setDeliveryAddress(parsed.deliveryAddress);
        if (parsed.referralCode) setReferralCodeState(parsed.referralCode);
      }

      // Check URL searchParams for referral code
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get("ref");
        if (refParam) {
          const norm = normalizeReferralCode(refParam);
          setReferralCodeState(norm);
          localStorage.setItem("owambe_invite_ref", norm);
        } else {
          const storedRef = localStorage.getItem("owambe_invite_ref");
          if (storedRef && !referralCode) {
            setReferralCodeState(storedRef);
          }
        }
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
          referralCode,
        })
      );
    } catch (e) {
      console.warn("Could not save cart to localStorage", e);
    }
  }, [items, eventDate, delivery, deliveryAddress, referralCode, isLoaded]);

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

  const addMultipleItems = (newItems: (Omit<CartItem, "quantity"> & { quantity?: number })[]) => {
    setItems((prev) => {
      const updated = [...prev];
      for (const item of newItems) {
        const isHeavy = HEAVY_CATEGORIES.includes(item.category);
        const existingIdx = updated.findIndex((it) => it.id === item.id);
        const qty = Math.max(1, item.quantity || 1);
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + qty,
          };
        } else {
          updated.push({
            ...item,
            quantity: qty,
            isHeavy,
          });
        }
      }
      return updated;
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

  const applyReferralCode = (code: string) => {
    const val = isValidReferralCode(code);
    if (val.valid) {
      const norm = normalizeReferralCode(code);
      setReferralCodeState(norm);
      return { success: true, message: val.message || `₦${val.discount} referral discount applied!` };
    }
    return { success: false, message: val.message || "Invalid invite code." };
  };

  const removeReferralCode = () => {
    setReferralCodeState(null);
    try {
      localStorage.removeItem("owambe_invite_ref");
    } catch {}
  };

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

  // Bundle Discount calculation: 15% off rental hire if 2+ distinct fashion categories are bundled
  const { isBundle: isBundleActive } = useMemo(
    () => checkCartBundleEligibility(items.map((i) => i.category)),
    [items]
  );

  const bundleDiscount = useMemo(() => {
    if (!isBundleActive || rentalSubtotal <= 0) return 0;
    return Math.round((rentalSubtotal * BUNDLE_DISCOUNT_PERCENT) / 100);
  }, [isBundleActive, rentalSubtotal]);

  // Referral discount calculation: ₦500 off if referral code applied
  const referralDiscount = useMemo(() => {
    if (!referralCode) return 0;
    const res = isValidReferralCode(referralCode);
    return res.valid ? res.discount : 0;
  }, [referralCode]);

  const totalDiscount = useMemo(
    () => Math.min(rentalSubtotal, bundleDiscount + referralDiscount),
    [rentalSubtotal, bundleDiscount, referralDiscount]
  );

  const discountedRentalSubtotal = useMemo(
    () => Math.max(0, rentalSubtotal - totalDiscount),
    [rentalSubtotal, totalDiscount]
  );

  const grandTotal = useMemo(
    () => discountedRentalSubtotal + depositSubtotal + deliveryFee,
    [discountedRentalSubtotal, depositSubtotal, deliveryFee]
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
        referralCode,
        referralDiscount,
        bundleDiscount,
        isBundleActive,
        totalDiscount,
        grandTotal,
        addItem,
        addMultipleItems,
        removeItem,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        toggleCart,
        setEventDate,
        setDelivery,
        setDeliveryAddress,
        applyReferralCode,
        removeReferralCode,
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
