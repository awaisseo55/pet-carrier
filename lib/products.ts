import "server-only";
import type { Product } from "./types";
import { getHomepageSettings } from "./homepage";
import { readJsonFile, writeJsonFile } from "./data-store";

export async function getAllProducts(): Promise<Product[]> {
  return readJsonFile<Product[]>("products.json");
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
