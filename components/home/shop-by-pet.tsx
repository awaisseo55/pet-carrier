import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCategoryImageUrl } from "@/lib/placeholders";
import { StaggerGroup, StaggerItem } from "@/components/motion/reveal";

/**
 * Four equal photographic tiles, each labelled with a white pill at the
 * bottom-left, as in the reference comp. No gradient scrim, no product
 * counts, no body copy: the photograph is the content and the pill is the
 * only chrome on top of it.
 */
const pets = [
  { path: "carriers/dog-carriers", label: "Dogs" },
  { path: "carriers/cat-carriers", label: "Cats" },
  { path: "carriers/small-animal-carriers", label: "Small pets" },
  { path: "carriers/bird-carriers", label: "Birds" },
] as const;

export async function ShopByPet() {
  const tiles = await Promise.all(
    pets.map(async (pet) => {
      const { url } = await getCategoryImageUrl(pet.path);
      return { ...pet, image: url };
    })
  );

  return (
    <section id="shop-by-pet" className="scroll-mt-24 bg-background py-10 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="sr-only">Shop pet carriers by pet</h2>
        <StaggerGroup className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {tiles.map((tile) => (
            <StaggerItem key={tile.path}>
              <Link
                href={`/${tile.path}`}
                className="group relative block aspect-4/3 overflow-hidden rounded-[1.5rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <Image
                  src={tile.image}
                  alt={`${tile.label} pet carriers`}
                  fill
                  sizes="(min-width: 1024px) 24vw, 48vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
                <span className="absolute bottom-3.5 left-3.5 inline-flex items-center gap-1 rounded-full bg-white/95 py-2 pr-2.5 pl-4 text-sm font-bold text-forest-800 shadow-sm backdrop-blur-sm sm:bottom-4 sm:left-4">
                  {tile.label}
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
