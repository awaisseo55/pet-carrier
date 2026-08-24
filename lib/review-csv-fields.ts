/**
 * Client-safe CSV field definitions and column auto-detection for the
 * reviews importer, mirroring the split used for products (lib/csv-fields.ts
 * + lib/csv-import.ts): this file has no "server-only" import so the admin
 * upload UI can use it directly, while lib/review-csv-import.ts (server-only)
 * does the actual product lookup and review creation.
 */

export const REVIEW_FIELDS = [
  { value: "product_match", label: "Product Slug, ASIN or Product ID", required: true },
  { value: "rating", label: "Rating (1-5)", required: true },
  { value: "body", label: "Review Text", required: true },
  { value: "title", label: "Review Title", required: false },
  { value: "author_name", label: "Reviewer Name", required: false },
  { value: "author_email", label: "Reviewer Email (internal only, never shown publicly)", required: false },
  { value: "created_at", label: "Review Date", required: false },
  { value: "ignore", label: "Do not import this column", required: false },
] as const;

export type ReviewField = (typeof REVIEW_FIELDS)[number]["value"];

const FIELD_ALIASES: Record<ReviewField, string[]> = {
  product_match: ["product slug", "slug", "asin", "product id", "product", "sku"],
  rating: ["rating", "stars", "star rating", "score"],
  body: ["review text", "review body", "body", "review", "comment", "content"],
  title: ["review title", "title", "headline"],
  author_name: ["reviewer name", "author name", "name", "customer name", "reviewer"],
  author_email: ["reviewer email", "author email", "email"],
  created_at: ["review date", "date", "created at", "created_at"],
  ignore: [],
};

/** Guesses a review field for each CSV header, used to pre-fill the mapping UI. Same exact-alias-then-longest-substring strategy as detectColumnMapping in lib/csv-fields.ts. */
export function detectReviewColumnMapping(headers: string[]): Record<string, ReviewField> {
  const mapping: Record<string, ReviewField> = {};

  for (const header of headers) {
    const lower = header.trim().toLowerCase();

    let matched: ReviewField = "ignore";
    for (const field of REVIEW_FIELDS) {
      if (field.value === "ignore") continue;
      if (FIELD_ALIASES[field.value].some((alias) => lower === alias)) {
        matched = field.value;
        break;
      }
    }

    if (matched === "ignore") {
      let bestAliasLength = 0;
      for (const field of REVIEW_FIELDS) {
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
