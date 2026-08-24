import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { processReviewCsvRow, type ReviewField } from "@/lib/review-csv-import";
import { syncProductRatingStats } from "@/lib/reviews";
import { adminErrorResponse } from "@/lib/api-error";

interface ImportRequestBody {
  rows: Record<ReviewField, string>[];
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows }: ImportRequestBody = await request.json();
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 });
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: "Please import 500 rows or fewer at a time." }, { status: 400 });
  }

  const results = [];
  let imported = 0;
  // productId -> slug, so rating stats and page revalidation only run once
  // per product actually touched by this batch, not once per row.
  const touchedProducts = new Map<string, string>();

  try {
    for (let i = 0; i < rows.length; i++) {
      const result = await processReviewCsvRow(i + 1, rows[i]);

      if (result.ok && result.review) {
        imported += 1;
        touchedProducts.set(result.review.productId, result.review.productSlug);
        results.push({
          row: result.row,
          ok: true,
          productTitle: result.productTitle,
          reviewId: result.review.id,
        });
      } else {
        results.push({ row: result.row, ok: false, error: result.error });
      }
    }

    for (const [productId, slug] of touchedProducts) {
      await syncProductRatingStats(productId);
      revalidatePath(`/product/${slug}`);
    }
  } catch (error) {
    return adminErrorResponse(error, "Could not complete the review CSV import.");
  }

  const skipped = results.length - imported;

  return NextResponse.json({ imported, skipped, results });
}
