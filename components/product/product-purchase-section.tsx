"use client";

import * as React from "react";
import { ShieldCheck, RotateCcw, Truck, Check } from "lucide-react";
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
  const displayPrice = selectedVariant ? selectedVariant.price : range ? range.low : product.price;
  const displayCompareAt = selectedVariant
    ? (selectedVariant.compareAtPrice ?? null)
    : product.compare_at_price;
  const showFromPrice = hasVariants && !selectedVariant && range && range.low !== range.high;
  const saving = displayCompareAt ? displayCompareAt - displayPrice : 0;

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
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
      <ProductGallery
        key={selectedVariant?.id ?? "default"}
        images={galleryImages}
        title={product.title}
      />

      {/* Buy box follows the gallery on long product pages. */}
      <div className="min-w-0 lg:sticky lg:top-28">
        {categoryName && (
          <span className="text-[0.7rem] font-bold tracking-[0.16em] text-ember-600 uppercase">
            {categoryName}
          </span>
        )}
        <h1 className="mt-2.5 text-3xl leading-[1.12] text-forest-800 sm:text-[2.6rem]">
          {product.title}
        </h1>

        <RatingSummary
          averageRating={product.averageRating ?? 0}
          reviewCount={product.reviewCount ?? 0}
          className="mt-3"
        />

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="font-heading text-4xl text-forest-800">
            {showFromPrice ? "From " : ""}
            {formatPrice(displayPrice)}
          </span>
          {displayCompareAt && (
            <span className="text-lg text-gray-400 line-through">{formatPrice(displayCompareAt)}</span>
          )}
          {saving > 0 && <Badge variant="secondary">Save {formatPrice(saving)}</Badge>}
          <Badge variant={stock.variant}>{stock.label}</Badge>
        </div>

        <p className="mt-5 leading-relaxed text-gray-600">{product.short_description}</p>

        {hasVariants && (
          <div className="mt-7">
            <VariantSelector
              variants={product.variants!}
              variantType={product.variantType!}
              selected={selectedVariant}
              onSelect={setSelectedVariant}
            />
          </div>
        )}

        <div className="mt-7">
          <AddToCart product={product} selectedVariant={selectedVariant} />
        </div>

        <div className="mt-6 rounded-2xl bg-forest-100 p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-forest-800">
            <Truck className="size-4 shrink-0" strokeWidth={1.75} />
            Estimated delivery in 2 to 3 days
          </p>
          <p className="mt-1 pl-6 text-sm text-forest-800/70">
            Tracked UK courier, dispatched from our Preston base.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-forest-200 pt-4 text-xs font-medium text-forest-800/80">
            <span className="flex items-center gap-1.5">
              <Check className="size-3.5" strokeWidth={2.5} />
              Free UK shipping over £70
            </span>
            <span className="flex items-center gap-1.5">
              <RotateCcw className="size-3.5" strokeWidth={2} />
              14-day returns
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" strokeWidth={2} />
              Secure checkout
            </span>
          </div>
        </div>

        {product.features.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl text-forest-800">At a glance</h2>
            <span className="mt-3 block h-[3px] w-12 rounded-full bg-ember-500" />
            <ul className="mt-4 flex flex-col gap-2.5">
              {product.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-600">
                  <Check className="mt-0.5 size-4 shrink-0 text-forest-600" strokeWidth={2.5} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
