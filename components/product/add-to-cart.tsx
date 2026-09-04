"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";
import type { PublicProduct, PublicProductVariant } from "@/lib/types";
import { variantLabel } from "@/lib/variants";
import { toast } from "sonner";

interface AddToCartProps {
  product: PublicProduct;
  /** Currently selected variant, or null if the product has variants but none is chosen yet. */
  selectedVariant?: PublicProductVariant | null;
}

export function AddToCart({ product, selectedVariant = null }: AddToCartProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = React.useState(1);
  const [justAdded, setJustAdded] = React.useState(false);

  const requiresVariant = !!product.hasVariants;
  const missingSelection = requiresVariant && !selectedVariant;
  const outOfStock = selectedVariant ? !selectedVariant.inStock : product.stock_status === "out_of_stock";
  const disabled = missingSelection || outOfStock;

  function handleAdd() {
    const price = selectedVariant ? selectedVariant.price : product.price;
    const image = selectedVariant?.colourImage || product.images[0];

    addItem(
      {
        product_id: product.id,
        slug: product.slug,
        title: product.title,
        image,
        price,
        stock_status: selectedVariant ? (selectedVariant.inStock ? "in_stock" : "out_of_stock") : product.stock_status,
        variant_sku: selectedVariant?.sku,
        variant_label: selectedVariant ? variantLabel(selectedVariant) : undefined,
      },
      quantity
    );
    toast.success(`${product.title} added to your basket`);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  function buttonLabel() {
    if (missingSelection) {
      if (product.variantType === "colour") return "Select a colour";
      if (product.variantType === "size") return "Select a size";
      return "Select options";
    }
    if (outOfStock) return "Out of Stock";
    if (justAdded) return "Added";
    return "Add to Basket";
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-13 shrink-0 items-center justify-between rounded-full border border-border">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="flex size-13 shrink-0 items-center justify-center rounded-full hover:bg-muted cursor-pointer"
          aria-label="Decrease quantity"
        >
          <Minus className="size-4" />
        </button>
        <span className="w-6 text-center font-medium tabular-nums">{quantity}</span>
        <button
          onClick={() => setQuantity((q) => q + 1)}
          className="flex size-13 shrink-0 items-center justify-center rounded-full hover:bg-muted cursor-pointer"
          aria-label="Increase quantity"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <Button size="lg" variant="default" className="flex-1" onClick={handleAdd} disabled={disabled}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={justAdded ? "added" : "default"}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            {justAdded ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}
            {buttonLabel()}
          </motion.span>
        </AnimatePresence>
      </Button>
    </div>
  );
}
