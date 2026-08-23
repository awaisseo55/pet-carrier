import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/lib/types";

export function RelatedArticles({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <div>
      <h2 className="font-heading text-2xl font-semibold text-foreground">Related Pet Guides</h2>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex gap-4 overflow-hidden rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
          >
            <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-md">
              <Image src={post.cover_image} alt={post.title} fill sizes="80px" className="object-cover" />
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-blue-600">{post.category}</span>
              <p className="mt-0.5 font-medium leading-snug text-foreground group-hover:text-blue-700">
                {post.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
