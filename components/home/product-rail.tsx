import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import type { PublicProduct } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";

/**
 * Shared shoppable row used by the homepage's featured and offers sections.
 * Scrolls horizontally on narrow screens and becomes a four-up grid from
 * `lg`, so the homepage leads with real stock rather than category links.
 */
export function ProductRail({
  title,
  description,
  products,
  viewAllHref,
  viewAllLabel = "View all",
  className,
}: {
  title: string;
  description?: string;
  products: PublicProduct[];
  viewAllHref: string;
  viewAllLabel?: string;
  className?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className={cn("py-12 lg:py-16", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal direction="up">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="max-w-2xl">
              <h2 className="text-3xl leading-[1.1] text-forest-800 sm:text-4xl">{title}</h2>
              <span className="mt-4 block h-[3px] w-16 rounded-full bg-ember-500" />
              {description && (
                <p className="mt-4 max-w-xl leading-relaxed text-gray-600">{description}</p>
              )}
            </div>
            <Link
              href={viewAllHref}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-forest-300 bg-white px-6 py-3 text-sm font-bold text-forest-800 transition-all hover:-translate-y-0.5 hover:border-forest-600"
            >
              {viewAllLabel}
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </Reveal>

        <StaggerGroup className="scrollbar-thin mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 sm:gap-6 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
          {products.map((product) => (
            <StaggerItem
              key={product.id}
              className="w-[70%] shrink-0 snap-start sm:w-[44%] lg:w-auto lg:shrink lg:snap-align-none"
            >
              <ProductCard product={product} className="h-full" />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
