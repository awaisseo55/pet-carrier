import Image from "next/image";
import Link from "next/link";
import { SHOP_BY_PET_IMAGES } from "@/lib/images";

const pets = [
  { href: "/carriers/dog-carriers", label: "Dogs", image: SHOP_BY_PET_IMAGES.dogs },
  { href: "/carriers/cat-carriers", label: "Cats", image: SHOP_BY_PET_IMAGES.cats },
  {
    href: "/carriers/small-animal-carriers",
    label: "Small Animals",
    image: SHOP_BY_PET_IMAGES["small-animals"],
  },
  { href: "/carriers/bird-carriers", label: "Birds", image: SHOP_BY_PET_IMAGES.birds },
];

export function ShopByPet() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-semibold text-ink sm:text-4xl">Shop by Pet</h2>
          <p className="mt-2 text-gray-500">Carriers designed around how each animal actually travels.</p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {pets.map((pet) => (
            <Link
              key={pet.href}
              href={pet.href}
              className="group relative aspect-3/4 overflow-hidden rounded-lg shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <Image
                src={pet.image}
                alt={`${pet.label} carriers`}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <span className="absolute bottom-4 left-4 font-heading text-xl font-semibold text-white">
                {pet.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
