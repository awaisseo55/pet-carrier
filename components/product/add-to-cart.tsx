"use client";

import * as React from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

export function AddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = React.useState(1);
  const outOfStock = product.stock_status === "out_of_stock";

  function handleAdd() {
    addItem(
      {
        product_id: product.id,
        slug: product.slug,
        title: product.title,
        image: product.images[0],
        price: product.price,
        stock_status: product.stock_status,
      },
      quantity
    );
    toast.success(`${product.title} added to your basket`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="flex items-center rounded-full border border-border">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="flex size-11 items-center justify-center rounded-full hover:bg-muted cursor-pointer"
          aria-label="Decrease quantity"
        >
          <Minus className="size-4" />
        </button>
        <span className="w-8 text-center font-medium">{quantity}</span>
        <button
          onClick={() => setQuantity((q) => q + 1)}
          className="flex size-11 items-center justify-center rounded-full hover:bg-muted cursor-pointer"
          aria-label="Increase quantity"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <Button size="lg" variant="default" className="flex-1" onClick={handleAdd} disabled={outOfStock}>
        <ShoppingBag className="size-4" />
        {outOfStock ? "Out of Stock" : "Add to Basket"}
      </Button>
    </div>
  );
}
