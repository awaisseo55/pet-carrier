"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { distinctColours, distinctSizes } from "@/lib/variants";
import type { PublicProductVariant, VariantType } from "@/lib/types";

interface VariantSelectorProps {
  variants: PublicProductVariant[];
  variantType: VariantType;
  selected: PublicProductVariant | null;
  onSelect: (variant: PublicProductVariant) => void;
}

function ColourSwatch({
  variant,
  active,
  disabled,
  onClick,
}: {
  variant: PublicProductVariant;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={variant.colour}
      aria-pressed={active}
      title={variant.colour}
      className={cn(
        "relative size-10 shrink-0 overflow-hidden rounded-full border border-border transition-shadow cursor-pointer",
        active && "ring-2 ring-blue-600 ring-offset-2",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      {variant.colourImage ? (
        <Image src={variant.colourImage} alt="" fill sizes="40px" className="object-cover" />
      ) : variant.colourHex ? (
        <span className="block size-full" style={{ backgroundColor: variant.colourHex }} />
      ) : (
        <span className="flex size-full items-center justify-center bg-gray-100 text-xs font-medium text-gray-500">
          {variant.colour?.charAt(0).toUpperCase()}
        </span>
      )}
    </button>
  );
}

function SizeButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "rounded-md border px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer",
        active && "border-blue-600 bg-blue-600 text-white",
        !active && !disabled && "border-border bg-white text-foreground hover:border-blue-400",
        disabled && "cursor-not-allowed border-border bg-gray-100 text-gray-400 line-through"
      )}
    >
      {label}
    </button>
  );
}

/**
 * Renders on the product page when product.hasVariants is true. Owns no
 * state itself, the parent (ProductPurchaseSection) tracks `selected` so it
 * can also drive the gallery image and add-to-cart button.
 */
export function VariantSelector({ variants, variantType, selected, onSelect }: VariantSelectorProps) {
  const showColour = variantType === "colour" || variantType === "size-colour";
  const showSize = variantType === "size" || variantType === "size-colour";

  const colours = React.useMemo(() => distinctColours(variants), [variants]);
  const sizes = React.useMemo(() => distinctSizes(variants), [variants]);

  function findVariant(colour: string | undefined, size: string | undefined): PublicProductVariant | undefined {
    return variants.find(
      (v) => (colour === undefined || v.colour === colour) && (size === undefined || v.size === size)
    );
  }

  function isSizeAvailable(size: string): boolean {
    const match = findVariant(showColour ? selected?.colour : undefined, size);
    return !!match?.inStock;
  }

  function isColourAvailable(colour: string): boolean {
    const match = findVariant(colour, showSize ? selected?.size : undefined);
    // A colour is selectable on its own even if the specific size+colour
    // combo isn't resolved yet, only grey it out if every size is unavailable.
    return match ? match.inStock : variants.some((v) => v.colour === colour && v.inStock);
  }

  return (
    <div className="flex flex-col gap-4">
      {showColour && (
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">
            Colour{selected?.colour ? `: ${selected.colour}` : ""}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {colours.map((variant) => (
              <ColourSwatch
                key={variant.colour}
                variant={variant}
                active={selected?.colour === variant.colour}
                disabled={!isColourAvailable(variant.colour!)}
                onClick={() => {
                  const next = findVariant(variant.colour, showSize ? selected?.size : undefined) || variant;
                  onSelect(next);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {showSize && (
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">
            Size{selected?.sizeLabel ? `: ${selected.sizeLabel}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map(({ size, sizeLabel }) => {
              const match = findVariant(showColour ? selected?.colour : undefined, size);
              return (
                <SizeButton
                  key={size}
                  label={sizeLabel || size}
                  active={selected?.size === size}
                  disabled={!isSizeAvailable(size)}
                  onClick={() => {
                    if (match) onSelect(match);
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
