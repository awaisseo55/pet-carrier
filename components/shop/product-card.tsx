"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
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

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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
    <Link
      href={`/product/${product.slug}`}
      className={cn(
        "group flex flex-col transition-transform duration-300 hover:-translate-y-1.5",
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

        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
          {saving > 0 && <Badge variant="secondary">Save {formatPrice(saving)}</Badge>}
          {product.stock_status === "low_stock" && <Badge variant="warning">Low stock</Badge>}
          {outOfStock && <Badge variant="outline">Out of stock</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-1 pt-4">
        {product.brand && (
          <span className="text-[0.65rem] font-bold tracking-[0.14em] text-gray-400 uppercase">
            {product.brand}
          </span>
        )}
        <h3 className="mt-1.5 line-clamp-2 text-[0.95rem] leading-snug font-bold text-forest-800">
          {product.title}
        </h3>
        <RatingSummary
          averageRating={product.averageRating ?? 0}
          reviewCount={product.reviewCount ?? 0}
          variant="compact"
          className="mt-1.5"
        />
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-forest-800">{formatPrice(product.price)}</span>
          {product.compare_at_price && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className="mt-4 w-full cursor-pointer rounded-xl bg-forest-800 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-forest-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <AnimatePresence mode="wait" initial={false}>
            {justAdded ? (
              <motion.span
                key="added"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="flex items-center justify-center gap-1.5"
              >
                <Check className="size-4" />
                Added
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="block"
              >
                {outOfStock ? "Out of stock" : "Add to basket"}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </Link>
  );
}
