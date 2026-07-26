import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteBlogPost, updateBlogPost } from "@/lib/blog";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const updates = await request.json();
  const post = await updateBlogPost(id, updates);
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  return NextResponse.json({ post });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await deleteBlogPost(id);
  return NextResponse.json({ ok: true });
}
