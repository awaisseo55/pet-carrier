import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Pet care guides, travel tips and buying advice from the Pet Carrier team.",
};

export default async function BlogPage() {
  const posts = await getAllBlogPosts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-semibold text-foreground">The Pet Carrier Blog</h1>
        <p className="mt-2 text-brown-soft">Care guides, travel tips and buying advice for pet owners.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-warm transition-transform hover:-translate-y-1 hover:shadow-warm-lg"
          >
            <div className="relative aspect-16/10 overflow-hidden bg-cream-dark">
              <Image
                src={post.cover_image}
                alt={post.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <span className="text-xs font-medium uppercase tracking-wide text-terracotta-600">
                {post.category}
              </span>
              <h2 className="font-serif text-lg font-semibold leading-snug text-foreground">
                {post.title}
              </h2>
              <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
              <span className="mt-auto pt-2 text-xs text-muted-foreground">
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
