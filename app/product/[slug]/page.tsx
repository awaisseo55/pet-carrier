import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { ProductPurchaseSection } from "@/components/product/product-purchase-section";
import { ProductCard } from "@/components/shop/product-card";
import { ReviewsSection } from "@/components/product/reviews-section";
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
import { getApprovedReviewsByProduct, toPublicReview } from "@/lib/reviews";
import type { ProductRatingStats } from "@/lib/types";

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

  const approvedReviews = await getApprovedReviewsByProduct(product.id);
  // Aggregate numbers come from the cached fields on the product record
  // (kept in sync by lib/reviews.ts's syncProductRatingStats on every review
  // create/status-change/delete), not recalculated from the full reviews
  // list on every page load.
  const ratingStats: ProductRatingStats = {
    averageRating: product.averageRating ?? 0,
    reviewCount: product.reviewCount ?? 0,
    ratingBreakdown: product.ratingBreakdown ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };
  const REVIEWS_PAGE_SIZE = 10;
  const publicReviews = approvedReviews.map(toPublicReview);
  const firstPageReviews = publicReviews.slice(0, REVIEWS_PAGE_SIZE);
  const reviewsHasMore = publicReviews.length > REVIEWS_PAGE_SIZE;

  const jsonLd = productJsonLd(product, {
    averageRating: ratingStats.averageRating,
    reviewCount: ratingStats.reviewCount,
    reviews: approvedReviews.map((r) => ({
      rating: r.rating,
      authorName: r.authorName,
      createdAt: r.createdAt,
      body: r.body,
    })),
  });
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    ...categoryTrail.map((c) => ({ name: c.name, url: `/${c.path}` })),
    { name: product.title, url: `/product/${product.slug}` },
  ]);
  const faqSchema = product.faqs && product.faqs.length > 0 ? faqJsonLd(product.faqs) : null;

  const descriptionBody = (
    <div className="prose-content flex flex-col gap-4 text-gray-500">
      {renderRichText(product.description)}
    </div>
  );

  const specificationsBody = (
    <>
      {product.hasVariants &&
        product.variants &&
        (product.variantType === "size" || product.variantType === "size-colour") && (
          <div className="overflow-x-auto rounded-lg border border-border">
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
    </>
  );

  const faqBody =
    product.faqs && product.faqs.length > 0 ? (
      <Accordion type="single" collapsible className="mt-4">
        {product.faqs.map((faq) => (
          <AccordionItem key={faq.question} value={faq.question}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{renderRichText(faq.answer)}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    ) : null;

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

      {/* Mobile/tablet: Specifications, then Description, then FAQ, each collapsed behind a
          chevron so the page doesn't open on a wall of text. A separate stack from the desktop
          grid below since the two need a different section order, not just different styling. */}
      <div className="mt-14 flex flex-col divide-y divide-border border-t border-border lg:hidden">
        <Accordion type="single" collapsible>
          <AccordionItem value="specifications" className="border-b-0">
            <AccordionTrigger className="font-heading text-lg font-semibold text-foreground">
              Specifications
            </AccordionTrigger>
            <AccordionContent>{specificationsBody}</AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion type="single" collapsible defaultValue="description">
          <AccordionItem value="description">
            <AccordionTrigger className="font-heading text-lg font-semibold text-foreground">
              Description
            </AccordionTrigger>
            <AccordionContent>{descriptionBody}</AccordionContent>
          </AccordionItem>
        </Accordion>

        {faqBody && (
          <div className="pt-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Frequently Asked Questions
            </h2>
            {faqBody}
          </div>
        )}
      </div>

      {/* Desktop: shown in full, there's room for it. */}
      <div className="mt-14 hidden gap-10 lg:grid lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-heading text-2xl font-semibold text-foreground">Description</h2>
          <div className="mt-4">{descriptionBody}</div>

          {faqBody && (
            <div className="mt-10">
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                Frequently Asked Questions
              </h2>
              {faqBody}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">Specifications</h2>
          <div className="mt-4">{specificationsBody}</div>
        </div>
      </div>

      <div id="reviews" className="mt-14 scroll-mt-24">
        <ReviewsSection
          productId={product.id}
          productSlug={product.slug}
          initialReviews={firstPageReviews}
          initialStats={ratingStats}
          initialHasMore={reviewsHasMore}
        />
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
