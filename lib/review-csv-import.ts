import "server-only";
import { findProductByAsin, getProductById, getProductBySlug } from "./products";
import { createReview } from "./reviews";
import type { Review } from "./types";
import type { ReviewField } from "./review-csv-fields";

export type { ReviewField } from "./review-csv-fields";
export { REVIEW_FIELDS, detectReviewColumnMapping } from "./review-csv-fields";

export interface ReviewCsvRowResult {
  row: number;
  ok: boolean;
  error?: string;
  review?: Review;
  productTitle?: string;
}

const ASIN_PATTERN = /^[A-Z0-9]{10}$/i;
const PRODUCT_ID_PATTERN = /^PC-[A-Z0-9]+$/i;

/**
 * Resolves a CSV row's product reference to exactly one existing product, or
 * fails the row. Tried in order: slug, internal product id, Amazon ASIN.
 * Deliberately exact-match only at every step, never a fuzzy/substring/title
 * match, so a review can never end up silently attached to the wrong
 * product, matching or not matching is unambiguous and easy to audit.
 */
async function resolveProduct(matchValue: string) {
  const value = matchValue.trim();
  if (!value) return undefined;

  const bySlug = await getProductBySlug(value);
  if (bySlug) return bySlug;

  if (PRODUCT_ID_PATTERN.test(value)) {
    const byId = await getProductById(value.toUpperCase());
    if (byId) return byId;
  }

  if (ASIN_PATTERN.test(value)) {
    const byAsin = await findProductByAsin(value);
    if (byAsin) return byAsin;
  }

  return undefined;
}

/**
 * Processes one mapped CSV row into a saved Review. Reuses createReview()
 * as-is, so every setting that function already applies (isVerified forced
 * true, status defaulting to "approved") behaves identically to a review
 * created through the normal customer flow, nothing about that behaviour is
 * changed or made configurable here.
 */
export async function processReviewCsvRow(
  rowIndex: number,
  data: Record<ReviewField, string>
): Promise<ReviewCsvRowResult> {
  const matchValue = data.product_match?.trim();
  if (!matchValue) {
    return {
      row: rowIndex,
      ok: false,
      error: "Missing product slug/ASIN/product ID. Every review must be matched to an existing product.",
    };
  }

  const product = await resolveProduct(matchValue);
  if (!product) {
    return {
      row: rowIndex,
      ok: false,
      error: `No product found matching "${matchValue}". Check the slug, ASIN or product ID, it must match an existing product exactly.`,
    };
  }

  const rating = Math.round(Number(data.rating));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { row: rowIndex, ok: false, error: "Rating must be a whole number from 1 to 5." };
  }

  const body = data.body?.trim();
  if (!body) {
    return { row: rowIndex, ok: false, error: "Missing review text." };
  }
  if (body.length > 2000) {
    return { row: rowIndex, ok: false, error: "Review text is too long (2000 characters maximum)." };
  }

  const title = data.title?.trim();
  if (title && title.length > 100) {
    return { row: rowIndex, ok: false, error: "Review title is too long (100 characters maximum)." };
  }

  const authorNameRaw = data.author_name?.trim();
  const isAnonymous = !authorNameRaw;

  let createdAt: string | undefined;
  const createdAtRaw = data.created_at?.trim();
  if (createdAtRaw) {
    const parsed = new Date(createdAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      return { row: rowIndex, ok: false, error: `Could not read the date "${createdAtRaw}". Use a format like 2026-01-15.` };
    }
    createdAt = parsed.toISOString();
  }

  const review = await createReview({
    productId: product.id,
    productSlug: product.slug,
    rating,
    title: title || undefined,
    body,
    authorName: authorNameRaw || "Anonymous",
    authorEmail: data.author_email?.trim() || "",
    isAnonymous,
    images: [],
    createdAt,
  });

  return { row: rowIndex, ok: true, review, productTitle: product.title };
}
