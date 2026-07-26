import Link from "next/link";
import { ArrowRight, Bird, Cat, Dog, Rabbit, type LucideIcon } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { getActiveProducts } from "@/lib/products";
import type { PetType } from "@/lib/types";

const ICONS: Record<PetType, LucideIcon> = {
  dogs: Dog,
  cats: Cat,
  "small-animals": Rabbit,
  birds: Bird,
};

export async function ShopByPet() {
  const products = await getActiveProducts();
  const counts = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
          Shop by Pet
        </h2>
        <p className="mt-2 text-brown-soft">Carriers designed around how each animal actually travels.</p>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {CATEGORIES.map((category) => {
          const Icon = ICONS[category.value];
          const count = counts[category.value] || 0;
          return (
            <Link
              key={category.value}
              href={`/shop/${category.value}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center shadow-warm transition-all hover:-translate-y-1 hover:border-sage-400 hover:shadow-warm-lg"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-sage-100 text-sage-700 transition-colors group-hover:bg-sage-200">
                <Icon className="size-8" strokeWidth={1.75} />
              </span>
              <span className="font-serif text-lg font-semibold text-foreground">{category.label}</span>
              <span className="text-sm text-muted-foreground">
                {count} carrier{count === 1 ? "" : "s"}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 font-medium text-sage-700 hover:underline"
        >
          View all categories
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
