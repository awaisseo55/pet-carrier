import type { PublicProductVariant } from "./types";

/** Human-readable selection for cart lines and order fulfilment, e.g. "Size: L, Colour: Grey". */
export function variantLabel(variant: PublicProductVariant): string {
  const parts: string[] = [];
  if (variant.sizeLabel || variant.size) parts.push(`Size: ${variant.sizeLabel || variant.size}`);
  if (variant.colour) parts.push(`Colour: ${variant.colour}`);
  return parts.join(", ");
}

export function variantPriceRange(variants: PublicProductVariant[]): { low: number; high: number } {
  const prices = variants.map((v) => v.price);
  return { low: Math.min(...prices), high: Math.max(...prices) };
}

export function distinctSizes(variants: PublicProductVariant[]): { size: string; sizeLabel?: string }[] {
  const seen = new Map<string, string | undefined>();
  for (const v of variants) {
    if (v.size && !seen.has(v.size)) seen.set(v.size, v.sizeLabel);
  }
  return Array.from(seen.entries()).map(([size, sizeLabel]) => ({ size, sizeLabel }));
}

export function distinctColours(variants: PublicProductVariant[]): PublicProductVariant[] {
  const seen = new Set<string>();
  const result: PublicProductVariant[] = [];
  for (const v of variants) {
    if (v.colour && !seen.has(v.colour)) {
      seen.add(v.colour);
      result.push(v);
    }
  }
  return result;
}
