import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlogList } from "@/components/admin/blog-list";
import { getAllBlogPosts } from "@/lib/blog";

export default async function AdminBlogPage() {
  const posts = await getAllBlogPosts();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Blog</h1>
          <p className="mt-1 text-gray-500">{posts.length} post(s) published.</p>
        </div>
        <Button variant="default" asChild>
          <Link href="/admin/blog/new">
            <Plus className="size-4" />
            New Post
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <BlogList posts={posts} />
      </div>
    </div>
  );
}
