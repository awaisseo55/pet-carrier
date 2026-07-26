import "server-only";
import type { CategoryNode, Section } from "./categories";
import { addCustomCategory, getAllCategoryNodes } from "./category-store";
import { downloadAndProcessImages } from "./image-pipeline";
import { calculatePriceFromMarkup, getAllProducts } from "./products";
import { generateProductContent } from "./ai-content";
import { slugify } from "./utils";
import { nanoid } from "nanoid";
import type { Product } from "./types";
import type { ProductField } from "./csv-fields";

export type { ProductField } from "./csv-fields";
export { PRODUCT_FIELDS, detectColumnMapping } from "./csv-fields";

/**
 * Resolves a category path string like "Carriers > Dog Carriers > Small Dog
 * Carriers" to an existing category path, creating any missing levels as
 * custom categories rather than failing the import.
 */
export async function resolveCategoryPath(categoryString: string): Promise<string | null> {
  if (!categoryString?.trim()) return null;

  const parts = categoryString
    .split(/[>/]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;

  const allNodes = await getAllCategoryNodes();
  const sectionName = parts[0].toLowerCase();
  const section = (["carriers", "strollers", "beds"] as Section[]).find(
    (s) => s === sectionName || s.startsWith(sectionName)
  );
  if (!section) return null;

  let parentPath: string = section;
  let currentLevel = 1;

  for (const part of parts.slice(1)) {
    const existing = allNodes.find(
      (n) => n.parentPath === parentPath && n.name.toLowerCase() === part.toLowerCase()
    );

    if (existing) {
      parentPath = existing.path;
      currentLevel += 1;
      continue;
    }

    // Create a new custom category at this point in the hierarchy.
    const slug = slugify(part);
    const newPath = `${parentPath}/${slug}`;
    const node: CategoryNode = {
      path: newPath,
      name: part,
      section,
      level: Math.min(currentLevel + 1, 3) as 2 | 3,
      parentPath,
      animal: "multiple pets",
      descriptor: `pets who need ${part.toLowerCase()}`,
      kind: "sub",
    };
    await addCustomCategory(node);
    allNodes.push(node);
    parentPath = newPath;
    currentLevel += 1;
  }

  return parentPath;
}

export interface CsvRowResult {
  row: number;
  ok: boolean;
  error?: string;
  product?: Product;
}

/**
 * Processes one mapped CSV row into a saved Product. Downloads images,
 * resolves categories (creating them if needed), applies default markup
 * when only a raw price is given, and optionally rewrites copy with Claude.
 */
export async function processCsvRow(
  rowIndex: number,
  data: Record<ProductField, string>,
  options: { defaultMarkupPercentage: number; useAI: boolean }
): Promise<CsvRowResult> {
  const title = data.title?.trim();
  if (!title) {
    return { row: rowIndex, ok: false, error: "Missing product name" };
  }

  const rawPrice = parseFloat((data.price || "").replace(/[^0-9.]/g, ""));
  if (!rawPrice || Number.isNaN(rawPrice)) {
    return { row: rowIndex, ok: false, error: "Missing or invalid price" };
  }

  const imageUrls = [data.main_image, data.image_2, data.image_3, data.image_4, data.image_5, data.image_6]
    .map((u) => u?.trim())
    .filter((u): u is string => Boolean(u) && /^https?:\/\//.test(u!));

  if (imageUrls.length === 0) {
    return { row: rowIndex, ok: false, error: "No valid image URL provided" };
  }

  const existingProducts = await getAllProducts();
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 2;
  while (existingProducts.some((p) => p.slug === slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const id = `PC-${nanoid(8).toUpperCase()}`;

  let downloadedImages: string[] = [];
  try {
    downloadedImages = await downloadAndProcessImages(id, imageUrls);
  } catch (error) {
    console.error(`Row ${rowIndex}: image download failed`, error);
  }
  if (downloadedImages.length === 0) {
    return { row: rowIndex, ok: false, error: "Could not download any of the provided image URLs" };
  }

  const categorySlugs: string[] = [];
  if (data.category) {
    const resolved = await resolveCategoryPath(data.category);
    if (resolved) categorySlugs.push(resolved);
  }
  if (categorySlugs.length === 0) {
    return { row: rowIndex, ok: false, error: "Could not resolve a category from the provided value" };
  }

  const rawCompareAtPrice = data.compare_at_price
    ? parseFloat(data.compare_at_price.replace(/[^0-9.]/g, ""))
    : null;

  const price = calculatePriceFromMarkup(rawPrice, options.defaultMarkupPercentage);
  // Apply the same markup so the comparison below is like-for-like: the CSV's
  // compare-at price is on the same raw-cost basis as rawPrice, not price.
  const compareAtPrice =
    rawCompareAtPrice && !Number.isNaN(rawCompareAtPrice)
      ? calculatePriceFromMarkup(rawCompareAtPrice, options.defaultMarkupPercentage)
      : null;

  let description = data.description?.trim() || "";
  let shortDescription = data.short_description?.trim() || "";
  let metaTitle = data.meta_title?.trim() || `${title} | Pet Carrier`;
  let metaDescription = data.meta_description?.trim() || "";
  let features = data.features
    ? data.features.split(",").map((f) => f.trim()).filter(Boolean)
    : [];

  if (options.useAI) {
    try {
      const generated = await generateProductContent({
        asin: data.sku || id,
        title,
        price: rawPrice,
        images: imageUrls,
        bullets: features,
        description,
        amazon_url: data.amazon_url || "",
      });
      description = generated.description;
      shortDescription = shortDescription || generated.short_description;
      metaTitle = data.meta_title?.trim() || generated.meta_title;
      metaDescription = metaDescription || generated.meta_description;
      features = generated.features.length > 0 ? generated.features : features;
      if (categorySlugs.length === 0) categorySlugs.push(...generated.suggested_category_slugs);
    } catch (error) {
      console.error(`Row ${rowIndex}: AI content generation failed, keeping raw CSV copy`, error);
    }
  }

  if (!shortDescription) shortDescription = description.slice(0, 160) || title;
  if (!metaDescription) metaDescription = shortDescription.slice(0, 155);

  const specifications: Record<string, string> = {};
  if (data.weight) specifications["Weight"] = data.weight;
  if (data.dimensions) specifications["Dimensions"] = data.dimensions;
  if (data.specifications) {
    for (const pair of data.specifications.split("|")) {
      const [key, value] = pair.split(":").map((s) => s?.trim());
      if (key && value) specifications[key] = value;
    }
  }

  const now = new Date().toISOString();
  const product: Product = {
    id,
    slug,
    title,
    description: description || `${title}, imported via CSV.`,
    short_description: shortDescription,
    features,
    specifications,
    price,
    compare_at_price: compareAtPrice && compareAtPrice > price ? compareAtPrice : null,
    sku: data.sku ? `PC-${data.sku}` : `PC-${id}`,
    stock_status: (data.stock_status?.toLowerCase().includes("out") ? "out_of_stock" : "in_stock") as Product["stock_status"],
    stock_count: 20,
    images: downloadedImages,
    category_slugs: categorySlugs,
    size_range: "Standard",
    weight_capacity: data.weight || "See listing",
    brand: data.brand || "Pet Carrier",
    amazon_asin: data.sku || "",
    amazon_url: data.amazon_url || "",
    is_active: true,
    is_featured: false,
    created_at: now,
    updated_at: now,
    markup_percentage: options.defaultMarkupPercentage,
    meta_title: metaTitle,
    meta_description: metaDescription,
  };

  return { row: rowIndex, ok: true, product };
}
