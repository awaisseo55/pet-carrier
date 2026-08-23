import { notFound } from "next/navigation";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { getAllBlogPosts } from "@/lib/blog";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const posts = await getAllBlogPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) notFound();

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">Edit Blog Post</h1>
      <p className="mt-1 text-gray-500">{post.title}</p>
      <div className="mt-6 max-w-3xl">
        <BlogPostForm post={post} />
      </div>
    </div>
  );
}
