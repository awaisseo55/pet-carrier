"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Tag, X } from "lucide-react";
import { useCart } from "./cart-context";
import { usePublicSettings } from "./use-public-settings";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const {
    activeItems,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    toggleSaveForLater,
    subtotal,
    coupon,
    couponError,
    applyingCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const settings = usePublicSettings();
  const [couponInput, setCouponInput] = React.useState("");

  const remaining = Math.max(0, settings.free_shipping_threshold - subtotal);
  const progress = Math.min(100, (subtotal / settings.free_shipping_threshold) * 100);

  function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (couponInput.trim()) applyCoupon(couponInput.trim());
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-blue-600" />
            Your basket
          </SheetTitle>
        </SheetHeader>

        {activeItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag className="size-10 text-gray-400" />
            <p className="text-gray-500">Your basket is empty.</p>
            <Button variant="primary" onClick={closeCart} asChild>
              <Link href="/carriers">Start shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="mb-4">
              {remaining > 0 ? (
                <p className="text-xs text-gray-500">
                  Add <span className="font-medium text-ink">{formatPrice(remaining)}</span> more for free UK
                  shipping
                </p>
              ) : (
                <p className="text-xs font-medium text-emerald-700">You’ve unlocked free UK shipping!</p>
              )}
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <ul className="flex flex-col gap-4">
              {activeItems.map((item) => (
                <li key={`${item.product_id}-${item.variant_sku ?? ""}`} className="flex gap-3">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={closeCart}
                      className="text-sm font-medium leading-snug hover:text-blue-700"
                    >
                      {item.title}
                    </Link>
                    {item.variant_label && <span className="text-xs text-gray-500">{item.variant_label}</span>}
                    <span className="text-sm text-gray-500">{formatPrice(item.price)}</span>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_sku)}
                          className="flex size-7 items-center justify-center rounded-full border border-border hover:bg-gray-50 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_sku)}
                          className="flex size-7 items-center justify-center rounded-full border border-border hover:bg-gray-50 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => toggleSaveForLater(item.product_id, item.variant_sku)}
                        className="text-xs text-gray-500 underline hover:text-ink cursor-pointer"
                      >
                        Save for later
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.product_id, item.variant_sku)}
                    className="self-start text-gray-500 hover:text-alert cursor-pointer"
                    aria-label="Remove item"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeItems.length > 0 && (
          <SheetFooter className="border-t border-border">
            <form onSubmit={handleApplyCoupon} className="flex flex-col gap-1.5">
              {coupon ? (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <Tag className="size-3.5" />
                    {coupon.code} applied
                  </span>
                  <button onClick={removeCoupon} className="text-xs text-gray-500 underline cursor-pointer">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Promo code"
                    className="h-9 text-sm"
                  />
                  <Button type="submit" variant="outline" size="sm" disabled={applyingCoupon}>
                    Apply
                  </Button>
                </div>
              )}
              {couponError && <p className="text-xs text-alert">{couponError}</p>}
            </form>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {coupon && (
              <div className="flex items-center justify-between text-sm text-emerald-700">
                <span>Discount</span>
                <span>-{formatPrice(coupon.discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-base font-semibold text-ink">
              <span>Total</span>
              <span>{formatPrice(Math.max(0, subtotal - (coupon?.discountAmount || 0)))}</span>
            </div>
            <p className="text-xs text-gray-500">Shipping and VAT calculated at checkout.</p>
            <Button variant="default" size="lg" className="w-full" asChild onClick={closeCart}>
              <Link href="/checkout">Checkout</Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full" asChild onClick={closeCart}>
              <Link href="/cart">View basket</Link>
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
