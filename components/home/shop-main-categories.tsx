import Link from "next/link";
import { ArrowRight, Backpack, Bed, ShoppingBag } from "lucide-react";

const categories = [
  {
    href: "/carriers",
    label: "Carriers",
    description: "Carriers for every pet and every kind of trip.",
    icon: Backpack,
  },
  {
    href: "/strollers",
    label: "Strollers",
    description: "Comfortable rides for pets who love fresh air.",
    icon: ShoppingBag,
  },
  {
    href: "/beds",
    label: "Beds",
    description: "A cosy, familiar place to rest and recover.",
    icon: Bed,
  },
];

export function ShopMainCategories() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-semibold text-ink sm:text-4xl">Shop by Category</h2>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="group flex flex-col gap-4 rounded-lg border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-400 hover:shadow-md"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <category.icon className="size-7" strokeWidth={1.75} />
            </span>
            <div>
              <h3 className="font-heading text-xl font-semibold text-ink">{category.label}</h3>
              <p className="mt-1 text-sm text-gray-500">{category.description}</p>
            </div>
            <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              Explore
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
