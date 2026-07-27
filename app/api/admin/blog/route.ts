import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createBlogPost, getAllBlogPosts } from "@/lib/blog";
import { slugify } from "@/lib/utils";
import { adminErrorResponse } from "@/lib/api-error";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, excerpt, content, cover_image, category, author, read_time } = body;

  if (!title || !excerpt || !content) {
    return NextResponse.json({ error: "Title, excerpt and content are required." }, { status: 400 });
  }

  const existing = await getAllBlogPosts();
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 2;
  while (existing.some((p) => p.slug === slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  try {
    const post = await createBlogPost({
      slug,
      title,
      excerpt,
      content,
      cover_image: cover_image || "",
      category: category || "Pet Care",
      author: author || "Pet Carrier Team",
      published_at: new Date().toISOString(),
      read_time: read_time || "3 min read",
    });

    return NextResponse.json({ post });
  } catch (error) {
    return adminErrorResponse(error, "Could not create blog post.");
  }
}
