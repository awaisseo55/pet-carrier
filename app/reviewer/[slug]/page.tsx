import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { reviewers, getPersonBySlug } from "@/lib/people";
import { getAllBlogPosts } from "@/lib/blog";
import { breadcrumbJsonLd, siteUrl } from "@/lib/seo";
import { PersonProfile } from "@/components/blog/person-profile";

export const revalidate = 3600;

export async function generateStaticParams() {
  return reviewers().map((person) => ({ slug: person.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const person = getPersonBySlug(slug, "reviewer");
  if (!person) return {};
  return {
    title: `${person.name}, ${person.title} | Pet Carrier`,
    description: person.shortBio,
    alternates: { canonical: person.profileUrl },
  };
}

export default async function ReviewerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const person = getPersonBySlug(slug, "reviewer");
  if (!person) notFound();

  const allPosts = await getAllBlogPosts();
  const posts = allPosts.filter((p) => p.reviewed_by === person.name);

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: person.name, url: person.profileUrl },
  ]);

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    jobTitle: person.title,
    description: person.shortBio,
    url: `${siteUrl}${person.profileUrl}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <PersonProfile person={person} posts={posts} />
    </>
  );
}
