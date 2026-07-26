import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteCategoryNode, saveCategoryOverride } from "@/lib/category-store";

export async function PATCH(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  const categoryPath = path.join("/");
  const updates = await request.json();

  await saveCategoryOverride(categoryPath, updates);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  const categoryPath = path.join("/");

  await deleteCategoryNode(categoryPath);
  return NextResponse.json({ ok: true });
}
