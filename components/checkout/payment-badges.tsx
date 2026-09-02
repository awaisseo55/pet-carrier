import { Apple } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Simplified, low-fidelity representations of the payment methods actually
 * enabled on this account's Stripe dashboard (Settings > Payment methods),
 * checked directly rather than assumed: Cards (Visa/Mastercard/Amex),
 * Apple Pay and Klarna. Never add a badge here for a method that isn't
 * genuinely enabled, that would tell a customer they can pay a way they
 * can't. Deliberately not pixel-accurate brand logo artwork, simple
 * text/shape approximations instead.
 */
export function PaymentBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="flex h-7 w-11 items-center justify-center rounded border border-gray-200 bg-white">
        <span className="font-serif text-[13px] font-bold italic text-[#1A1F71]">VISA</span>
      </span>
      <span className="flex h-7 w-11 items-center justify-center rounded border border-gray-200 bg-white">
        <span className="relative flex h-3.5 w-6 items-center justify-center">
          <span className="absolute left-0 size-3.5 rounded-full bg-[#EB001B]" />
          <span className="absolute right-0 size-3.5 rounded-full bg-[#F79E1B] mix-blend-multiply" />
        </span>
      </span>
      <span className="flex h-7 w-11 items-center justify-center rounded border border-gray-200 bg-[#006FCF]">
        <span className="text-[9px] font-bold tracking-wide text-white">AMEX</span>
      </span>
      <span className="flex h-7 items-center gap-1 rounded border border-gray-200 bg-black px-2 text-white">
        <Apple className="size-3 fill-white" />
        <span className="text-xs font-medium">Pay</span>
      </span>
      <span className="flex h-7 items-center rounded bg-[#FFB3C7] px-2.5">
        <span className="text-xs font-bold text-black">Klarna</span>
      </span>
    </div>
  );
}
