import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShopClient } from "@/components/shop/shop-client";
import { getProductsByCategory } from "@/lib/products";
import { breadcrumbJsonLd } from "@/lib/seo";
import { getCategory, CATEGORIES } from "@/lib/categories";
import { getCategoryImageUrl } from "@/lib/placeholders";
import type { PetType } from "@/lib/types";

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category: category.value }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const copy = getCategory(category as PetType);
  if (!copy) return {};
  return {
    title: `${copy.label} Carriers`,
    description: copy.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const copy = getCategory(category as PetType);
  if (!copy) notFound();

  const [products, categoryImage] = await Promise.all([
    getProductsByCategory(category as PetType),
    getCategoryImageUrl(category as PetType),
  ]);

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    { name: `${copy.label} Carriers`, url: `/shop/${category}` },
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <div className="mb-8 grid grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto]">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            {copy.label} Carriers
          </h1>
          <p className="mt-2 max-w-2xl text-brown-soft">{copy.description}</p>
        </div>
        <div className="relative hidden aspect-square w-32 shrink-0 overflow-hidden rounded-2xl shadow-warm sm:block">
          <Image
            src={categoryImage.url}
            alt={`${copy.label} carriers`}
            fill
            sizes="128px"
            className="object-cover"
          />
        </div>
      </div>
      <Suspense>
        <ShopClient products={products} lockedCategory={category as PetType} />
      </Suspense>
    </div>
  );
}
