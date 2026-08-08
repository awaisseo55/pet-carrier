import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteReview, getReviewById, syncProductRatingStats, updateReviewStatus } from "@/lib/reviews";
import { adminErrorResponse } from "@/lib/api-error";

const VALID_STATUSES = ["approved", "pending", "rejected"];

export async function PATCH(request: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId } = await params;
  const { status } = await request.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    const review = await updateReviewStatus(reviewId, status);
    if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
    await syncProductRatingStats(review.productId);
    revalidatePath(`/product/${review.productSlug}`);
    return NextResponse.json({ review });
  } catch (error) {
    return adminErrorResponse(error, "Could not update review.");
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reviewId } = await params;

  try {
    const review = await getReviewById(reviewId);
    await deleteReview(reviewId);
    if (review) {
      await syncProductRatingStats(review.productId);
      revalidatePath(`/product/${review.productSlug}`);
    }
  } catch (error) {
    return adminErrorResponse(error, "Could not delete review.");
  }

  return NextResponse.json({ ok: true });
}
