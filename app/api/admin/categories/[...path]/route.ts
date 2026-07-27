import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteCategoryNode, saveCategoryOverride } from "@/lib/category-store";
import { adminErrorResponse } from "@/lib/api-error";

export async function PATCH(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  const categoryPath = path.join("/");
  const updates = await request.json();

  try {
    await saveCategoryOverride(categoryPath, updates);
  } catch (error) {
    return adminErrorResponse(error, "Could not save category.");
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  const categoryPath = path.join("/");

  try {
    await deleteCategoryNode(categoryPath);
  } catch (error) {
    return adminErrorResponse(error, "Could not delete category.");
  }

  return NextResponse.json({ ok: true });
}
