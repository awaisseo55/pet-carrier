import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Pet care guides, travel tips and buying advice from the Pet Carrier team.",
};

// Belt-and-braces alongside the on-demand revalidatePath() calls in
// lib/revalidate.ts (which fire immediately after an admin save).
export const revalidate = 3600;

export default async function BlogPage() {
  const posts = await getAllBlogPosts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-semibold text-foreground">The Pet Carrier Blog</h1>
        <p className="mt-2 text-gray-500">Care guides, travel tips and buying advice for pet owners.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative aspect-16/10 overflow-hidden bg-gray-100">
              <Image
                src={post.cover_image}
                alt={post.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
                {post.category}
              </span>
              <h2 className="font-heading text-lg font-semibold leading-snug text-foreground">
                {post.title}
              </h2>
              <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
              <span className="mt-auto pt-2 text-xs text-muted-foreground">
                By {post.author}
                {post.reviewed_by ? ` · Reviewed by ${post.reviewed_by}` : ""}
                <br />
                {new Date(post.published_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                &middot; {post.read_time}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
