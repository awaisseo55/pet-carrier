import { BrandBadge } from "./brand-badge";
import { cn } from "@/lib/utils";

/**
 * The payment methods actually enabled on this account's Stripe dashboard
 * (Settings > Payment methods), checked directly rather than assumed: Cards
 * (Visa/Mastercard/Amex), Apple Pay and Klarna. Never add a badge here for a
 * method that isn't genuinely enabled, that would tell a customer they can
 * pay a way they can't.
 *
 * Apple Pay and Klarna use the real brand artwork in public/badges/. The
 * three card networks are still drawn in CSS because no artwork has been
 * supplied for them yet; they share the same tile, height and radius so the
 * row still reads as one set. Replace them with BrandBadge entries as soon as
 * real Visa/Mastercard/Amex files exist.
 */
const TILE = "h-7 px-2";

const CARD_TILE =
  "inline-flex h-7 w-11 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white";

export function PaymentBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className={CARD_TILE}>
        <span className="font-serif text-[13px] font-bold italic leading-none text-[#1A1F71]">VISA</span>
      </span>
      <span className={CARD_TILE} role="img" aria-label="Mastercard">
        <span className="relative flex h-3.5 w-[22px] items-center">
          <span className="absolute left-0 size-3.5 rounded-full bg-[#EB001B]" />
          <span className="absolute right-0 size-3.5 rounded-full bg-[#F79E1B] mix-blend-multiply" />
        </span>
      </span>
      <span className={cn(CARD_TILE, "border-[#006FCF] bg-[#006FCF]")}>
        <span className="text-[9px] font-bold leading-none tracking-wide text-white">AMEX</span>
      </span>
      <BrandBadge name="apple-pay" className={TILE} logoClassName="h-4" />
      <BrandBadge name="klarna" className={TILE} logoClassName="h-[18px]" />
    </div>
  );
}
