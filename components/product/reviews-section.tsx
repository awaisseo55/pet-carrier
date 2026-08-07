"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Star, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "@/components/product/review-form";
import { ImageLightbox } from "@/components/product/image-lightbox";
import { cn } from "@/lib/utils";
import type { ProductRatingStats, PublicReview, ReviewStatus } from "@/lib/types";

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600">
      <Check className="size-3" />
      Verified
    </span>
  );
}

function Stars({ rating, size = "size-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn(size, i < rating ? "fill-current" : "fill-transparent")} />
      ))}
    </div>
  );
}

function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function RatingBreakdownBars({ stats }: { stats: ProductRatingStats }) {
  const stars = [5, 4, 3, 2, 1] as const;
  return (
    <div className="flex flex-col gap-1.5">
      {stars.map((star) => {
        const count = stats.ratingBreakdown[star];
        const pct = stats.reviewCount > 0 ? Math.round((count / stats.reviewCount) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-sm">
            <span className="w-12 shrink-0 text-gray-500">{star} star</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-9 shrink-0 text-right text-gray-500">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewCard({
  review,
  onOpenLightbox,
}: {
  review: PublicReview;
  onOpenLightbox: (images: string[], index: number) => void;
}) {
  const [helpfulCount, setHelpfulCount] = React.useState(review.helpfulCount);
  const [voted, setVoted] = React.useState(false);

  async function handleHelpful() {
    if (voted) return;
    setVoted(true);
    setHelpfulCount((c) => c + 1);
    const res = await fetch(`/api/reviews/${review.id}/helpful`, { method: "POST" });
    if (!res.ok) {
      setVoted(false);
      setHelpfulCount((c) => c - 1);
    }
  }

  return (
    <div className="border-b border-border py-6 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Stars rating={review.rating} />
        <span className="text-sm text-muted-foreground">{formatReviewDate(review.createdAt)}</span>
      </div>

      {review.title && <h3 className="mt-2 font-heading text-base font-semibold text-foreground">{review.title}</h3>}

      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">{review.authorName}</span>
        <VerifiedBadge />
      </div>

      <p className="mt-3 text-sm text-gray-600">{review.body}</p>

      {review.images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => onOpenLightbox(review.images, index)}
              className="relative size-16 shrink-0 cursor-zoom-in overflow-hidden rounded-lg border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- small fixed thumbnail from a user-uploaded review photo */}
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleHelpful}
        disabled={voted}
        className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 disabled:cursor-not-allowed"
      >
        <ThumbsUp className={cn("size-3.5", voted && "fill-current text-blue-600")} />
        Was this helpful?{helpfulCount > 0 ? ` (${helpfulCount})` : ""}
      </button>
    </div>
  );
}

interface ReviewsSectionProps {
  productId: string;
  productSlug: string;
  initialReviews: PublicReview[];
  initialStats: ProductRatingStats;
  initialHasMore: boolean;
}

export function ReviewsSection({
  productId,
  productSlug,
  initialReviews,
  initialStats,
  initialHasMore,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = React.useState(initialReviews);
  const [stats, setStats] = React.useState(initialStats);
  const [hasMore, setHasMore] = React.useState(initialHasMore);
  const [page, setPage] = React.useState(1);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [lightbox, setLightbox] = React.useState<{ images: string[]; index: number } | null>(null);

  function openLightbox(images: string[], index: number) {
    setLightbox({ images, index });
  }

  function handleReviewSuccess(review: PublicReview | null, status: ReviewStatus) {
    setFormOpen(false);
    if (status === "approved" && review) {
      setReviews((prev) => [review, ...prev]);
      setStats((prev) => {
        const reviewCount = prev.reviewCount + 1;
        const total = prev.averageRating * prev.reviewCount + review.rating;
        const rounded = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
        return {
          reviewCount,
          averageRating: Math.round((total / reviewCount) * 10) / 10,
          ratingBreakdown: { ...prev.ratingBreakdown, [rounded]: prev.ratingBreakdown[rounded] + 1 },
        };
      });
      toast.success("Thank you for your review!");
    } else {
      toast.success("Thanks for your review! It's awaiting a quick check before it goes live.");
    }
  }

  async function loadMore() {
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(`/api/reviews?productId=${productId}&page=${nextPage}&limit=10`);
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) => [...prev, ...data.reviews]);
        setHasMore(data.hasMore);
        setPage(nextPage);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-semibold text-foreground">Customer Reviews</h2>

      {stats.reviewCount > 0 ? (
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
          <div className="flex shrink-0 flex-col items-center gap-1 sm:w-40">
            <span className="font-heading text-4xl font-semibold text-foreground">{stats.averageRating}</span>
            <Stars rating={Math.round(stats.averageRating)} size="size-5" />
            <span className="text-sm text-muted-foreground">
              Based on {stats.reviewCount} review{stats.reviewCount === 1 ? "" : "s"}
            </span>
          </div>
          <div className="w-full max-w-sm">
            <RatingBreakdownBars stats={stats} />
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-gray-100/40 py-12 text-center">
          <Stars rating={0} size="size-5" />
          <p className="text-sm text-muted-foreground">Be the first to review this product</p>
        </div>
      )}

      <div className="mt-6">
        {formOpen ? (
          <ReviewForm productSlug={productSlug} onSuccess={handleReviewSuccess} onCancel={() => setFormOpen(false)} />
        ) : (
          <Button onClick={() => setFormOpen(true)}>Write a Review</Button>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="mt-8">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} onOpenLightbox={openLightbox} />
          ))}

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          title="Review photo"
          isOpen={!!lightbox}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
        />
      )}
    </div>
  );
}
