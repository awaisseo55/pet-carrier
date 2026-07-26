"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const freeShippingThreshold = 50;
  const remaining = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">Your Basket</h1>

      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-cream-dark/40 py-16 text-center">
          <ShoppingBag className="size-10 text-muted-foreground" />
          <p className="text-brown-soft">Your basket is empty.</p>
          <Button variant="primary" asChild>
            <Link href="/shop">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {remaining > 0 ? (
              <p className="mb-4 rounded-xl bg-sage-50 px-4 py-3 text-sm text-sage-800">
                Add {formatPrice(remaining)} more to get free UK shipping.
              </p>
            ) : (
              <p className="mb-4 rounded-xl bg-success-light px-4 py-3 text-sm text-success">
                You’ve unlocked free UK shipping.
              </p>
            )}
            <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
              {items.map((item) => (
                <li key={item.product_id} className="flex gap-4 p-4 sm:p-5">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
                    <Image src={item.image} alt={item.title} fill sizes="96px" className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <Link href={`/product/${item.slug}`} className="font-medium hover:text-primary">
                        {item.title}
                      </Link>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="text-muted-foreground hover:text-alert cursor-pointer"
                        aria-label="Remove item"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="flex size-8 items-center justify-center rounded-full border border-border hover:bg-muted cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="flex size-8 items-center justify-center rounded-full border border-border hover:bg-muted cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="h-fit rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-xl font-semibold">Order Summary</h2>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
            <Button variant="default" size="lg" className="mt-5 w-full" asChild>
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
            <Button variant="outline" size="lg" className="mt-3 w-full" asChild>
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
