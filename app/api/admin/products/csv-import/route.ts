import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { processCsvRow, type ProductField } from "@/lib/csv-import";
import { upsertProduct } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { adminErrorResponse } from "@/lib/api-error";
import { revalidateProductPaths } from "@/lib/revalidate";

interface ImportRequestBody {
  rows: Record<ProductField, string>[];
  useAI: boolean;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows, useAI }: ImportRequestBody = await request.json();
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 });
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: "Please import 500 rows or fewer at a time." }, { status: 400 });
  }

  const settings = await getSettings();
  const results = [];
  let imported = 0;

  try {
    for (let i = 0; i < rows.length; i++) {
      const result = await processCsvRow(i + 1, rows[i], {
        defaultMarkupPercentage: settings.default_markup_percentage,
        useAI,
      });

      if (result.ok && result.product) {
        await upsertProduct(result.product);
        await revalidateProductPaths(result.product);
        imported += 1;
        results.push({ row: result.row, ok: true, title: result.product.title, id: result.product.id });
      } else {
        results.push({
          row: result.row,
          ok: false,
          error: result.error,
          existingProductId: result.existingProductId,
        });
      }
    }
  } catch (error) {
    return adminErrorResponse(error, "Could not complete the CSV import.");
  }

  const skipped = results.length - imported;

  return NextResponse.json({ imported, skipped, results });
}
