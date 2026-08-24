import { ReviewModerationList } from "@/components/admin/review-moderation-list";
import { ReviewCsvImportDialog } from "@/components/admin/review-csv-import";
import { getReviewsForAdmin } from "@/lib/reviews";
import { getAllProducts } from "@/lib/products";

export default async function AdminReviewsPage() {
  const [reviews, products] = await Promise.all([getReviewsForAdmin(), getAllProducts()]);
  const productOptions = products
    .filter((p) => reviews.some((r) => r.productId === p.id))
    .map((p) => ({ id: p.id, title: p.title }));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Reviews</h1>
          <p className="mt-1 text-gray-500">{reviews.length} review(s) across all products.</p>
        </div>
        <ReviewCsvImportDialog />
      </div>

      <div className="mt-6">
        <ReviewModerationList reviews={reviews} products={productOptions} />
      </div>
    </div>
  );
}
