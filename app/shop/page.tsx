import { Suspense } from "react";
import type { Metadata } from "next";
import { ShopClient } from "@/components/shop/shop-client";
import { getActiveProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop All Pet Carriers",
  description:
    "Browse our full range of pet carriers for dogs, cats, small animals and birds. Filter by pet type, size and price.",
};

export default async function ShopPage() {
  const products = await getActiveProducts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
          All Carriers
        </h1>
        <p className="mt-2 max-w-2xl text-brown-soft">
          Every carrier in our range, handpicked for comfort across dogs, cats, small animals and
          birds.
        </p>
      </div>
      <Suspense>
        <ShopClient products={products} />
      </Suspense>
    </div>
  );
}
