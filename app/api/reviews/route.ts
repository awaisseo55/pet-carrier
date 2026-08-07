import { NextResponse } from "next/server";
import { calculateRatingStats, getApprovedReviewsByProduct, toPublicReview } from "@/lib/reviews";

const DEFAULT_LIMIT = 10;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT));

  if (!productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }

  const reviews = await getApprovedReviewsByProduct(productId);
  const stats = calculateRatingStats(reviews);

  const start = (page - 1) * limit;
  const pageReviews = reviews.slice(start, start + limit);
  const hasMore = start + limit < reviews.length;

  return NextResponse.json({
    reviews: pageReviews.map(toPublicReview),
    hasMore,
    stats,
  });
}
