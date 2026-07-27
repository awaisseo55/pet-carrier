import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteBlogPost, getAllBlogPosts, updateBlogPost } from "@/lib/blog";
import { adminErrorResponse } from "@/lib/api-error";
import { revalidateBlogPaths } from "@/lib/revalidate";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const updates = await request.json();

  try {
    const post = await updateBlogPost(id, updates);
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    revalidateBlogPaths(post.slug);
    return NextResponse.json({ post });
  } catch (error) {
    return adminErrorResponse(error, "Could not update blog post.");
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const posts = await getAllBlogPosts();
  const existing = posts.find((p) => p.id === id);

  try {
    await deleteBlogPost(id);
    if (existing) revalidateBlogPaths(existing.slug);
  } catch (error) {
    return adminErrorResponse(error, "Could not delete blog post.");
  }

  return NextResponse.json({ ok: true });
}
