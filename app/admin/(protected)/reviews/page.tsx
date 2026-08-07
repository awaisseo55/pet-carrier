import { ReviewModerationList } from "@/components/admin/review-moderation-list";
import { getReviewsForAdmin } from "@/lib/reviews";
import { getAllProducts } from "@/lib/products";

export default async function AdminReviewsPage() {
  const [reviews, products] = await Promise.all([getReviewsForAdmin(), getAllProducts()]);
  const productOptions = products
    .filter((p) => reviews.some((r) => r.productId === p.id))
    .map((p) => ({ id: p.id, title: p.title }));

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">Reviews</h1>
      <p className="mt-1 text-gray-500">{reviews.length} review(s) across all products.</p>

      <div className="mt-6">
        <ReviewModerationList reviews={reviews} products={productOptions} />
      </div>
    </div>
  );
}
