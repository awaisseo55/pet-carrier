import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { authors, getPersonBySlug } from "@/lib/people";
import { getAllBlogPosts } from "@/lib/blog";
import { breadcrumbJsonLd, siteUrl } from "@/lib/seo";
import { PersonProfile } from "@/components/blog/person-profile";

export const revalidate = 3600;

export async function generateStaticParams() {
  return authors().map((person) => ({ slug: person.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const person = getPersonBySlug(slug, "author");
  if (!person) return {};
  return {
    title: `${person.name}, ${person.title} | Pet Carrier`,
    description: person.shortBio,
    alternates: { canonical: person.profileUrl },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const person = getPersonBySlug(slug, "author");
  if (!person) notFound();

  const allPosts = await getAllBlogPosts();
  const posts = allPosts.filter((p) => p.author === person.name);

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
