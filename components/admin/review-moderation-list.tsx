"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Review, ReviewStatus } from "@/lib/types";

const STATUS_BADGE: Record<ReviewStatus, { label: string; variant: "success" | "warning" | "alert" }> = {
  approved: { label: "Approved", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  rejected: { label: "Rejected", variant: "alert" },
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("size-3.5", i < rating ? "fill-current" : "fill-transparent")} />
      ))}
    </div>
  );
}

export function ReviewModerationList({
  reviews,
  products,
}: {
  reviews: Review[];
  products: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<ReviewStatus | "all">("all");
  const [productFilter, setProductFilter] = React.useState<string>("all");
  const [ratingFilter, setRatingFilter] = React.useState<string>("all");

  const productTitleById = React.useMemo(() => new Map(products.map((p) => [p.id, p.title])), [products]);

  const filtered = reviews.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (productFilter !== "all" && r.productId !== productFilter) return false;
    if (ratingFilter !== "all" && r.rating !== Number(ratingFilter)) return false;
    return true;
  });

  async function setStatus(id: string, status: ReviewStatus) {
    setBusyId(id);
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    if (res.ok) {
      toast.success(`Review ${status}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || "Could not update review");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) {
      toast.success("Review deleted");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || "Could not delete review");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReviewStatus | "all")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All products</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} star{n > 1 ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-gray-50 py-16 text-center text-gray-500">
          No reviews match these filters.
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {filtered.map((review) => {
            const badge = STATUS_BADGE[review.status];
            return (
              <div key={review.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars rating={review.rating} />
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {productTitleById.get(review.productId) || review.productSlug}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {review.title && (
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{review.title}</h3>
                )}
                <p className="mt-1 text-sm text-gray-600">{review.body}</p>

                <div className="mt-2 text-xs text-muted-foreground">
                  {review.authorName}
                  {" · "}
                  {review.authorEmail}
                  {review.isAnonymous && " (posted anonymously)"}
                </div>

                {review.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {review.images.map((src) => (
                      <a key={src} href={src} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail preview */}
                        <img src={src} alt="" className="size-14 rounded-md border border-border object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === review.id || review.status === "approved"}
                    onClick={() => setStatus(review.id, "approved")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === review.id || review.status === "rejected"}
                    onClick={() => setStatus(review.id, "rejected")}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === review.id}
                    onClick={() => handleDelete(review.id)}
                  >
                    <Trash2 className="size-4 text-alert" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
