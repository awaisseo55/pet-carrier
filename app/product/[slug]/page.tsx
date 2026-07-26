import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, ShieldCheck, RotateCcw, Truck, Star } from "lucide-react";
import { ProductGallery } from "@/components/product/product-gallery";
import { AddToCart } from "@/components/product/add-to-cart";
import { ProductCard } from "@/components/shop/product-card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getActiveProducts, getProductBySlug, getRelatedProducts } from "@/lib/products";
import { breadcrumbJsonLd, faqJsonLd, productJsonLd } from "@/lib/seo";
import { PRODUCT_PLACEHOLDER } from "@/lib/constants";
import { getBreadcrumbTrail, getCategoryByPath } from "@/lib/categories";
import { formatPrice } from "@/lib/utils";
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

const stockLabel = {
  in_stock: { label: "In stock", variant: "success" as const },
  low_stock: { label: "Only a few left", variant: "warning" as const },
  out_of_stock: { label: "Out of stock", variant: "outline" as const },
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.is_active) notFound();

  const related = await getRelatedProducts(product);
  const stock = stockLabel[product.stock_status];
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

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery
          images={product.images.length > 0 ? product.images : [PRODUCT_PLACEHOLDER]}
          title={product.title}
        />

        <div>
          {primaryCategoryPath && (
            <span className="text-sm font-medium uppercase tracking-wide text-blue-600">
              {getCategoryByPath(primaryCategoryPath)?.name}
            </span>
          )}
          <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">
            {product.title}
          </h1>

          <div className="mt-4 flex items-center gap-3">
            <span
              className={`text-2xl font-semibold ${product.compare_at_price ? "text-alert" : "text-foreground"}`}
            >
              {formatPrice(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
            <Badge variant={stock.variant}>{stock.label}</Badge>
          </div>

          <p className="mt-4 text-gray-500">{product.short_description}</p>

          <div className="mt-6">
            <AddToCart product={product} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 rounded-lg bg-gray-100/60 p-4 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-sm">
              <Truck className="size-4 shrink-0 text-blue-700" />
              Free UK shipping over £50
            </div>
            <div className="flex items-center gap-2 text-sm">
              <RotateCcw className="size-4 shrink-0 text-blue-700" />
              30-day returns
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="size-4 shrink-0 text-blue-700" />
              Secure checkout
            </div>
          </div>

          <div className="mt-8">
            <h2 className="font-heading text-lg font-semibold">Features</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {product.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-500">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

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
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
