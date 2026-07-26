import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog";
import { breadcrumbJsonLd } from "@/lib/seo";

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.cover_image }],
      type: "article",
      publishedTime: post.published_at,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.title, url: `/blog/${post.slug}` },
  ]);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/blog" className="hover:text-foreground">
          Blog
        </Link>
      </nav>

      <span className="text-sm font-medium uppercase tracking-wide text-terracotta-600">
        {post.category}
      </span>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
        {post.title}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        By {post.author} &middot;{" "}
        {new Date(post.published_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}{" "}
        &middot; {post.read_time}
      </p>

      <div className="relative mt-8 aspect-16/9 overflow-hidden rounded-3xl shadow-warm">
        <Image src={post.cover_image} alt={post.title} fill priority sizes="800px" className="object-cover" />
      </div>

      <div className="prose-content mt-8 flex flex-col gap-5 text-brown-soft">
        {post.content.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
