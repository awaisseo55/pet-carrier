import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, ChevronRight, PackageSearch } from "lucide-react";
import { CategoryFilters } from "@/components/category/CategoryFilters";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CATEGORIES, type Section } from "@/lib/categories";
import { getBreadcrumbNodes, getChildNodes, getRelatedNodes, getResolvedCategory } from "@/lib/category-store";
import { getRelevantBlogPosts } from "@/lib/blog";
import {
  getFeaturedProducts,
  getProductById,
  getProductsByCategoryIncludingDescendants,
  getProductSource,
  toPublicProduct,
} from "@/lib/products";
import { breadcrumbJsonLd, collectionPageJsonLd, faqJsonLd } from "@/lib/seo";
import { renderRichText } from "@/lib/markdown-lite";

// Belt-and-braces alongside the on-demand revalidatePath() calls in
// lib/revalidate.ts (which fire immediately after an admin save): a ceiling
// so the page is never more than 5 minutes stale even if one is ever missed.
export const revalidate = 300;

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

  if (!["carriers"].includes(section)) notFound();

  const fullPath = fullPathFrom(section, path);
  const resolved = await getResolvedCategory(fullPath);
  if (!resolved) notFound();

  const [breadcrumbTrail, children, related, products, relevantPosts] = await Promise.all([
    getBreadcrumbNodes(fullPath),
    getChildNodes(fullPath),
    getRelatedNodes(fullPath),
    getProductsByCategoryIncludingDescendants(fullPath),
    getRelevantBlogPosts(fullPath),
  ]);

  // Featured products pinned by admin for this category, if any, shown first.
  const featuredProducts = (
    await Promise.all(resolved.featuredProductIds.map((id) => getProductById(id)))
  ).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const featuredIds = new Set(featuredProducts.map((p) => p.id));
  const remaining = products.filter((p) => !featuredIds.has(p.id));
  // Temu-sourced products carry a better margin, so they're surfaced ahead of
  // Amazon-sourced ones in this default ("Featured") ordering, admin-pinned
  // picks above still take absolute priority. Only affects this default view,
  // an explicit sort (price, newest, etc.) overrides it, see sortProducts().
  const temuFirst = remaining.filter((p) => getProductSource(p) === "temu");
  const amazonRest = remaining.filter((p) => getProductSource(p) !== "temu");
  const orderedProducts = [...featuredProducts, ...temuFirst, ...amazonRest];

  // Only needed for the empty-grid state's "view our featured carrier"
  // fallback link, so only fetched when there's actually nothing to show,
  // resolved to a real, currently active product rather than a hardcoded
  // slug that can silently go stale and 404 if that product is ever removed.
  const fallbackFeaturedProduct =
    orderedProducts.length === 0 ? (await getFeaturedProducts(1))[0] : undefined;

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    ...breadcrumbTrail.map((c) => ({ name: c.name, url: `/${c.path}` })),
  ]);
  const collectionSchema = collectionPageJsonLd({
    name: resolved.name,
    description: resolved.metaDescription,
    url: `/${fullPath}`,
    items: orderedProducts.map((p) => ({ name: p.title, url: `/product/${p.slug}` })),
  });
  const faqSchema = faqJsonLd(resolved.faqs);

  const sectionLabels: Record<Section, string> = { carriers: "Carriers" };

  // Only a short opening paragraph sits above the product grid; the rest of
  // the intro (buying considerations, "who this suits" etc.) reads better
  // once someone has already seen what's on offer, so it moves below the
  // grid alongside Why Choose/Sizing Guide rather than delaying the products.
  // The full intro renders below the product grid rather than above it: on a
  // category page the products are the conversion surface, and a lead
  // paragraph plus a category photo was pushing them roughly two screens down
  // on a phone. Nothing is dropped, so the page keeps all of its copy for SEO.
  const fullIntro = resolved.intro.trim();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-gray-500 sm:mb-7">
        <Link href="/" className="transition-colors hover:text-forest-700">
          Home
        </Link>
        {breadcrumbTrail.map((c) => (
          <span key={c.path} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5" />
            <Link href={`/${c.path}`} className="transition-colors hover:text-forest-700">
              {c.name}
            </Link>
          </span>
        ))}
      </nav>

      <div>
        <span className="text-[0.7rem] font-bold tracking-[0.16em] text-ember-600 uppercase">
          {sectionLabels[section as Section]}
        </span>
        <h1 className="mt-2 text-3xl leading-[1.08] text-forest-800 sm:text-4xl">{resolved.name}</h1>
        <span className="mt-4 block h-[3px] w-14 rounded-full bg-ember-500" />
        {orderedProducts.length > 0 && (
          <p className="mt-3 text-sm font-medium text-gray-500">
            {orderedProducts.length} carrier{orderedProducts.length === 1 ? "" : "s"} in this range
          </p>
        )}
      </div>

      {children.length > 0 && (
        <div className="mt-8 sm:mt-10">
          <h2 className="text-2xl text-forest-800 sm:text-3xl">Shop {resolved.name} by type</h2>
          <span className="mt-4 mb-5 block h-[3px] w-14 rounded-full bg-ember-500 sm:mb-6" />
          <div className="scrollbar-thin -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
            {children.map((child) => (
              <Link
                key={child.path}
                href={`/${child.path}`}
                className="group flex w-[62%] shrink-0 snap-start items-center justify-between gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-1 hover:border-forest-300 hover:shadow-lg sm:w-auto sm:p-5"
              >
                <span className="text-sm font-bold text-forest-800">{child.name}</span>
                <ArrowRight className="size-4 shrink-0 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:text-forest-600" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 sm:mt-10">
        <h2 className="text-2xl text-forest-800 sm:text-3xl">Shop {resolved.name}</h2>
        <span className="mt-4 block h-[3px] w-14 rounded-full bg-ember-500" />
        {orderedProducts.length > 0 ? (
          <div className="mt-6">
            <CategoryFilters products={orderedProducts.map(toPublicProduct)} />
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-[2rem] bg-forest-100 py-16 text-center">
            <PackageSearch className="size-9 text-forest-600" strokeWidth={1.5} />
            <p className="text-xl text-forest-800">New products coming soon</p>
            <p className="max-w-sm text-sm text-forest-800/70">
              We’re adding {resolved.name.toLowerCase()} to the shop. In the meantime, have a look at our featured
              carrier or browse related categories below.
            </p>
            {fallbackFeaturedProduct && (
              <Link
                href={`/product/${fallbackFeaturedProduct.slug}`}
                className="mt-1 inline-flex items-center gap-1 rounded-xl bg-forest-800 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-forest-900"
              >
                View our featured carrier &rarr;
              </Link>
            )}
          </div>
        )}
      </div>

      {fullIntro && (
        <div className="mt-12 max-w-3xl">
          <h2 className="text-2xl text-forest-800 sm:text-3xl">More about {resolved.name.toLowerCase()}</h2>
          <div className="mt-3 flex flex-col gap-4 text-gray-600">{renderRichText(fullIntro)}</div>
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl text-forest-800 sm:text-3xl">Why choose a {resolved.name.replace(/s$/, "").toLowerCase()}</h2>
          <div className="mt-3 flex flex-col gap-3 text-gray-600">
            {resolved.whyChoose.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-2xl text-forest-800 sm:text-3xl">Sizing and buying guide</h2>
          <p className="mt-3 text-gray-600">{resolved.sizingGuide}</p>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl text-forest-800 sm:text-3xl">Frequently asked questions</h2>
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
          <h2 className="text-2xl text-forest-800 sm:text-3xl">Related categories</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((cat) => (
              <Link
                key={cat.path}
                href={`/${cat.path}`}
                className="rounded-lg border border-border bg-card p-4 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:border-forest-400 hover:shadow-md"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {relevantPosts.length > 0 && (
        <div className="mt-12">
          <h2 className="font-heading text-xl font-semibold text-foreground">From the Blog</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {relevantPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex gap-4 rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-forest-400 hover:shadow-md"
              >
                <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-md">
                  <Image src={post.cover_image} alt={post.title} fill sizes="80px" className="object-cover" />
                </div>
                <div>
                  <p className="font-medium text-foreground group-hover:text-forest-700">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
