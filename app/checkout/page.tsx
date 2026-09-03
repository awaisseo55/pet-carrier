"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Lock, Mail, RotateCcw, ShieldCheck, Tag, Truck } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { usePublicSettings } from "@/components/cart/use-public-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PaymentBadges } from "@/components/checkout/payment-badges";
import { formatPrice } from "@/lib/utils";
import { DELIVERY_OPTIONS } from "@/lib/constants";
import { toast } from "sonner";

const CHECKOUT_STEPS = ["Basket", "Checkout", "Payment"];
const CURRENT_STEP_INDEX = 1;

function CheckoutProgress() {
  return (
    <ol className="mt-4 flex items-center gap-1.5 sm:gap-2">
      {CHECKOUT_STEPS.map((step, i) => (
        <li key={step} className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold sm:size-6 sm:text-xs ${
              i < CURRENT_STEP_INDEX
                ? "bg-success text-white"
                : i === CURRENT_STEP_INDEX
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            {i < CURRENT_STEP_INDEX ? <Check className="size-3" strokeWidth={3} /> : i + 1}
          </span>
          <span
            className={`text-xs font-medium sm:text-sm ${
              i === CURRENT_STEP_INDEX ? "text-ink" : i < CURRENT_STEP_INDEX ? "text-gray-500" : "text-gray-400"
            }`}
          >
            {step}
          </span>
          {i < CHECKOUT_STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-border sm:w-10" />}
        </li>
      ))}
    </ol>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-ink">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}

export default function CheckoutPage() {
  const { activeItems, subtotal, coupon, couponError, applyingCoupon, applyCoupon, removeCoupon } = useCart();
  const settings = usePublicSettings();
  const [loading, setLoading] = React.useState(false);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");

  const [line1, setLine1] = React.useState("");
  const [line2, setLine2] = React.useState("");
  const [city, setCity] = React.useState("");
  const [county, setCounty] = React.useState("");
  const [postcode, setPostcode] = React.useState("");
  const country = "GB";
  const [instructions, setInstructions] = React.useState("");

  const [couponInput, setCouponInput] = React.useState("");
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [createAccount, setCreateAccount] = React.useState(false);
  const [password, setPassword] = React.useState("");

  const deliveryOption = DELIVERY_OPTIONS[0].value;
  const discount = coupon?.discountAmount || 0;
  const shippingCost = subtotal >= settings.free_shipping_threshold ? 0 : settings.standard_shipping_cost;
  const total = Math.max(0, subtotal - discount) + shippingCost;
  const itemCount = activeItems.reduce((sum, item) => sum + item.quantity, 0);

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
      if (createAccount && password) {
        const registerRes = await fetch("/api/account/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: `${firstName} ${lastName}`.trim(), email, password }),
        });
        if (!registerRes.ok) {
          const data = await registerRes.json();
          toast.error(data.error || "Could not create your account, continuing as guest.");
        }
      }

      // Only trusted line references go to the server, price/title/image are
      // never sent, the server looks those up itself from the product
      // catalogue so nothing here can be tampered with in the browser.
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
          customer: { firstName, lastName, email, phone },
          address: { line1, line2, city, county, postcode, country, instructions },
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
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-ink sm:text-4xl">Checkout</h1>
          <CheckoutProgress />
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
          <Lock className="size-4 text-success" />
          Secure checkout
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-8">
          <section className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-7">
            <SectionHeading title="Your Details" />
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={createAccount} onCheckedChange={(c) => setCreateAccount(!!c)} />
                Create an account for faster future checkout
              </label>
              {createAccount && (
                <div className="mt-3 max-w-xs">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    minLength={8}
                    required={createAccount}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500">No account required, you can also check out as a guest.</p>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-7">
            <SectionHeading title="Delivery Address" subtitle="We currently deliver within the UK only." />
            <div className="mt-5 grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="line1">Address line 1</Label>
                <Input id="line1" required value={line1} onChange={(e) => setLine1(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="line2">Address line 2 (optional)</Label>
                <Input id="line2" value={line2} onChange={(e) => setLine2(e.target.value)} className="mt-1.5" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="city">Town / City</Label>
                  <Input id="city" required value={city} onChange={(e) => setCity(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="county">County</Label>
                  <Input id="county" value={county} onChange={(e) => setCounty(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input id="postcode" required value={postcode} onChange={(e) => setPostcode(e.target.value)} className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label htmlFor="instructions">Delivery instructions (optional)</Label>
                <textarea
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  className="mt-1.5 w-full rounded-lg border border-input bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border-2 border-blue-600 bg-blue-50/50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                  <Check className="size-3 text-white" strokeWidth={3} />
                </span>
                <Truck className="size-5 shrink-0 text-blue-700" />
                <div>
                  <p className="text-sm font-medium text-ink">{DELIVERY_OPTIONS[0].label}</p>
                  <p className="text-xs text-gray-500">{DELIVERY_OPTIONS[0].eta}</p>
                </div>
              </div>
              <span className="font-semibold text-ink">{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-7">
            <SectionHeading title="Payment" />

            <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2 font-medium text-ink">
                <Lock className="size-4" />
                Pay securely by card via Stripe
              </div>
              <p className="mt-1 text-sm text-gray-500">
                You’ll be redirected to our secure Stripe checkout to enter your card details.
              </p>
              <PaymentBadges className="mt-3" />
            </div>

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

            <div className="mt-6 border-t border-border pt-5">
              <label className="flex items-start gap-2 text-sm cursor-pointer">
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

              <Button type="submit" size="lg" variant="default" className="mt-5 w-full" disabled={loading}>
                <Lock className="size-4" />
                {loading ? "Redirecting to secure payment..." : "Continue to Payment"}
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
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-ink">Order Summary</h2>
            <span className="text-xs text-gray-500">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="mt-4 flex flex-col divide-y divide-border">
            {activeItems.map((item) => (
              <li key={item.product_id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
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

          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
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
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-base font-semibold text-ink">Total</span>
            <span className="text-lg font-bold text-ink">{formatPrice(total)}</span>
          </div>

          <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 shrink-0 text-blue-600" />
              Secure checkout, your details are encrypted
            </div>
            <div className="flex items-center gap-2">
              <Truck className="size-3.5 shrink-0 text-blue-600" />
              Free UK shipping over {formatPrice(settings.free_shipping_threshold)}
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="size-3.5 shrink-0 text-blue-600" />
              14-day returns on every order
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
