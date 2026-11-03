import { getActiveProducts, toPublicProduct } from "@/lib/products";
import { ProductRail } from "@/components/home/product-rail";

/**
 * Reduced-price products, pulled live from the catalogue rather than hardcoded,
 * so this section appears and disappears on its own as `compare_at_price` is
 * set or cleared in admin. Renders nothing when nothing is reduced.
 */
export async function Offers() {
  const products = await getActiveProducts();
  const reduced = products
    .filter((p) => p.compare_at_price && p.compare_at_price > p.price)
    .sort((a, b) => (b.compare_at_price! - b.price) - (a.compare_at_price! - a.price))
    .slice(0, 4);

  if (reduced.length === 0) return null;

  const biggestSaving = reduced[0].compare_at_price! - reduced[0].price;

  return (
    <ProductRail
      // Whole pounds in the headline: "Save up to £30.00" reads like a
      // receipt, not a headline. Exact savings still show on each card.
      title={`Save up to £${Math.floor(biggestSaving)}`}
      description="Reduced carriers from our current range, while stock lasts."
      products={reduced.map(toPublicProduct)}
      viewAllHref="/carriers"
      viewAllLabel="Browse the full range"
      className="bg-background"
    />
  );
}
