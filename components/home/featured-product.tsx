import Image from "next/image";
import Link from "next/link";
import { getFeaturedProducts } from "@/lib/products";
import { PRODUCT_PLACEHOLDER } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export async function FeaturedProduct() {
  const [product] = await getFeaturedProducts(1);
  if (!product) return null;

  const image = product.images[0] || PRODUCT_PLACEHOLDER;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-semibold text-ink sm:text-4xl">Our Featured Carrier</h2>
      </div>
      <Link
        href={`/product/${product.slug}`}
        className="mt-10 grid grid-cols-1 items-center gap-8 overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md lg:grid-cols-2"
      >
        <div className="relative aspect-square lg:aspect-auto lg:h-full lg:min-h-[360px]">
          <Image src={image} alt={product.title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="p-8 lg:p-12">
          {product.compare_at_price && (
            <Badge variant="secondary" className="mb-4">
              Save {formatPrice(product.compare_at_price - product.price)}
            </Badge>
          )}
          <h3 className="font-heading text-2xl font-semibold text-ink sm:text-3xl">{product.title}</h3>
          <p className="mt-3 text-gray-600">{product.short_description}</p>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-ink">{formatPrice(product.price)}</span>
            {product.compare_at_price && (
              <span className="text-lg text-gray-500 line-through">{formatPrice(product.compare_at_price)}</span>
            )}
          </div>
          <Button variant="default" size="lg" className="mt-6">
            View Product
          </Button>
        </div>
      </Link>
    </section>
  );
}
