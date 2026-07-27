import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { addCustomCategory, getCategoryNode } from "@/lib/category-store";
import { slugify } from "@/lib/utils";
import { adminErrorResponse } from "@/lib/api-error";
import { revalidateCategoryPaths } from "@/lib/revalidate";
import type { CategoryNode, Section } from "@/lib/categories";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, section, parentPath, animal, descriptor } = await request.json();

  if (!name || !section) {
    return NextResponse.json({ error: "Name and section are required." }, { status: 400 });
  }

  const slug = slugify(name);
  const path = parentPath ? `${parentPath}/${slug}` : `${section}/${slug}`;

  const existing = await getCategoryNode(path);
  if (existing) {
    return NextResponse.json({ error: "A category with that name already exists here." }, { status: 409 });
  }

  const node: CategoryNode = {
    path,
    name,
    section: section as Section,
    level: parentPath ? ((parentPath.split("/").length + 1) as 2 | 3) : 2,
    parentPath: parentPath || section,
    animal: animal || "multiple pets",
    descriptor: descriptor || `pets who need ${name.toLowerCase()}`,
    kind: "sub",
  };

  try {
    await addCustomCategory(node);
    revalidateCategoryPaths(node.path, node.parentPath);
  } catch (error) {
    return adminErrorResponse(error, "Could not create category.");
  }

  return NextResponse.json({ category: node });
}
