import { cn } from "@/lib/utils";

/**
 * Simplified, low-fidelity representations of the couriers actually used
 * for dispatch (matched by lib/orders.ts's courier_name field and
 * components/track-order/track-order-form.tsx's tracking-link logic), not
 * pixel-accurate brand logo artwork. Same rationale as PaymentBadges: only
 * name a courier here if orders are genuinely dispatched with them.
 */
export function CourierBadges({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="flex h-6 items-center rounded bg-[#DA291C] px-2">
        <span className="text-[10px] font-bold tracking-tight text-white">Royal Mail</span>
      </span>
      <span className="flex h-6 items-center rounded border border-[#DC0032] bg-white px-2">
        <span className="text-[10px] font-bold tracking-tight text-[#DC0032]">DPD</span>
      </span>
    </div>
  );
}
