import "server-only";
import { revalidatePath } from "next/cache";
import { getCategoryNode } from "./category-store";

/**
 * Pages are statically generated (generateStaticParams) so an admin save
 * doesn't show up on the live site until something tells Next.js to
 * regenerate the affected routes. These helpers call revalidatePath() for
 * exactly the routes a given save affects, right after each admin write
 * succeeds.
 */

/**
 * Revalidates a category page and every ancestor hub page above it.
 * getProductsByCategoryIncludingDescendants means a product tagged to e.g.
 * "carriers/dog-carriers/puppy-carriers" also renders on "/carriers/dog-carriers"
 * and "/carriers", so all three need to be invalidated, not just the leaf.
 */
async function revalidateCategoryAndAncestors(categoryPath: string): Promise<void> {
  let current: string | null = categoryPath;
  const seen = new Set<string>();
  while (current && !seen.has(current)) {
    seen.add(current);
    revalidatePath(`/${current}`);
    const node = await getCategoryNode(current);
    current = node?.parentPath ?? null;
  }
}

export async function revalidateProductPaths(product: { slug: string; category_slugs: string[] }): Promise<void> {
  revalidatePath("/");
  revalidatePath(`/product/${product.slug}`);
  revalidatePath("/sitemap.xml");
  await Promise.all(product.category_slugs.map(revalidateCategoryAndAncestors));
}

/**
 * For category create/edit/delete: the category's own page, plus its
 * immediate parent hub page (which lists it as a child category link) and
 * the sitemap. Unlike products, a category's own content doesn't show up on
 * ancestors further up than its direct parent, so no full chain-walk here.
 */
export function revalidateCategoryPaths(categoryPath: string, parentPath?: string | null): void {
  revalidatePath(`/${categoryPath}`);
  if (parentPath) revalidatePath(`/${parentPath}`);
  revalidatePath("/sitemap.xml");
}

export function revalidateBlogPaths(slug: string): void {
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/"); // homepage shows the latest 3 posts
  revalidatePath("/sitemap.xml");
}

export function revalidateHomepage(): void {
  revalidatePath("/");
}

/** Site settings (contact details, shipping thresholds, tax) are read from the root layout down, so invalidate the whole app. Also used by the admin "Publish All Changes" safety-net button. */
export function revalidateEverything(): void {
  revalidatePath("/", "layout");
}
