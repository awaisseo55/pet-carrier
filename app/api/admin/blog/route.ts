import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createBlogPost, getAllBlogPosts } from "@/lib/blog";
import { slugify } from "@/lib/utils";
import { adminErrorResponse } from "@/lib/api-error";
import { revalidateBlogPaths } from "@/lib/revalidate";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    excerpt,
    content,
    cover_image,
    category,
    author,
    reviewed_by,
    reviewed_by_role,
    quick_answer,
    checklist_heading,
    checklist_items,
    common_mistakes,
    comparison_table,
    editorial_note,
    faqs,
    related_slugs,
  } = body;

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
      author: author || "Rebecca",
      reviewed_by: reviewed_by || undefined,
      reviewed_by_role: reviewed_by_role || undefined,
      quick_answer: quick_answer || undefined,
      checklist_heading: checklist_heading || undefined,
      checklist_items: checklist_items || undefined,
      common_mistakes: common_mistakes || undefined,
      comparison_table: comparison_table || undefined,
      editorial_note: editorial_note || undefined,
      faqs: faqs || undefined,
      related_slugs: related_slugs || undefined,
      published_at: new Date().toISOString(),
    });

    revalidateBlogPaths(post.slug);
    return NextResponse.json({ post });
  } catch (error) {
    return adminErrorResponse(error, "Could not create blog post.");
  }
}
