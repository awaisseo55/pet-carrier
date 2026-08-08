"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

function StarRow({ rating, sizeClass }: { rating: number; sizeClass: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const fraction = Math.max(0, Math.min(1, rating - i));
        return (
          <span key={i} className="relative inline-block">
            <Star className={cn(sizeClass, "text-gray-300")} />
            {fraction > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fraction * 100}%` }}>
                <Star className={cn(sizeClass, "fill-amber-400 text-amber-400")} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

interface RatingSummaryProps {
  averageRating: number;
  reviewCount: number;
  /** "full": product page, under the H1, clickable to scroll to #reviews. "compact": product cards, static (the card itself is already a link). */
  variant?: "full" | "compact";
  className?: string;
}

export function RatingSummary({ averageRating, reviewCount, variant = "full", className }: RatingSummaryProps) {
  const hasReviews = reviewCount > 0;

  if (variant === "compact") {
    // Per spec: hide entirely rather than show "No reviews" clutter on cards.
    if (!hasReviews) return null;
    return (
      <div className={cn("flex items-center gap-1.5 text-xs", className)}>
        <StarRow rating={averageRating} sizeClass="size-3.5" />
        <span className="font-semibold text-foreground">{averageRating.toFixed(1)}</span>
        <span className="text-gray-500">({reviewCount})</span>
      </div>
    );
  }

  function scrollToReviews(e: React.MouseEvent) {
    e.preventDefault();
    document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!hasReviews) {
    return (
      <button
        type="button"
        onClick={scrollToReviews}
        className={cn(
          "my-1.5 flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-blue-600",
          className
        )}
      >
        <StarRow rating={0} sizeClass="size-4" />
        Be the first to review
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={scrollToReviews}
      className={cn("group my-1.5 flex cursor-pointer items-center gap-2", className)}
    >
      <StarRow rating={averageRating} sizeClass="size-4" />
      <span className="font-semibold text-foreground">{averageRating.toFixed(1)}</span>
      <span className="text-blue-600 group-hover:underline">
        ({reviewCount} review{reviewCount === 1 ? "" : "s"})
      </span>
    </button>
  );
}
