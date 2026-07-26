import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShopClient } from "@/components/shop/shop-client";
import { getProductsByCategory } from "@/lib/products";
import { breadcrumbJsonLd } from "@/lib/seo";
import type { PetType } from "@/lib/types";

const CATEGORY_COPY: Record<PetType, { label: string; description: string }> = {
  dogs: {
    label: "Dog Carriers",
    description:
      "Soft-sided, wheeled and hard-shell carriers built for dogs of every size, from lap dogs to larger breeds on longer journeys.",
  },
  cats: {
    label: "Cat Carriers",
    description:
      "Calm, secure carriers designed to keep nervous cats settled, with top-loading options and enclosed designs.",
  },
  "small-animals": {
    label: "Small Animal Carriers",
    description:
      "Well-ventilated carriers sized for rabbits, guinea pigs, hamsters and other small pets, built for short, low-stress trips.",
  },
  birds: {
    label: "Bird Carriers",
    description:
      "Travel cages and soft carriers for small to medium birds, with secure perches and thoughtful ventilation.",
  },
};

const VALID_CATEGORIES = Object.keys(CATEGORY_COPY) as PetType[];

export function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const copy = CATEGORY_COPY[category as PetType];
  if (!copy) return {};
  return {
    title: copy.label,
    description: copy.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const copy = CATEGORY_COPY[category as PetType];
  if (!copy) notFound();

  const products = await getProductsByCategory(category as PetType);
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    { name: copy.label, url: `/shop/${category}` },
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
          {copy.label}
        </h1>
        <p className="mt-2 max-w-2xl text-brown-soft">{copy.description}</p>
      </div>
      <Suspense>
        <ShopClient products={products} lockedCategory={category as PetType} />
      </Suspense>
    </div>
  );
}
