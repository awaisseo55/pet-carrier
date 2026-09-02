"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Lock, Mail, ShieldCheck, Tag, Truck } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { usePublicSettings } from "@/components/cart/use-public-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPrice } from "@/lib/utils";
import { DELIVERY_OPTIONS } from "@/lib/constants";
import type { DeliveryOption } from "@/lib/types";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { activeItems, subtotal, coupon, couponError, applyingCoupon, applyCoupon, removeCoupon } = useCart();
  const settings = usePublicSettings();
  const [loading, setLoading] = React.useState(false);

  const [deliveryOption, setDeliveryOption] = React.useState<DeliveryOption>("standard");
  const [couponInput, setCouponInput] = React.useState("");
  const [termsAccepted, setTermsAccepted] = React.useState(false);

  const discount = coupon?.discountAmount || 0;
  const deliveryPrices: Record<DeliveryOption, number> = {
    standard: subtotal >= settings.free_shipping_threshold ? 0 : settings.standard_shipping_cost,
    express: settings.express_shipping_cost,
    next_day: settings.next_day_shipping_cost,
  };
  const shippingCost = deliveryPrices[deliveryOption];
  const vatBase = Math.max(0, subtotal - discount);
  const vat = Math.round(vatBase * (settings.vat_rate / (100 + settings.vat_rate)) * 100) / 100;
  const total = Math.max(0, subtotal - discount) + shippingCost;

  function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (couponInput.trim()) applyCoupon(couponInput.trim());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error("Please accept the Terms and Conditions to continue.");
      return;
    }

    setLoading(true);
    try {
      // Only trusted line references go to the server, price/title/image are
      // never sent, the server looks those up itself from the product
      // catalogue so nothing here can be tampered with in the browser. Name,
      // email, phone and delivery address are collected on Stripe's own
      // hosted checkout page next, not here.
      const lines = activeItems.map((item) => ({
        product_id: item.product_id,
        variant_sku: item.variant_sku,
        quantity: item.quantity,
      }));

      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines,
          deliveryOption,
          couponCode: coupon?.code,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Checkout is not available yet. Please try again soon.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Something went wrong starting checkout. Please try again.");
      setLoading(false);
    }
  }

  if (activeItems.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl font-semibold">Your basket is empty</h1>
        <p className="mt-3 text-gray-500">Add a few items to your basket before checking out.</p>
        <Button variant="primary" className="mt-6" asChild>
          <Link href="/carriers">Browse the shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-ink sm:text-4xl">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-8">
          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-ink">1. Delivery Options</h2>
            <div className="mt-4 flex flex-col gap-3">
              {DELIVERY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-4 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="delivery"
                      checked={deliveryOption === option.value}
                      onChange={() => setDeliveryOption(option.value)}
                      className="size-4 accent-blue-600"
                    />
                    <div>
                      <p className="font-medium text-ink">{option.label}</p>
                      <p className="text-xs text-gray-500">{option.eta}</p>
                    </div>
                  </div>
                  <span className="font-medium text-ink">
                    {deliveryPrices[option.value] === 0 ? "Free" : formatPrice(deliveryPrices[option.value])}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-ink">2. Payment</h2>
            <p className="mt-2 text-sm text-gray-500">
              You’ll be redirected to our secure Stripe checkout to enter your name, delivery address and card
              details.
            </p>

            <div className="mt-4">
              <Label>Promo code</Label>
              {coupon ? (
                <div className="mt-1.5 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <Tag className="size-3.5" />
                    {coupon.code} applied
                  </span>
                  <button type="button" onClick={removeCoupon} className="text-xs text-gray-500 underline cursor-pointer">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="mt-1.5 flex gap-2">
                  <Input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code"
                    className="h-10"
                  />
                  <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={applyingCoupon}>
                    Apply
                  </Button>
                </div>
              )}
              {couponError && <p className="mt-1 text-xs text-alert">{couponError}</p>}
            </div>

            <label className="mt-5 flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox checked={termsAccepted} onCheckedChange={(c) => setTermsAccepted(!!c)} className="mt-0.5" />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="text-blue-700 underline" target="_blank">
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-700 underline" target="_blank">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <Button type="submit" size="lg" variant="default" className="mt-6 w-full" disabled={loading}>
              <Lock className="size-4" />
              {loading ? "Redirecting to secure payment..." : `Continue to Payment - ${formatPrice(total)}`}
            </Button>

            <div className="mt-4 flex flex-col gap-1.5 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-3.5" />
                Payments are securely processed by Stripe, we never see or store your card details.
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-3.5" />
                hello@pet-carrier.co.uk
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24">
          <h2 className="font-heading text-lg font-semibold text-ink">Order Summary</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {activeItems.map((item) => (
              <li key={item.product_id} className="flex items-center gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  <Image src={item.image} alt={item.title} fill sizes="56px" className="object-cover" />
                  <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-white">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-snug">{item.title}</p>
                </div>
                <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-sm">
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
              <span className="text-gray-500">Shipping</span>
              <span>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Includes VAT ({settings.vat_rate}%)</span>
              <span>{formatPrice(vat)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-ink">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
            <Truck className="size-3.5 shrink-0" />
            Free UK shipping on standard delivery over {formatPrice(settings.free_shipping_threshold)}
          </div>
        </aside>
      </form>
    </div>
  );
}
