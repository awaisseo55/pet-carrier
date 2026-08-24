import "server-only";
import { createHash } from "crypto";
import { nanoid } from "nanoid";
import type { ProductRatingStats, PublicReview, RatingBreakdown, Review, ReviewStatus } from "./types";
import { readJsonFile, writeJsonFile } from "./data-store";
import { updateProductRatingStats } from "./products";

// Deliberately short and conservative: this is a first line of defence
// alongside admin moderation, not a substitute for it.
const SPAM_TERMS = [
  "viagra",
  "cialis",
  "casino",
  "porn",
  "xxx",
  "crypto giveaway",
  "bitcoin giveaway",
  "forex signals",
  "click here to win",
  "www.",
  "http://",
  "https://",
];

export async function getAllReviews(): Promise<Review[]> {
  return readJsonFile<Review[]>("reviews.json");
}

async function saveAllReviews(reviews: Review[]): Promise<void> {
  await writeJsonFile("reviews.json", reviews);
}

export function toPublicReview(review: Review): PublicReview {
  const { authorEmail: _authorEmail, ipHash: _ipHash, ...rest } = review;
  return rest;
}

/** Newest first, approved only, the shape every customer-facing view uses. */
export async function getApprovedReviewsByProduct(productId: string): Promise<Review[]> {
  const reviews = await getAllReviews();
  return reviews
    .filter((r) => r.productId === productId && r.status === "approved")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** All statuses, newest first, for the admin moderation list. */
export async function getReviewsForAdmin(): Promise<Review[]> {
  const reviews = await getAllReviews();
  return reviews.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getReviewById(id: string): Promise<Review | undefined> {
  const reviews = await getAllReviews();
  return reviews.find((r) => r.id === id);
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export function containsSpamTerms(text: string): boolean {
  const lower = text.toLowerCase();
  return SPAM_TERMS.some((term) => lower.includes(term));
}

export interface CreateReviewInput {
  id?: string;
  productId: string;
  productSlug: string;
  rating: number;
  title?: string;
  body: string;
  authorName: string;
  authorEmail: string;
  isAnonymous: boolean;
  images: string[];
  status?: ReviewStatus;
  ipHash?: string;
  /** Lets a bulk import carry the review's original date instead of the import date. Defaults to now, exactly as before, for every other caller. */
  createdAt?: string;
}

export async function createReview(input: CreateReviewInput): Promise<Review> {
  const reviews = await getAllReviews();
  const review: Review = {
    id: input.id ?? nanoid(12),
    productId: input.productId,
    productSlug: input.productSlug,
    rating: input.rating,
    title: input.title,
    body: input.body,
    authorName: input.isAnonymous ? "Anonymous" : input.authorName,
    authorEmail: input.authorEmail,
    images: input.images,
    isVerified: true,
    isAnonymous: input.isAnonymous,
    helpfulCount: 0,
    createdAt: input.createdAt ?? new Date().toISOString(),
    status: input.status ?? "approved",
    ipHash: input.ipHash,
  };
  reviews.push(review);
  await saveAllReviews(reviews);
  return review;
}

export async function updateReviewStatus(id: string, status: ReviewStatus): Promise<Review | undefined> {
  const reviews = await getAllReviews();
  const review = reviews.find((r) => r.id === id);
  if (!review) return undefined;
  review.status = status;
  await saveAllReviews(reviews);
  return review;
}

export async function deleteReview(id: string): Promise<void> {
  const reviews = await getAllReviews();
  await saveAllReviews(reviews.filter((r) => r.id !== id));
}

export async function incrementHelpfulCount(id: string): Promise<Review | undefined> {
  const reviews = await getAllReviews();
  const review = reviews.find((r) => r.id === id);
  if (!review) return undefined;
  review.helpfulCount += 1;
  await saveAllReviews(reviews);
  return review;
}

export function calculateRatingStats(reviews: Review[]): ProductRatingStats {
  const breakdown: RatingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const review of reviews) {
    const rating = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[rating] += 1;
  }
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount,
    ratingBreakdown: breakdown,
  };
}

export async function getProductRatingStats(productId: string): Promise<ProductRatingStats> {
  const reviews = await getApprovedReviewsByProduct(productId);
  return calculateRatingStats(reviews);
}

/** Recomputes a product's aggregate rating from its approved reviews and caches the result on the product record. Call after any review create, status change, or delete. */
export async function syncProductRatingStats(productId: string): Promise<ProductRatingStats> {
  const stats = await getProductRatingStats(productId);
  await updateProductRatingStats(productId, stats);
  return stats;
}
