import "server-only";
import type { Product, ProductRatingStats, PublicProduct } from "./types";
import { getHomepageSettings } from "./homepage";
import { readJsonFile, writeJsonFile } from "./data-store";
import { extractAsin } from "./amazon";

export async function getAllProducts(): Promise<Product[]> {
  return readJsonFile<Product[]>("products.json");
}

/** Strips the internal `amazon_url` fulfilment link (product-level and per-variant) before a product crosses into a public "use client" component. */
export function toPublicProduct(product: Product): PublicProduct {
  const { amazon_url: _amazon_url, variants, ...rest } = product;
  return {
    ...rest,
    variants: variants?.map(({ amazonUrl: _amazonUrl, ...variant }) => variant),
  };
}

function asinFromProduct(product: Product): string | null {
  if (product.amazon_asin) return product.amazon_asin.toUpperCase();
  if (product.amazon_url) return extractAsin(product.amazon_url);
  return null;
}

/**
 * Finds an existing product sourced from the same Amazon listing, matching
 * on ASIN (extracted from either the stored amazon_url or amazon_asin field)
 * so tracking-parameter differences between two URLs for the same product
 * don't cause a false negative. Used to block duplicate creation across every
 * admin product-creation entry point (manual, Amazon fetch, bulk URLs, CSV).
 */
export async function findProductByAsin(asin: string): Promise<Product | undefined> {
  const normalized = asin.toUpperCase();
  const products = await getAllProducts();
  return products.find((p) => asinFromProduct(p) === normalized);
}

export async function findProductByAmazonUrl(url: string): Promise<Product | undefined> {
  const asin = extractAsin(url);
  if (!asin) return undefined;
  return findProductByAsin(asin);
}

export async function getActiveProducts(): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter((p) => p.is_active);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getAllProducts();
  return products.find((p) => p.slug === slug);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await getAllProducts();
  return products.find((p) => p.id === id);
}

export async function getProductsByCategory(categoryPath: string): Promise<Product[]> {
  const products = await getActiveProducts();
  return products.filter((p) => p.category_slugs.includes(categoryPath));
}

/** Same as getProductsByCategory but also includes products tagged with any descendant category, so hub pages (e.g. "carriers/dog-carriers") show products from their subcategories too. */
export async function getProductsByCategoryIncludingDescendants(categoryPath: string): Promise<Product[]> {
  const products = await getActiveProducts();
  const prefix = `${categoryPath}/`;
  return products.filter((p) => p.category_slugs.some((c) => c === categoryPath || c.startsWith(prefix)));
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const products = await getActiveProducts();
  const homepage = await getHomepageSettings();

  if (homepage.featured_product_id) {
    const pinned = products.find((p) => p.id === homepage.featured_product_id);
    if (pinned) {
      const rest = products.filter((p) => p.id !== pinned.id);
      return [pinned, ...rest].slice(0, limit);
    }
  }

  const featured = products.filter((p) => p.is_featured);
  const list = featured.length > 0 ? featured : products;
  return list.slice(0, limit);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const products = await getActiveProducts();
  return products
    .filter((p) => p.id !== product.id && p.category_slugs.some((c) => product.category_slugs.includes(c)))
    .slice(0, limit);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const products = await getActiveProducts();
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.short_description.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  );
}

export async function saveAllProducts(products: Product[]): Promise<void> {
  await writeJsonFile("products.json", products);
}

export async function upsertProduct(product: Product): Promise<void> {
  const products = await getAllProducts();
  const index = products.findIndex((p) => p.id === product.id);
  if (index >= 0) {
    products[index] = product;
  } else {
    products.push(product);
  }
  await saveAllProducts(products);
}

/** Patches just the cached rating fields on a product, called by lib/reviews.ts's syncProductRatingStats after any review create/status-change/delete so product listings never need to recompute aggregates from the full reviews list on read. */
export async function updateProductRatingStats(productId: string, stats: ProductRatingStats): Promise<void> {
  const products = await getAllProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) return;
  product.averageRating = stats.averageRating;
  product.reviewCount = stats.reviewCount;
  product.ratingBreakdown = stats.ratingBreakdown;
  await saveAllProducts(products);
}

export async function deleteProduct(id: string): Promise<void> {
  const products = await getAllProducts();
  await saveAllProducts(products.filter((p) => p.id !== id));
}

export function calculatePriceFromMarkup(basePrice: number, markupPercentage: number): number {
  return Math.round(basePrice * (1 + markupPercentage / 100) * 100) / 100;
}

// TODO: not yet active. Once order volume justifies the cost, wire this up to
// the Keepa API (KEEPA_API_KEY) to periodically refresh Amazon price and
// stock status for each product's amazon_asin, then call upsertProduct.
export async function syncProductWithKeepa(_asin: string): Promise<void> {
  throw new Error("Keepa sync is not yet implemented. See TODO in lib/products.ts.");
}
