import Image from "next/image";
import Link from "next/link";
import { CATEGORY_IMAGES } from "@/lib/images";

const categories = [
  { href: "/shop/dogs", label: "Dogs", image: CATEGORY_IMAGES.dogs },
  { href: "/shop/cats", label: "Cats", image: CATEGORY_IMAGES.cats },
  {
    href: "/shop/small-animals",
    label: "Small Animals",
    image: CATEGORY_IMAGES["small-animals"],
  },
  { href: "/shop/birds", label: "Birds", image: CATEGORY_IMAGES.birds },
];

export function ShopByPet() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
          Shop by Pet
        </h2>
        <p className="mt-2 text-brown-soft">Carriers designed around how each animal actually travels.</p>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {categories.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className="group relative aspect-3/4 overflow-hidden rounded-3xl shadow-warm transition-transform hover:-translate-y-1 hover:shadow-warm-lg"
          >
            <Image
              src={cat.image}
              alt={`${cat.label} carriers`}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brown/70 via-brown/10 to-transparent" />
            <span className="absolute bottom-4 left-4 font-serif text-xl font-semibold text-white">
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
