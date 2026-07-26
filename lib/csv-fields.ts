/**
 * Client-safe CSV field definitions and column auto-detection, shared
 * between the admin upload UI and the server-side processing in
 * lib/csv-import.ts (which additionally needs "server-only" access to the
 * filesystem, image downloads and AI content generation).
 */

export const PRODUCT_FIELDS = [
  { value: "title", label: "Product Name / Title", required: true },
  { value: "sku", label: "SKU / ASIN", required: false },
  { value: "brand", label: "Brand", required: false },
  { value: "price", label: "Price", required: true },
  { value: "compare_at_price", label: "Compare-at Price / Original Price", required: false },
  { value: "short_description", label: "Short Description", required: false },
  { value: "description", label: "Long Description", required: false },
  { value: "main_image", label: "Main Image URL", required: false },
  { value: "image_2", label: "Additional Image URL 1", required: false },
  { value: "image_3", label: "Additional Image URL 2", required: false },
  { value: "image_4", label: "Additional Image URL 3", required: false },
  { value: "image_5", label: "Additional Image URL 4", required: false },
  { value: "image_6", label: "Additional Image URL 5", required: false },
  { value: "category", label: "Category (e.g. Carriers > Dog Carriers)", required: false },
  { value: "tags", label: "Tags", required: false },
  { value: "stock_status", label: "Stock Status", required: false },
  { value: "weight", label: "Weight", required: false },
  { value: "dimensions", label: "Dimensions", required: false },
  { value: "features", label: "Features (comma separated)", required: false },
  { value: "specifications", label: "Specifications (key:value pairs)", required: false },
  { value: "meta_title", label: "SEO Meta Title", required: false },
  { value: "meta_description", label: "SEO Meta Description", required: false },
  { value: "amazon_url", label: "Amazon URL", required: false },
  { value: "ignore", label: "Do not import this column", required: false },
] as const;

export type ProductField = (typeof PRODUCT_FIELDS)[number]["value"];

/** Common column names used by Helium 10, AMZScout, Jungle Scout exports and manual spreadsheets. */
const FIELD_ALIASES: Record<ProductField, string[]> = {
  title: ["product name", "title", "name", "product title"],
  sku: ["sku", "asin"],
  brand: ["brand"],
  price: ["price", "buy box price", "sale price"],
  compare_at_price: ["compare-at price", "compare at price", "original price", "was price", "rrp", "msrp"],
  short_description: ["short description"],
  description: ["long description", "description"],
  main_image: ["main image url", "image", "main image", "product image", "image url"],
  image_2: ["additional image url 1", "image 2"],
  image_3: ["additional image url 2", "image 3"],
  image_4: ["additional image url 3", "image 4"],
  image_5: ["additional image url 4", "image 5"],
  image_6: ["additional image url 5", "image 6"],
  category: ["category", "category path"],
  tags: ["tags"],
  stock_status: ["stock status", "stock"],
  weight: ["weight"],
  dimensions: ["dimensions"],
  features: ["features"],
  specifications: ["specifications"],
  meta_title: ["seo meta title", "meta title"],
  meta_description: ["seo meta description", "meta description"],
  amazon_url: ["amazon url", "product url"],
  ignore: [],
};

/** Guesses a product field for each CSV header, used to pre-fill the mapping UI. */
export function detectColumnMapping(headers: string[]): Record<string, ProductField> {
  const mapping: Record<string, ProductField> = {};

  for (const header of headers) {
    const lower = header.trim().toLowerCase();

    // Exact alias matches take priority over substring matches, and are
    // checked across every field first, so e.g. a "Price" column can't be
    // stolen by a field whose array position happens to come first.
    let matched: ProductField = "ignore";
    for (const field of PRODUCT_FIELDS) {
      if (field.value === "ignore") continue;
      if (FIELD_ALIASES[field.value].some((alias) => lower === alias)) {
        matched = field.value;
        break;
      }
    }

    // Fall back to substring matching, preferring the longest matching
    // alias (the most specific one) rather than the first field checked.
    // This stops e.g. "Original Price" matching "price" ahead of the more
    // specific "original price" alias on compare_at_price, and "Additional
    // Image URL 1" matching main_image's "image url" alias.
    if (matched === "ignore") {
      let bestAliasLength = 0;
      for (const field of PRODUCT_FIELDS) {
        if (field.value === "ignore") continue;
        for (const alias of FIELD_ALIASES[field.value]) {
          if (lower.includes(alias) && alias.length > bestAliasLength) {
            bestAliasLength = alias.length;
            matched = field.value;
          }
        }
      }
    }

    mapping[header] = matched;
  }

  return mapping;
}
