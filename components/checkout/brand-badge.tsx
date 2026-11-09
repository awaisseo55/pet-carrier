import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Real brand artwork for the payment/courier trust badges, supplied by the
 * owner and processed into trimmed, transparent-background WebP by
 * scripts/build-brand-badges.mjs (`npm run build:badges`). Intrinsic sizes
 * below must match the files in public/badges/, re-run that script if the
 * source art changes.
 *
 * Every badge renders in the same white tile at the same height so the row
 * reads as one set rather than a pile of mismatched logos: the artwork
 * itself varies between a self-coloured block (Klarna, Royal Mail) and a
 * mark on transparency (Apple Pay, DPD), and a white tile is the correct
 * backing for all four.
 */
const BADGES = {
  "apple-pay": { src: "/badges/apple-pay.webp", width: 234, height: 96, label: "Apple Pay" },
  klarna: { src: "/badges/klarna.webp", width: 228, height: 96, label: "Klarna" },
  dpd: { src: "/badges/dpd.webp", width: 228, height: 96, label: "DPD" },
  "royal-mail": { src: "/badges/royal-mail.webp", width: 389, height: 96, label: "Royal Mail" },
} as const;

export type BrandBadgeName = keyof typeof BADGES;

export function BrandBadge({
  name,
  className,
  logoClassName,
}: {
  name: BrandBadgeName;
  /** Tile sizing, e.g. "h-7 px-2". */
  className?: string;
  /** Artwork height inside the tile. Width always stays automatic so nothing stretches. */
  logoClassName?: string;
}) {
  const badge = BADGES[name];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white",
        className,
      )}
    >
      <Image
        src={badge.src}
        alt={badge.label}
        width={badge.width}
        height={badge.height}
        className={cn("w-auto", logoClassName)}
      />
    </span>
  );
}
