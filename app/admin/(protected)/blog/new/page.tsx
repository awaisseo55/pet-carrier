import { BlogPostForm } from "@/components/admin/blog-post-form";

export default function NewBlogPostPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-foreground">New Blog Post</h1>
      <p className="mt-1 text-gray-500">Write a new post and upload a featured image.</p>
      <div className="mt-6 max-w-3xl">
        <BlogPostForm />
      </div>
    </div>
  );
}
