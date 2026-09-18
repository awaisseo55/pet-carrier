import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { getProductsByCategory, toPublicProduct } from "@/lib/products";
import { getCategoryByPath } from "@/lib/categories";

/**
 * Live "shop this section" block for pillar/cluster blog posts: pulls real,
 * currently in-stock products for one category straight from the product
 * data at render time, the same way category pages do, so it never goes
 * stale as products are added, priced or discontinued in admin. Renders
 * nothing (rather than an empty shelf) if the category currently has no
 * active products.
 */
export async function CategoryProductShowcase({ categoryPath, limit = 3 }: { categoryPath: string; limit?: number }) {
  const [products, node] = await Promise.all([getProductsByCategory(categoryPath), getCategoryByPath(categoryPath)]);

  if (products.length === 0) return null;

  const shown = products.slice(0, limit);
  const categoryUrl = `/${categoryPath}`;

  return (
    <div className="not-prose my-2 rounded-xl border border-border bg-gray-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-heading text-base font-semibold text-foreground">
          Shop {node?.name || "this range"}
        </h4>
        <Link
          href={categoryUrl}
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          View all <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {shown.map((product) => (
          <ProductCard key={product.id} product={toPublicProduct(product)} />
        ))}
      </div>
    </div>
  );
}
