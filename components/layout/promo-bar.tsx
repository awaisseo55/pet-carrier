import Link from "next/link";
import { Truck, ShieldCheck, Undo2 } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/utils";

/**
 * Slim deep-forest strip above the header on every page. Under the Forest &
 * Amber system this bar, the footer and the admin sidebar are the only
 * surfaces allowed to go dark (see CLAUDE.md "Design system").
 */
export async function PromoBar() {
  const settings = await getSettings();

  const items = [
    {
      icon: Truck,
      text: `Free UK delivery over ${formatPrice(settings.free_shipping_threshold)}`,
    },
    { icon: Undo2, text: "14-day returns" },
    { icon: ShieldCheck, text: "Secure checkout" },
  ];

  return (
    <div className="bg-forest-900 text-forest-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-7 gap-y-1.5 px-4 py-2.5 sm:px-6 lg:justify-between lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-1.5">
          {items.map((item) => (
            <span
              key={item.text}
              className="flex items-center gap-1.5 font-sans text-[0.7rem] font-medium tracking-wide sm:text-xs"
            >
              <item.icon className="size-3.5 shrink-0 text-ember-300" />
              {item.text}
            </span>
          ))}
        </div>
        <Link
          href="/track-order"
          className="hidden font-sans text-xs font-medium tracking-wide text-forest-100 underline-offset-4 transition-colors hover:text-white hover:underline lg:block"
        >
          Track your order
        </Link>
      </div>
    </div>
  );
}
