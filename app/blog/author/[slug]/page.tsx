import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { AUTHORS, getAuthorBySlug } from "@/lib/authors";
import { getAllBlogPosts } from "@/lib/blog";
import { breadcrumbJsonLd, siteUrl } from "@/lib/seo";

export const revalidate = 3600;

export async function generateStaticParams() {
  return AUTHORS.map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) return {};
  return {
    title: `${author.name} | Pet Carrier`,
    description: author.bio,
    alternates: { canonical: `/blog/author/${author.slug}` },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) notFound();

  const allPosts = await getAllBlogPosts();
  const posts = allPosts.filter((p) => p.author === author.name);

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: author.name, url: `/blog/author/${author.slug}` },
  ]);

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    description: author.bio,
    url: `${siteUrl}/blog/author/${author.slug}`,
    jobTitle: author.role,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />

      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/blog" className="hover:text-foreground">
          Blog
        </Link>
      </nav>

      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{author.name}</h1>
      <p className="mt-1 text-sm font-medium uppercase tracking-wide text-blue-600">{author.role}</p>
      <p className="mt-4 max-w-2xl text-gray-600">{author.bio}</p>

      <div className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Articles by {author.name} ({posts.length})
        </h2>
        {posts.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
              >
                <div className="relative aspect-16/9 overflow-hidden">
                  <Image src={post.cover_image} alt={post.title} fill sizes="360px" className="object-cover" />
                </div>
                <div className="p-4">
                  <p className="font-medium text-foreground group-hover:text-blue-700">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No published articles yet.</p>
        )}
      </div>
    </div>
  );
}
