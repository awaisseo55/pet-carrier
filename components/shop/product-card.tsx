"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      product_id: product.id,
      slug: product.slug,
      title: product.title,
      image: product.images[0],
      price: product.price,
      stock_status: product.stock_status,
    });
    toast.success(`${product.title} added to your basket`);
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-warm transition-transform hover:-translate-y-1 hover:shadow-warm-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-cream-dark">
        <Image
          src={product.images[0]}
          alt={product.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.compare_at_price && (
          <Badge variant="secondary" className="absolute top-3 left-3">
            Save {formatPrice(product.compare_at_price - product.price)}
          </Badge>
        )}
        {product.stock_status === "low_stock" && (
          <Badge variant="alert" className="absolute top-3 right-3">
            Low stock
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-sage-600">
          {product.pet_type.replace("-", " ")}
        </span>
        <h3 className="font-serif text-base font-semibold leading-snug text-foreground line-clamp-2">
          {product.title}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-foreground">{formatPrice(product.price)}</span>
            {product.compare_at_price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>
          <Button
            size="icon"
            variant="default"
            aria-label="Add to basket"
            onClick={handleAdd}
            disabled={product.stock_status === "out_of_stock"}
          >
            <ShoppingBag className="size-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
