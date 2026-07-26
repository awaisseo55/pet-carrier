"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart } from "./cart-context";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" />
            Your basket
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">Your basket is empty.</p>
            <Button variant="primary" onClick={closeCart} asChild>
              <Link href="/shop">Start shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item.product_id} className="flex gap-3">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-cream-dark">
                    <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={closeCart}
                      className="text-sm font-medium leading-snug hover:text-primary"
                    >
                      {item.title}
                    </Link>
                    <span className="text-sm text-muted-foreground">{formatPrice(item.price)}</span>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="flex size-7 items-center justify-center rounded-full border border-border hover:bg-muted cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="flex size-7 items-center justify-center rounded-full border border-border hover:bg-muted cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="self-start text-muted-foreground hover:text-alert cursor-pointer"
                    aria-label="Remove item"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {items.length > 0 && (
          <SheetFooter className="border-t border-border">
            <div className="flex items-center justify-between text-base font-medium">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
            <Button variant="default" size="lg" className="w-full" asChild onClick={closeCart}>
              <Link href="/cart">View basket</Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full" asChild onClick={closeCart}>
              <Link href="/checkout">Checkout</Link>
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
