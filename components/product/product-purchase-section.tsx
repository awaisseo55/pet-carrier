"use client";

import * as React from "react";
import { MapPin, ShieldCheck, RotateCcw, Truck } from "lucide-react";
import { ProductGallery } from "@/components/product/product-gallery";
import { AddToCart } from "@/components/product/add-to-cart";
import { VariantSelector } from "@/components/product/variant-selector";
import { RatingSummary } from "@/components/product/rating-summary";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_PLACEHOLDER } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { variantPriceRange } from "@/lib/variants";
import type { PublicProduct, PublicProductVariant } from "@/lib/types";

const stockLabel = {
  in_stock: { label: "In stock", variant: "success" as const },
  low_stock: { label: "Only a few left", variant: "warning" as const },
  out_of_stock: { label: "Out of stock", variant: "outline" as const },
};

/**
 * Owns the selected-variant state for the whole purchase area (gallery,
 * price, stock badge and add-to-cart), since a colour choice needs to swap
 * the gallery's primary image and a size/colour choice needs to update the
 * price and SKU added to cart. Kept as one client island rather than three,
 * so state doesn't need lifting between sibling server-rendered elements.
 */
export function ProductPurchaseSection({
  product,
  categoryName,
}: {
  product: PublicProduct;
  categoryName: string | null;
}) {
  const hasVariants = !!product.hasVariants && !!product.variants && product.variants.length > 0;
  const [selectedVariant, setSelectedVariant] = React.useState<PublicProductVariant | null>(null);

  const range = hasVariants ? variantPriceRange(product.variants!) : null;
  const displayPrice = selectedVariant ? selectedVariant.price : (range ? range.low : product.price);
  const displayCompareAt = selectedVariant ? (selectedVariant.compareAtPrice ?? null) : product.compare_at_price;
  const showFromPrice = hasVariants && !selectedVariant && range && range.low !== range.high;

  const stockStatus = selectedVariant
    ? selectedVariant.inStock
      ? ("in_stock" as const)
      : ("out_of_stock" as const)
    : product.stock_status;
  const stock = stockLabel[stockStatus];

  const galleryImages = React.useMemo(() => {
    const base = product.images.length > 0 ? product.images : [PRODUCT_PLACEHOLDER];
    if (selectedVariant?.colourImage) {
      return [selectedVariant.colourImage, ...base.filter((img) => img !== selectedVariant.colourImage)];
    }
    return base;
  }, [product.images, selectedVariant]);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <ProductGallery key={selectedVariant?.id ?? "default"} images={galleryImages} title={product.title} />

      <div className="min-w-0">
        {categoryName && (
          <span className="text-sm font-medium uppercase tracking-wide text-blue-600">{categoryName}</span>
        )}
        <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">{product.title}</h1>

        <RatingSummary averageRating={product.averageRating ?? 0} reviewCount={product.reviewCount ?? 0} />

        <div className="mt-4 flex items-center gap-3">
          <span className={`text-2xl font-semibold ${displayCompareAt ? "text-alert" : "text-foreground"}`}>
            {showFromPrice ? "From " : ""}
            {formatPrice(displayPrice)}
          </span>
          {displayCompareAt && (
            <span className="text-lg text-muted-foreground line-through">{formatPrice(displayCompareAt)}</span>
          )}
          <Badge variant={stock.variant}>{stock.label}</Badge>
        </div>

        <p className="mt-4 text-gray-500">{product.short_description}</p>

        {hasVariants && (
          <div className="mt-6">
            <VariantSelector
              variants={product.variants!}
              variantType={product.variantType!}
              selected={selectedVariant}
              onSelect={setSelectedVariant}
            />
          </div>
        )}

        <div className="mt-6">
          <AddToCart product={product} selectedVariant={selectedVariant} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Truck, title: "Free UK Shipping", subtitle: "On orders over £70" },
            { icon: RotateCcw, title: "14-Day Returns", subtitle: "Easy, no-fuss refunds" },
            { icon: ShieldCheck, title: "Secure Checkout", subtitle: "Encrypted card payment" },
            { icon: MapPin, title: "Dispatched from the UK", subtitle: "Packed in Preston" },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-white p-3 text-center shadow-sm"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <item.icon className="size-4.5" />
              </div>
              <span className="text-xs font-semibold leading-tight text-ink">{item.title}</span>
              <span className="text-[11px] leading-tight text-gray-500">{item.subtitle}</span>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="font-heading text-lg font-semibold">Features</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {product.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-gray-500">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
