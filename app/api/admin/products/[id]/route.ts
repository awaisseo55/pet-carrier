import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteProduct, getProductById, upsertProduct } from "@/lib/products";
import { adminErrorResponse } from "@/lib/api-error";
import { revalidateProductPaths } from "@/lib/revalidate";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getProductById(id);
  if (!existing) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const updates = await request.json();
  const updated = { ...existing, ...updates, id: existing.id, updated_at: new Date().toISOString() };

  try {
    await upsertProduct(updated);
    await revalidateProductPaths(updated);
  } catch (error) {
    return adminErrorResponse(error, "Could not save product.");
  }

  return NextResponse.json({ product: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getProductById(id);

  try {
    await deleteProduct(id);
    if (existing) await revalidateProductPaths(existing);
  } catch (error) {
    return adminErrorResponse(error, "Could not delete product.");
  }

  return NextResponse.json({ ok: true });
}
