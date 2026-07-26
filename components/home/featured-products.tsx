import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/product-card";
import { getFeaturedProducts } from "@/lib/products";

export async function FeaturedProducts() {
  const products = await getFeaturedProducts(8);

  return (
    <section className="bg-cream-dark/60 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              Featured Carriers
            </h2>
            <p className="mt-2 text-brown-soft">Our current favourites, picked for comfort and quality.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/shop">View All</Link>
          </Button>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
