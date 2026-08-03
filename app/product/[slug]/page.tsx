import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, Star } from "lucide-react";
import { ProductPurchaseSection } from "@/components/product/product-purchase-section";
import { ProductCard } from "@/components/shop/product-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getActiveProducts, getProductBySlug, getRelatedProducts, toPublicProduct } from "@/lib/products";
import { breadcrumbJsonLd, faqJsonLd, productJsonLd } from "@/lib/seo";
import { getBreadcrumbTrail, getCategoryByPath } from "@/lib/categories";
import { formatPrice } from "@/lib/utils";
import { distinctSizes } from "@/lib/variants";

// Belt-and-braces alongside the on-demand revalidatePath() calls in
// lib/revalidate.ts (which fire immediately after an admin save): a ceiling
// so pricing/stock is never more than a minute stale even if one is missed.
export const revalidate = 60;
// Not actually a behaviour change: Next.js already defaults dynamicParams to
// true (nothing in this app sets it false), so slugs outside
// generateStaticParams() already render on demand. Kept explicit so that's
// obvious without checking the Next.js default.
export const dynamicParams = true;
import { renderRichText } from "@/lib/markdown-lite";

export async function generateStaticParams() {
  const products = await getActiveProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.meta_title || product.title,
    description: product.meta_description || product.short_description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.title,
      description: product.short_description,
      images: product.images.map((img) => ({ url: img })),
    },
    twitter: {
      card: "summary_large_image",
    },
    other: {
      "product:price:amount": product.price.toFixed(2),
      "product:price:currency": "GBP",
      "product:availability": product.stock_status === "out_of_stock" ? "out of stock" : "in stock",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.is_active) notFound();

  const related = await getRelatedProducts(product);
  const primaryCategoryPath = product.category_slugs[0];
  const categoryTrail = primaryCategoryPath ? getBreadcrumbTrail(primaryCategoryPath) : [];

  const jsonLd = productJsonLd(product);
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    ...categoryTrail.map((c) => ({ name: c.name, url: `/${c.path}` })),
    { name: product.title, url: `/product/${product.slug}` },
  ]);
  const faqSchema = product.faqs && product.faqs.length > 0 ? faqJsonLd(product.faqs) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        {categoryTrail.map((c) => (
          <React.Fragment key={c.path}>
            <ChevronRight className="size-3.5" />
            <Link href={`/${c.path}`} className="hover:text-foreground">
              {c.name}
            </Link>
          </React.Fragment>
        ))}
        <ChevronRight className="size-3.5" />
        <span className="text-foreground line-clamp-1">{product.title}</span>
      </nav>

      <ProductPurchaseSection
        product={toPublicProduct(product)}
        categoryName={primaryCategoryPath ? getCategoryByPath(primaryCategoryPath)?.name ?? null : null}
      />

      <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="prose-content flex flex-col gap-4 text-gray-500">
            {renderRichText(product.description)}
          </div>

          {product.faqs && product.faqs.length > 0 && (
            <div className="mt-10">
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="mt-4">
                {product.faqs.map((faq) => (
                  <AccordionItem key={faq.question} value={faq.question}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{renderRichText(faq.answer)}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">Specifications</h2>

          {product.hasVariants &&
            product.variants &&
            (product.variantType === "size" || product.variantType === "size-colour") && (
              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Size</th>
                      <th className="px-4 py-2.5 font-medium">Dimensions</th>
                      <th className="px-4 py-2.5 text-right font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {distinctSizes(product.variants).map(({ size, sizeLabel }) => {
                      const variant = product.variants!.find((v) => v.size === size);
                      return (
                        <tr key={size}>
                          <td className="px-4 py-2.5 font-medium text-foreground">{size}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {sizeLabel?.replace(`${size} `, "").replace(/[()]/g, "") || "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium text-foreground">
                            {variant ? formatPrice(variant.price) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          <dl className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted-foreground">{key}</dt>
                <dd className="text-right font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-14">
        <h2 className="font-heading text-2xl font-semibold text-foreground">Reviews</h2>
        <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-gray-100/40 py-12 text-center">
          <div className="flex gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star key={idx} className="size-4 fill-current" />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            No reviews yet. Be the first to share your experience once your order arrives.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="font-heading text-2xl font-semibold text-foreground">You Might Also Like</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={toPublicProduct(item)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
