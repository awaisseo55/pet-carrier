import Image from "next/image";
import Link from "next/link";
import { getLatestBlogPosts } from "@/lib/blog";

export async function BlogPreview() {
  const posts = await getLatestBlogPosts(3);
  if (posts.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
          From the Blog
        </h2>
        <p className="mt-2 text-brown-soft">Pet care guides and travel tips from our team.</p>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
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
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <span className="text-xs font-medium uppercase tracking-wide text-terracotta-600">
                {post.category}
              </span>
              <h3 className="font-serif text-lg font-semibold leading-snug text-foreground">
                {post.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
              <span className="mt-auto pt-2 text-sm font-medium text-sage-700">Read more &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
