import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Carrier-only homepage grid (2026-09): this used to present Carriers,
// Strollers and Beds as three equal-weight top-level sections, which gave
// the homepage, the site's single highest-authority page, a diluted
// "general pet products" signal rather than a focused carrier one. Beds and
// Strollers were removed from the site entirely (see CLAUDE.md "Category
// architecture"), so this now shows real carrier subcategories instead,
// reusing the existing category structure rather than inventing new pages.
const categories = [
  { href: "/carriers/dog-carriers", label: "Dog Carriers" },
  { href: "/carriers/cat-carriers", label: "Cat Carriers" },
  { href: "/carriers/small-animal-carriers", label: "Small Animal Carriers" },
  { href: "/carriers/bird-carriers", label: "Bird Carriers" },
  { href: "/carriers/pet-airline-approved-carriers", label: "Airline Approved Carriers" },
  { href: "/carriers/pet-backpack-carriers", label: "Carrier Backpacks" },
  { href: "/carriers/pet-sling-carriers", label: "Carrier Slings" },
  { href: "/carriers/pet-rolling-carriers", label: "Carriers with Wheels" },
];

export function ShopMainCategories() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-semibold text-ink sm:text-4xl">Shop Pet Carriers by Type</h2>
        <p className="mt-2 text-gray-500">Every carrier we sell, organised by pet, style and use.</p>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
          >
            <span className="font-medium text-ink">{category.label}</span>
            <ArrowRight className="size-4 shrink-0 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
          </Link>
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link href="/carriers" className="text-sm font-medium text-blue-700 hover:underline">
          View all pet carriers &rarr;
        </Link>
      </div>
    </section>
  );
}
