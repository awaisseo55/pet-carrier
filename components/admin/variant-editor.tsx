"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductVariant, VariantType } from "@/lib/types";

interface VariantEditorProps {
  hasVariants: boolean;
  variantType: VariantType;
  variants: ProductVariant[];
  productImages: string[];
  onChange: (state: { hasVariants: boolean; variantType: VariantType; variants: ProductVariant[] }) => void;
}

function emptyVariant(type: VariantType): ProductVariant {
  return {
    id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    price: 0,
    sku: "",
    inStock: true,
  };
}

/**
 * Manual size/colour variant editor for the admin product edit form. Mirrors
 * the ProductVariant shape from lib/types.ts exactly, no separate draft
 * schema, so what's built here is what components/product/variant-selector.tsx
 * renders on the live product page.
 */
export function VariantEditor({ hasVariants, variantType, variants, productImages, onChange }: VariantEditorProps) {
  const showSize = variantType === "size" || variantType === "size-colour";
  const showColour = variantType === "colour" || variantType === "size-colour";

  function setHasVariants(next: boolean) {
    onChange({
      hasVariants: next,
      variantType,
      variants: next && variants.length === 0 ? [emptyVariant(variantType)] : variants,
    });
  }

  function setVariantType(next: VariantType) {
    onChange({
      hasVariants,
      variantType: next,
      variants: variants.map((v) => ({ ...v, type: next })),
    });
  }

  function updateVariant(index: number, patch: Partial<ProductVariant>) {
    onChange({
      hasVariants,
      variantType,
      variants: variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    });
  }

  function addVariant() {
    onChange({ hasVariants, variantType, variants: [...variants, emptyVariant(variantType)] });
  }

  function removeVariant(index: number) {
    onChange({ hasVariants, variantType, variants: variants.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
        <Checkbox checked={hasVariants} onCheckedChange={(c) => setHasVariants(!!c)} />
        This product has size and/or colour variants
      </label>

      {hasVariants && (
        <>
          <div className="max-w-xs">
            <Label>Variant type</Label>
            <Select value={variantType} onValueChange={(v) => setVariantType(v as VariantType)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="size">Size only</SelectItem>
                <SelectItem value="colour">Colour only</SelectItem>
                <SelectItem value="size-colour">Size and colour</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              The product&apos;s own price becomes the lowest variant price, shown as &quot;From £X&quot; until a
              customer picks one.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {variants.map((variant, i) => (
              <div key={variant.id} className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-2 lg:grid-cols-4">
                {showSize && (
                  <div>
                    <Label className="text-xs">Size</Label>
                    <Input
                      value={variant.size ?? ""}
                      onChange={(e) => updateVariant(i, { size: e.target.value })}
                      placeholder="M"
                      className="mt-1 h-9"
                    />
                  </div>
                )}
                {showSize && (
                  <div>
                    <Label className="text-xs">Size label</Label>
                    <Input
                      value={variant.sizeLabel ?? ""}
                      onChange={(e) => updateVariant(i, { sizeLabel: e.target.value })}
                      placeholder="M (43x32x30cm)"
                      className="mt-1 h-9"
                    />
                  </div>
                )}
                {showColour && (
                  <div>
                    <Label className="text-xs">Colour</Label>
                    <Input
                      value={variant.colour ?? ""}
                      onChange={(e) => updateVariant(i, { colour: e.target.value })}
                      placeholder="Grey"
                      className="mt-1 h-9"
                    />
                  </div>
                )}
                {showColour && (
                  <div>
                    <Label className="text-xs">Swatch colour</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={variant.colourHex ?? "#cccccc"}
                        onChange={(e) => updateVariant(i, { colourHex: e.target.value })}
                        className="h-9 w-10 cursor-pointer rounded border border-input"
                      />
                      <Input
                        value={variant.colourHex ?? ""}
                        onChange={(e) => updateVariant(i, { colourHex: e.target.value })}
                        placeholder="#808080"
                        className="h-9"
                      />
                    </div>
                  </div>
                )}
                {showColour && (
                  <div>
                    <Label className="text-xs">Photo for this colour</Label>
                    <Select
                      value={variant.colourImage ?? "__none__"}
                      onValueChange={(v) => updateVariant(i, { colourImage: v === "__none__" ? undefined : v })}
                    >
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue placeholder="Default gallery" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Default gallery</SelectItem>
                        {productImages.map((img, imgIndex) => (
                          <SelectItem key={img} value={img}>
                            Image {imgIndex + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label className="text-xs">Price (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variant.price}
                    onChange={(e) => updateVariant(i, { price: Number(e.target.value) })}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">SKU</Label>
                  <Input
                    value={variant.sku}
                    onChange={(e) => updateVariant(i, { sku: e.target.value })}
                    placeholder="PC-B0EXAMPLE"
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Amazon URL (optional)</Label>
                  <Input
                    value={variant.amazonUrl ?? ""}
                    onChange={(e) => updateVariant(i, { amazonUrl: e.target.value })}
                    placeholder="https://www.amazon.co.uk/dp/..."
                    className="mt-1 h-9"
                  />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={variant.inStock}
                      onCheckedChange={(c) => updateVariant(i, { inStock: !!c })}
                    />
                    In stock
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeVariant(i)}
                    disabled={variants.length <= 1}
                    aria-label="Remove variant"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addVariant}>
            <Plus className="size-3.5" />
            Add variant
          </Button>
        </>
      )}
    </div>
  );
}
