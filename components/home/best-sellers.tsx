import { getFeaturedProducts, toPublicProduct } from "@/lib/products";
import { ProductRail } from "@/components/home/product-rail";

/**
 * Replaces the old single-product "Our Featured Carrier" block. A homepage with
 * one product on it reads as a brochure, not a shop, so this leads with a full
 * row of real stock straight after the trust bar.
 */
export async function BestSellers() {
  const products = await getFeaturedProducts(8);

  return (
    <ProductRail
      title="Carriers worth a closer look"
      description="Handpicked from our range and checked against the animal they are built for."
      products={products.map(toPublicProduct)}
      viewAllHref="/carriers"
      viewAllLabel="View all carriers"
      className="bg-background"
    />
  );
}
