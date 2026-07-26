"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const FREE_SHIPPING_THRESHOLD = 50;
const STANDARD_SHIPPING = 3.99;

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [loading, setLoading] = React.useState(false);
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD || items.length === 0 ? 0 : STANDARD_SHIPPING;
  const total = subtotal + shippingCost;

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
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

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl font-semibold">Your basket is empty</h1>
        <p className="mt-3 text-brown-soft">Add a few carriers to your basket before checking out.</p>
        <Button variant="primary" className="mt-6" asChild>
          <Link href="/shop">Browse the shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">Checkout</h1>
      <p className="mt-2 text-brown-soft">
        Review your order below, then continue to our secure Stripe checkout to pay.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <ul className="flex flex-col divide-y divide-border">
          {items.map((item) => (
            <li key={item.product_id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
                <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
              </div>
              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-foreground">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <Button
        size="lg"
        variant="default"
        className="mt-6 w-full"
        onClick={handleCheckout}
        disabled={loading}
      >
        <Lock className="size-4" />
        {loading ? "Redirecting to secure checkout..." : "Continue to Secure Payment"}
      </Button>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <ShieldCheck className="size-4" />
        Payments are securely processed by Stripe. We never see or store your card details.
      </p>
    </div>
  );
}
