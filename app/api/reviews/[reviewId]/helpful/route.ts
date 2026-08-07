import { NextResponse } from "next/server";
import { incrementHelpfulCount } from "@/lib/reviews";

export async function POST(_request: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  const review = await incrementHelpfulCount(reviewId);
  if (!review) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }
  return NextResponse.json({ helpfulCount: review.helpfulCount });
}
