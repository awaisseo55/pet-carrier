import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, ChevronRight, PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CATEGORIES, type Section } from "@/lib/categories";
import { getBreadcrumbNodes, getChildNodes, getRelatedNodes, getResolvedCategory } from "@/lib/category-store";
import { getProductById, getProductsByCategoryIncludingDescendants } from "@/lib/products";
import { getCategoryImageUrl } from "@/lib/placeholders";
import { breadcrumbJsonLd, collectionPageJsonLd, faqJsonLd } from "@/lib/seo";

function fullPathFrom(section: string, path?: string[]): string {
  return path && path.length > 0 ? `${section}/${path.join("/")}` : section;
}

export async function generateStaticParams() {
  return CATEGORIES.map((node) => {
    const segments = node.path.split("/");
    const [section, ...rest] = segments;
    return { section, path: rest.length > 0 ? rest : undefined };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string; path?: string[] }>;
}): Promise<Metadata> {
  const { section, path } = await params;
  const fullPath = fullPathFrom(section, path);
  const resolved = await getResolvedCategory(fullPath);
  if (!resolved) return {};

  return {
    title: resolved.metaTitle,
    description: resolved.metaDescription,
    alternates: { canonical: `/${fullPath}` },
    openGraph: {
      title: resolved.metaTitle,
      description: resolved.metaDescription,
      images: resolved.image ? [{ url: resolved.image }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ section: string; path?: string[] }>;
}) {
  const { section, path } = await params;

  if (!["carriers", "strollers", "beds"].includes(section)) notFound();

  const fullPath = fullPathFrom(section, path);
  const resolved = await getResolvedCategory(fullPath);
  if (!resolved) notFound();

  const [breadcrumbTrail, children, related, products, categoryImage] = await Promise.all([
    getBreadcrumbNodes(fullPath),
    getChildNodes(fullPath),
    getRelatedNodes(fullPath),
    getProductsByCategoryIncludingDescendants(fullPath),
    getCategoryImageUrl(fullPath),
  ]);

  // Featured products pinned by admin for this category, if any, shown first.
  const featuredProducts = (
    await Promise.all(resolved.featuredProductIds.map((id) => getProductById(id)))
  ).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const featuredIds = new Set(featuredProducts.map((p) => p.id));
  const orderedProducts = [...featuredProducts, ...products.filter((p) => !featuredIds.has(p.id))];

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    ...breadcrumbTrail.map((c) => ({ name: c.name, url: `/${c.path}` })),
  ]);
  const collectionSchema = collectionPageJsonLd({
    name: resolved.name,
    description: resolved.metaDescription,
    url: `/${fullPath}`,
    itemNames: orderedProducts.map((p) => p.title),
  });
  const faqSchema = faqJsonLd(resolved.faqs);

  const sectionLabels: Record<Section, string> = { carriers: "Carriers", strollers: "Strollers", beds: "Beds" };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        {breadcrumbTrail.map((c) => (
          <span key={c.path} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5" />
            <Link href={`/${c.path}`} className="hover:text-foreground">
              {c.name}
            </Link>
          </span>
        ))}
      </nav>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{resolved.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{sectionLabels[section as Section]}</p>
        </div>
        <div className="relative hidden aspect-video w-full overflow-hidden rounded-lg shadow-sm lg:block">
          <Image src={categoryImage.url} alt={`${resolved.name}`} fill sizes="320px" className="object-cover" />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 text-gray-600">
        {resolved.intro.split("\n\n").map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {children.length > 0 && (
        <div className="mt-10">
          <h2 className="font-heading text-xl font-semibold text-foreground">Shop {resolved.name} by Type</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {children.map((child) => (
              <Link
                key={child.path}
                href={`/${child.path}`}
                className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
              >
                <span className="font-medium text-foreground">{child.name}</span>
                <ArrowRight className="size-4 shrink-0 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-foreground">Shop {resolved.name}</h2>
        {orderedProducts.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {orderedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-gray-50 py-16 text-center">
            <PackageSearch className="size-10 text-gray-400" />
            <p className="font-medium text-foreground">New products coming soon, check back very soon</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              We’re adding {resolved.name.toLowerCase()} to the shop. In the meantime, have a look at our featured
              carrier or browse related categories below.
            </p>
            <Link href="/product/premium-multi-purpose-pet-carrier" className="text-sm font-medium text-emerald-700 hover:underline">
              View our featured carrier &rarr;
            </Link>
          </div>
        )}
      </div>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground">Why Choose a {resolved.name.replace(/s$/, "")}</h2>
          <div className="mt-3 flex flex-col gap-3 text-gray-600">
            {resolved.whyChoose.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground">Sizing and Buying Guide</h2>
          <p className="mt-3 text-gray-600">{resolved.sizingGuide}</p>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-heading text-xl font-semibold text-foreground">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="mt-4">
          {resolved.faqs.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="font-heading text-xl font-semibold text-foreground">Related Categories</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((cat) => (
              <Link
                key={cat.path}
                href={`/${cat.path}`}
                className="rounded-lg border border-border bg-card p-4 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12">
        <h2 className="font-heading text-xl font-semibold text-foreground">From the Blog</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We haven’t published a blog post for this category yet, check back soon.
        </p>
      </div>
    </div>
  );
}
