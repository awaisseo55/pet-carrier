"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShieldCheck, ShoppingBag, Tag, Truck, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { usePublicSettings } from "@/components/cart/use-public-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

function estimatedDeliveryRange(): string {
  const start = new Date();
  start.setDate(start.getDate() + 3);
  const end = new Date();
  end.setDate(end.getDate() + 5);
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} to ${fmt(end)}`;
}

export default function CartPage() {
  const {
    activeItems,
    savedItems,
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
  const discount = coupon?.discountAmount || 0;
  const vatBase = Math.max(0, subtotal - discount);
  const vat = Math.round(vatBase * (settings.vat_rate / (100 + settings.vat_rate)) * 100) / 100;

  function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (couponInput.trim()) applyCoupon(couponInput.trim());
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-ink sm:text-4xl">Your Basket</h1>

      {activeItems.length === 0 && savedItems.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-gray-50 py-16 text-center">
          <ShoppingBag className="size-10 text-gray-400" />
          <p className="text-gray-500">Your basket is empty.</p>
          <Button variant="primary" asChild>
            <Link href="/carriers">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {activeItems.length > 0 && (
              <>
                {remaining > 0 ? (
                  <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Add {formatPrice(remaining)} more to get free UK shipping.
                  </p>
                ) : (
                  <p className="mb-4 rounded-lg bg-success-light px-4 py-3 text-sm text-success">
                    You’ve unlocked free UK shipping.
                  </p>
                )}
                <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
                  {activeItems.map((item) => (
                    <li key={`${item.product_id}-${item.variant_sku ?? ""}`} className="flex gap-4 p-4 sm:p-5">
                      <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <Image src={item.image} alt={item.title} fill sizes="96px" className="object-cover" />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link href={`/product/${item.slug}`} className="font-medium hover:text-blue-700">
                              {item.title}
                            </Link>
                            {item.variant_label && (
                              <p className="text-sm text-gray-500">{item.variant_label}</p>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.product_id, item.variant_sku)}
                            className="text-gray-500 hover:text-alert cursor-pointer"
                            aria-label="Remove item"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_sku)}
                                className="flex size-8 items-center justify-center rounded-full border border-border hover:bg-gray-50 cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="size-3.5" />
                              </button>
                              <span className="w-6 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_sku)}
                                className="flex size-8 items-center justify-center rounded-full border border-border hover:bg-gray-50 cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                            <button
                              onClick={() => toggleSaveForLater(item.product_id, item.variant_sku)}
                              className="text-xs text-gray-500 underline hover:text-ink cursor-pointer"
                            >
                              Save for later
                            </button>
                          </div>
                          <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-gray-500">
                  Estimated delivery: <span className="font-medium text-ink">{estimatedDeliveryRange()}</span> with
                  standard shipping.
                </p>
              </>
            )}

            {savedItems.length > 0 && (
              <div className="mt-10">
                <h2 className="font-heading text-lg font-semibold text-ink">Saved for Later ({savedItems.length})</h2>
                <ul className="mt-3 flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
                  {savedItems.map((item) => (
                    <li key={`${item.product_id}-${item.variant_sku ?? ""}`} className="flex gap-4 p-4">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="flex flex-1 items-center justify-between">
                        <div>
                          <Link href={`/product/${item.slug}`} className="text-sm font-medium hover:text-blue-700">
                            {item.title}
                          </Link>
                          {item.variant_label && <p className="text-xs text-gray-500">{item.variant_label}</p>}
                          <p className="text-sm text-gray-500">{formatPrice(item.price)}</p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => toggleSaveForLater(item.product_id, item.variant_sku)}
                            className="text-xs font-medium text-blue-700 underline cursor-pointer"
                          >
                            Move to basket
                          </button>
                          <button
                            onClick={() => removeItem(item.product_id, item.variant_sku)}
                            className="text-xs text-gray-500 underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-10">
              <h2 className="font-heading text-lg font-semibold text-ink">Frequently Bought Together</h2>
              <p className="mt-2 text-sm text-gray-500">
                We’ll show suggestions here once we have more products in the shop.
              </p>
            </div>
          </div>

          {activeItems.length > 0 && (
            <div className="h-fit rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="font-heading text-xl font-semibold">Order Summary</h2>

              <form onSubmit={handleApplyCoupon} className="mt-4 flex flex-col gap-1.5">
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

              <div className="mt-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Estimated shipping</span>
                  <span>{remaining === 0 ? "Free" : formatPrice(settings.standard_shipping_cost)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Includes VAT ({settings.vat_rate}%)</span>
                  <span>{formatPrice(vat)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-ink">
                  <span>Total</span>
                  <span>
                    {formatPrice(
                      Math.max(0, subtotal - discount) + (remaining === 0 ? 0 : settings.standard_shipping_cost)
                    )}
                  </span>
                </div>
              </div>

              <Button variant="default" size="lg" className="mt-5 w-full" asChild>
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
              <Button variant="outline" size="lg" className="mt-3 w-full" asChild>
                <Link href="/carriers">Continue Shopping</Link>
              </Button>

              <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-blue-600" />
                  Secure checkout
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="size-4 text-blue-600" />
                  Free UK shipping over £70
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
