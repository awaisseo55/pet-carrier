import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { getAllBlogPosts, getBlogPostBySlug, getRelatedBlogPosts } from "@/lib/blog";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { getPersonByName } from "@/lib/people";
import { renderRichText } from "@/lib/markdown-lite";
import { estimateReadingTime } from "@/lib/reading-time";
import { extractToc } from "@/lib/toc";
import { PersonCard } from "@/components/blog/person-card";
import { KeyTakeaways } from "@/components/blog/key-takeaways";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ChecklistBox } from "@/components/blog/checklist-box";
import { ComparisonTable } from "@/components/blog/comparison-table";
import { CommonMistakes } from "@/components/blog/common-mistakes";
import { EditorialNote } from "@/components/blog/editorial-note";
import { ArticleFaq } from "@/components/blog/article-faq";
import { RelatedArticles } from "@/components/blog/related-articles";

// Belt-and-braces alongside the on-demand revalidatePath() calls in
// lib/revalidate.ts (which fire immediately after an admin save).
export const revalidate = 3600;

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
    alternates: { canonical: `/blog/${post.slug}` },
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

  const [related] = await Promise.all([getRelatedBlogPosts(post, 4)]);

  const author = getPersonByName(post.author, "author");
  const reviewer = post.reviewed_by ? getPersonByName(post.reviewed_by, "reviewer") : undefined;
  const toc = extractToc(post.content);
  const readingTime = estimateReadingTime(post.content, post.faqs?.map((f) => `${f.question} ${f.answer}`));

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.title, url: `/blog/${post.slug}` },
  ]);
  const article = articleJsonLd(post);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />

      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/blog" className="hover:text-foreground">
          Blog
        </Link>
      </nav>

      <span className="text-sm font-medium uppercase tracking-wide text-blue-600">
        {post.category}
      </span>
      <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        {post.title}
      </h1>

      <div className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
        <p>
          By{" "}
          {author ? (
            <Link href={author.profileUrl} className="font-medium text-foreground hover:text-blue-700">
              {author.name}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{post.author}</span>
          )}
          {author && <> &middot; {author.title}</>}
        </p>
        {post.reviewed_by && (
          <p>
            Reviewed by{" "}
            {reviewer ? (
              <Link href={reviewer.profileUrl} className="font-medium text-foreground hover:text-blue-700">
                {reviewer.name}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{post.reviewed_by}</span>
            )}
            {post.reviewed_by_role ? <> &middot; {post.reviewed_by_role}</> : null}
          </p>
        )}
        <p>
          Published{" "}
          {new Date(post.published_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {post.updated_at && post.updated_at !== post.published_at && (
            <>
              {" "}
              &middot; Last updated{" "}
              {new Date(post.updated_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </>
          )}{" "}
          &middot; {readingTime}
        </p>
      </div>

      <div className="relative mt-8 aspect-16/9 overflow-hidden rounded-xl shadow-sm">
        <Image src={post.cover_image} alt={post.title} fill priority sizes="800px" className="object-cover" />
      </div>

      <div className="mt-8 flex flex-col gap-6">
        {post.quick_answer && post.quick_answer.length > 0 && <KeyTakeaways items={post.quick_answer} />}
        <TableOfContents entries={toc} />
      </div>

      <div className="prose-content mt-8 flex flex-col gap-5 text-gray-500">{renderRichText(post.content)}</div>

      <div className="mt-10 flex flex-col gap-8">
        {post.checklist_items && post.checklist_items.length > 0 && (
          <ChecklistBox heading={post.checklist_heading} items={post.checklist_items} />
        )}
        {post.comparison_table && <ComparisonTable table={post.comparison_table} />}
        {post.common_mistakes && post.common_mistakes.length > 0 && (
          <CommonMistakes items={post.common_mistakes} />
        )}
        <EditorialNote note={post.editorial_note} />
        {post.faqs && post.faqs.length > 0 && <ArticleFaq faqs={post.faqs} />}
      </div>

      {(author || reviewer) && (
        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8">
          {author && <PersonCard person={author} />}
          {reviewer && <PersonCard person={reviewer} />}
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-12 border-t border-border pt-8">
          <RelatedArticles posts={related} />
        </div>
      )}
    </article>
  );
}
