import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategoryByPath } from "@/lib/categories";
import { getProductsByCategoryIncludingDescendants } from "@/lib/products";
import { PRODUCT_PLACEHOLDER } from "@/lib/constants";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";

/**
 * "Shop by type" tiles, illustrated with a real product image from each
 * collection rather than stock photography: every collection category is
 * tagged `animal: "multiple pets"`, so the curated Unsplash fallback in
 * lib/images.ts would hand all of them the same single photo. Using live stock
 * also means a tile can never advertise a category we have nothing in, empty
 * categories are dropped below.
 */
const types: { path: string; label?: string }[] = [
  { path: "carriers/pet-airline-approved-carriers", label: "Airline approved" },
  { path: "carriers/pet-backpack-carriers", label: "Backpacks" },
  { path: "carriers/pet-sling-carriers", label: "Slings" },
  { path: "carriers/pet-rolling-carriers", label: "With wheels" },
  { path: "carriers/pet-soft-sided-carriers", label: "Soft-sided" },
  { path: "carriers/pet-hard-sided-carriers", label: "Hard-sided" },
  { path: "carriers/pet-car-travel-carriers", label: "Car travel" },
  { path: "carriers/pet-carriers-for-vet-visits", label: "Vet visits" },
  // Listed last as a spare: one candidate above is usually empty, and this
  // keeps the grid filling a whole number of four-up rows.
  { path: "carriers/hiking-pet-carriers", label: "Hiking" },
];

export async function ShopByType() {
  const resolved = await Promise.all(
    types.map(async (type) => {
      const products = await getProductsByCategoryIncludingDescendants(type.path);
      const node = getCategoryByPath(type.path);
      return {
        ...type,
        label: type.label ?? node?.name ?? type.path,
        count: products.length,
        // Every candidate image for this tile, so a later tile can skip one an
        // earlier tile already used (several collections share a top product).
        candidates: products.map((p) => p.images[0]).filter(Boolean) as string[],
      };
    })
  );

  const used = new Set<string>();
  const tiles = resolved
    .filter((tile) => tile.count > 0)
    .map((tile) => {
      const image = tile.candidates.find((url) => !used.has(url)) ?? tile.candidates[0] ?? PRODUCT_PLACEHOLDER;
      used.add(image);
      return { ...tile, image };
    })
    .slice(0, 8);

  if (tiles.length === 0) return null;

  return (
    <section className="bg-gray-50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal direction="up">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="max-w-2xl">
            <span className="font-sans text-[0.7rem] font-bold tracking-[0.16em] text-ember-600 uppercase">Shop by type</span>
            <h2 className="mt-2.5 text-3xl leading-[1.1] text-ink sm:text-4xl lg:text-[2.75rem]">
              Then pick the style that suits the journey
            </h2>
            <p className="mt-3 leading-relaxed text-gray-600">
              A flight, the school run and a hike all ask different things of a carrier.
            </p>
          </div>
          <Link
            href="/carriers"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-forest-300 px-5 py-2.5 font-sans text-sm font-semibold text-forest-800 transition-all hover:-translate-y-0.5 hover:border-forest-600 hover:bg-forest-50"
          >
            All categories
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
          </div>
        </Reveal>

        <StaggerGroup className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {tiles.map((tile) => (
            <StaggerItem key={tile.path}>
            <Link
              href={`/${tile.path}`}
              className="group flex h-full flex-col items-center rounded-2xl border border-border bg-card p-4 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-forest-200 hover:shadow-xl"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-50">
                <Image
                  src={tile.image}
                  alt={`${tile.label} pet carriers`}
                  fill
                  sizes="(min-width: 768px) 22vw, 45vw"
                  className="object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <h3 className="mt-4 font-sans text-sm font-bold tracking-tight text-ink transition-colors group-hover:text-forest-700 sm:text-base">
                {tile.label}
              </h3>
              <p className="mt-1 mb-1 font-sans text-xs text-gray-500">
                {tile.count} carrier{tile.count === 1 ? "" : "s"}
              </p>
            </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
