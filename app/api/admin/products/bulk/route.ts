import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAllProducts, saveAllProducts } from "@/lib/products";
import { adminErrorResponse } from "@/lib/api-error";
import type { StockStatus } from "@/lib/types";

interface BulkUpdateInput {
  ids: string[];
  price_adjustment_percentage?: number;
  stock_status?: StockStatus;
  is_active?: boolean;
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids, price_adjustment_percentage, stock_status, is_active }: BulkUpdateInput = await request.json();
  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: "No products selected." }, { status: 400 });
  }

  const products = await getAllProducts();
  const idSet = new Set(ids);
  const now = new Date().toISOString();

  const updated = products.map((product) => {
    if (!idSet.has(product.id)) return product;

    const next = { ...product, updated_at: now };
    if (typeof price_adjustment_percentage === "number") {
      next.price = Math.round(next.price * (1 + price_adjustment_percentage / 100) * 100) / 100;
    }
    if (stock_status) next.stock_status = stock_status;
    if (typeof is_active === "boolean") next.is_active = is_active;
    return next;
  });

  try {
    await saveAllProducts(updated);
  } catch (error) {
    return adminErrorResponse(error, "Could not save the bulk update.");
  }

  return NextResponse.json({ ok: true, updated: ids.length });
}
