import { BrandBadge } from "./brand-badge";
import { cn } from "@/lib/utils";

/**
 * The couriers actually used for dispatch (matched by lib/orders.ts's
 * courier_name field and components/track-order/track-order-form.tsx's
 * tracking-link logic). Same rule as PaymentBadges: only name a courier here
 * if orders are genuinely dispatched with them.
 *
 * Slightly shorter tiles than the payment row because these sit inside the
 * compact delivery-option box rather than on their own line.
 */
const TILE = "h-6 px-1.5";

export function CourierBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <BrandBadge name="royal-mail" className={TILE} logoClassName="h-[13px]" />
      <BrandBadge name="dpd" className={TILE} logoClassName="h-[14px]" />
    </div>
  );
}
