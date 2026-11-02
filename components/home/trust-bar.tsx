import { MapPin, Undo2, Lock } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/utils";

/**
 * Three reassurances on one quiet divided row, as in the reference comp. Kept
 * to three short factual claims rather than a four-up card grid: the point is
 * that it reads as a line of small print, not as another content section.
 */
export async function TrustBar() {
  const settings = await getSettings();

  const points = [
    { icon: MapPin, text: "UK based" },
    { icon: Undo2, text: "14-day returns" },
    { icon: Lock, text: "Secure checkout" },
  ];

  return (
    <section className="border-y border-gray-200 bg-background">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center divide-gray-200 px-4 py-5 sm:divide-x sm:px-6 lg:px-8">
        {points.map((point) => (
          <div
            key={point.text}
            className="flex items-center justify-center gap-2.5 px-6 py-1.5 sm:flex-1"
          >
            <point.icon className="size-4 shrink-0 text-forest-700" strokeWidth={1.75} />
            <span className="text-sm font-semibold text-forest-800">{point.text}</span>
          </div>
        ))}
      </div>
      <p className="sr-only">
        Free UK delivery on orders over {formatPrice(settings.free_shipping_threshold)}.
      </p>
    </section>
  );
}
