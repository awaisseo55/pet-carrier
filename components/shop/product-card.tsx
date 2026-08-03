"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/utils";
import { PRODUCT_PLACEHOLDER } from "@/lib/constants";
import { getCategoryByPath } from "@/lib/categories";
import type { PublicProduct } from "@/lib/types";
import { toast } from "sonner";

export function ProductCard({ product }: { product: PublicProduct }) {
  const { addItem } = useCart();
  const image = product.images[0] || PRODUCT_PLACEHOLDER;
  const primaryCategory = product.category_slugs[0] ? getCategoryByPath(product.category_slugs[0]) : undefined;

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
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Image
          src={image}
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
          <Badge variant="warning" className="absolute top-3 right-3">
            Low stock
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {primaryCategory && (
          <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
            {primaryCategory.name}
          </span>
        )}
        <h3 className="font-heading text-base font-semibold leading-snug text-foreground line-clamp-2">
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
