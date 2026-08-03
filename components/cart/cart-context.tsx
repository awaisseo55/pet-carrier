"use client";

import * as React from "react";
import type { CartItem } from "@/lib/types";

interface AppliedCoupon {
  code: string;
  discountAmount: number;
}

interface CartContextValue {
  items: CartItem[];
  activeItems: CartItem[];
  savedItems: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, variantSku?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantSku?: string) => void;
  toggleSaveForLater: (productId: string, variantSku?: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  coupon: AppliedCoupon | null;
  couponError: string | null;
  applyingCoupon: boolean;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
}

const CartContext = React.createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "pet-carrier-cart";
const COUPON_STORAGE_KEY = "pet-carrier-coupon";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const [coupon, setCoupon] = React.useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = React.useState(false);

  React.useEffect(() => {
    // One-off hydration from localStorage on mount, browser storage isn't
    // available during SSR so this can't be a lazy useState initializer.
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setItems(JSON.parse(stored));
      const storedCoupon = window.localStorage.getItem(COUPON_STORAGE_KEY);
      if (storedCoupon) setCoupon(JSON.parse(storedCoupon));
    } catch {
      // ignore malformed cart data
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (coupon) window.localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
    else window.localStorage.removeItem(COUPON_STORAGE_KEY);
  }, [coupon, hydrated]);

  // A cart line's real identity is product_id + variant_sku (undefined
  // variant_sku on both sides counts as a match), so two variants of the
  // same product stay as separate lines rather than merging quantities.
  const isSameLine = React.useCallback(
    (item: Pick<CartItem, "product_id" | "variant_sku">, productId: string, variantSku?: string) =>
      item.product_id === productId && (item.variant_sku ?? undefined) === (variantSku ?? undefined),
    []
  );

  const addItem = React.useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => isSameLine(i, item.product_id, item.variant_sku));
        if (existing) {
          return prev.map((i) =>
            isSameLine(i, item.product_id, item.variant_sku)
              ? { ...i, quantity: i.quantity + quantity, saved_for_later: false }
              : i
          );
        }
        return [...prev, { ...item, quantity }];
      });
      setIsOpen(true);
    },
    [isSameLine]
  );

  const removeItem = React.useCallback(
    (productId: string, variantSku?: string) => {
      setItems((prev) => prev.filter((i) => !isSameLine(i, productId, variantSku)));
    },
    [isSameLine]
  );

  const updateQuantity = React.useCallback(
    (productId: string, quantity: number, variantSku?: string) => {
      setItems((prev) => {
        if (quantity <= 0) return prev.filter((i) => !isSameLine(i, productId, variantSku));
        return prev.map((i) => (isSameLine(i, productId, variantSku) ? { ...i, quantity } : i));
      });
    },
    [isSameLine]
  );

  const toggleSaveForLater = React.useCallback(
    (productId: string, variantSku?: string) => {
      setItems((prev) =>
        prev.map((i) => (isSameLine(i, productId, variantSku) ? { ...i, saved_for_later: !i.saved_for_later } : i))
      );
    },
    [isSameLine]
  );

  const clearCart = React.useCallback(() => {
    setItems([]);
    setCoupon(null);
    setCouponError(null);
  }, []);

  const activeItems = items.filter((i) => !i.saved_for_later);
  const savedItems = items.filter((i) => i.saved_for_later);

  const itemCount = activeItems.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = activeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const applyCoupon = React.useCallback(
    async (code: string) => {
      setApplyingCoupon(true);
      setCouponError(null);
      try {
        const res = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, subtotal }),
        });
        const data = await res.json();
        if (!data.valid) {
          setCouponError(data.error || "That code isn't valid.");
          setCoupon(null);
        } else {
          setCoupon({ code: code.toUpperCase(), discountAmount: data.discountAmount });
        }
      } catch {
        setCouponError("Could not check that code, please try again.");
      } finally {
        setApplyingCoupon(false);
      }
    },
    [subtotal]
  );

  const removeCoupon = React.useCallback(() => {
    setCoupon(null);
    setCouponError(null);
  }, []);

  const value: CartContextValue = {
    items,
    activeItems,
    savedItems,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem,
    removeItem,
    updateQuantity,
    toggleSaveForLater,
    clearCart,
    itemCount,
    subtotal,
    coupon,
    couponError,
    applyingCoupon,
    applyCoupon,
    removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
