"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/cart/cart-context";
import { RatingSummary } from "@/components/product/rating-summary";
import { cn, formatPrice } from "@/lib/utils";
import { PRODUCT_PLACEHOLDER } from "@/lib/constants";
import type { PublicProduct } from "@/lib/types";
import { toast } from "sonner";

export function ProductCard({ product, className }: { product: PublicProduct; className?: string }) {
  const { addItem } = useCart();
  const image = product.images[0] || PRODUCT_PLACEHOLDER;
  const hoverImage = product.images[1];
  const [justAdded, setJustAdded] = React.useState(false);
  const outOfStock = product.stock_status === "out_of_stock";
  const saving = product.compare_at_price ? product.compare_at_price - product.price : 0;

  function handleAdd() {
    addItem({
      product_id: product.id,
      slug: product.slug,
      title: product.title,
      image,
      price: product.price,
      stock_status: product.stock_status,
    });
    toast.success(`${product.title} added to your basket`);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  }

  return (
    // The card is a plain element with a stretched link over the image and
    // text, so the quick-add control can be a real sibling <button>. It used
    // to be a <button> nested inside the card's <a>, which is invalid HTML
    // and only worked because of stopPropagation.
    <div
      className={cn(
        "group relative flex flex-col transition-transform duration-300 hover:-translate-y-1.5",
        className
      )}
    >
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[1.5rem] bg-gray-50">
        <Image
          src={image}
          alt={product.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className={cn(
            "object-contain p-6 transition-all duration-500 group-hover:scale-[1.06]",
            // Cross-fades to the second photo on hover when the product has
            // one: the cheapest way to make a catalogue of cut-out product
            // shots feel considered rather than scraped.
            hoverImage && "group-hover:opacity-0"
          )}
        />
        {hoverImage && (
          <Image
            src={hoverImage}
            alt=""
            aria-hidden
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-contain p-6 opacity-0 transition-all duration-500 group-hover:scale-[1.06] group-hover:opacity-100"
          />
        )}

        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
          {saving > 0 && <Badge variant="secondary">Save {formatPrice(saving)}</Badge>}
          {product.stock_status === "low_stock" && <Badge variant="warning">Low stock</Badge>}
          {outOfStock && <Badge variant="outline">Out of stock</Badge>}
        </div>

        {/* Quick add: a small disc on the image rather than a full-width bar
            under every card. A row of four solid buttons read as a heavy
            band of chrome and competed with the products themselves.
            Always visible on touch, fades in on hover for pointer devices. */}
        {!outOfStock && (
          <button
            type="button"
            onClick={handleAdd}
            aria-label={`Add ${product.title} to basket`}
            className="absolute right-3.5 bottom-3.5 z-10 flex size-10 cursor-pointer items-center justify-center rounded-full border border-forest-200 bg-white/90 text-forest-800 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-forest-800 hover:bg-forest-800 hover:text-white md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100"
          >
            <AnimatePresence mode="wait" initial={false}>
              {justAdded ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex"
                >
                  <Check className="size-4.5" strokeWidth={2.5} />
                </motion.span>
              ) : (
                <motion.span
                  key="plus"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex"
                >
                  <Plus className="size-4.5" strokeWidth={2.5} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pt-4">
        {product.brand && (
          <span className="text-[0.65rem] font-bold tracking-[0.14em] text-gray-400 uppercase">
            {product.brand}
          </span>
        )}
        <h3 className="mt-1.5 text-[0.95rem] leading-snug font-semibold text-forest-800">
          {/* Stretched link: covers the whole card for pointer and keyboard
              users, while leaving the quick-add button clickable above it. */}
          <Link
            href={`/product/${product.slug}`}
            className="after:absolute after:inset-0 after:content-[''] hover:underline hover:decoration-forest-300 hover:underline-offset-4"
          >
            <span className="line-clamp-2">{product.title}</span>
          </Link>
        </h3>
        <RatingSummary
          averageRating={product.averageRating ?? 0}
          reviewCount={product.reviewCount ?? 0}
          variant="compact"
          className="mt-1.5"
        />
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-lg font-bold text-forest-800">{formatPrice(product.price)}</span>
          {product.compare_at_price && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
