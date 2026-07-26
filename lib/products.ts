import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { PetType, Product } from "./types";

const PRODUCTS_FILE = path.join(process.cwd(), "data", "products.json");

export async function getAllProducts(): Promise<Product[]> {
  const raw = await fs.readFile(PRODUCTS_FILE, "utf-8");
  return JSON.parse(raw) as Product[];
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

export async function getProductsByCategory(category: PetType): Promise<Product[]> {
  const products = await getActiveProducts();
  return products.filter((p) => p.category === category);
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const products = await getActiveProducts();
  const featured = products.filter((p) => p.is_featured);
  const list = featured.length > 0 ? featured : products;
  return list.slice(0, limit);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const products = await getActiveProducts();
  return products
    .filter((p) => p.category === product.category && p.id !== product.id)
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
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
  );
}

export async function saveAllProducts(products: Product[]): Promise<void> {
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
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
