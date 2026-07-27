import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteCategoryNode, getCategoryNode, saveCategoryOverride } from "@/lib/category-store";
import { adminErrorResponse } from "@/lib/api-error";
import { revalidateCategoryPaths } from "@/lib/revalidate";

export async function PATCH(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  const categoryPath = path.join("/");
  const updates = await request.json();

  try {
    const node = await getCategoryNode(categoryPath);
    await saveCategoryOverride(categoryPath, updates);
    revalidateCategoryPaths(categoryPath, node?.parentPath);
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
    const node = await getCategoryNode(categoryPath);
    await deleteCategoryNode(categoryPath);
    revalidateCategoryPaths(categoryPath, node?.parentPath);
  } catch (error) {
    return adminErrorResponse(error, "Could not delete category.");
  }

  return NextResponse.json({ ok: true });
}
