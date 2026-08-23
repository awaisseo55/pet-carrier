import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Person } from "@/lib/people";
import type { BlogPost } from "@/lib/types";
import { PersonAvatar } from "@/components/blog/person-avatar";
import { estimateReadingTime } from "@/lib/reading-time";

export function PersonProfile({ person, posts }: { person: Person; posts: BlogPost[] }) {
  const roleLabel = person.role === "author" ? "Author" : "Reviewer";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/blog" className="hover:text-foreground">
          Blog
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{person.name}</span>
      </nav>

      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <PersonAvatar person={person} size="lg" />
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
            Pet Carrier {roleLabel}
          </span>
          <h1 className="mt-1 font-heading text-3xl font-semibold text-foreground sm:text-4xl">{person.name}</h1>
          <p className="mt-1 text-gray-600">{person.title}</p>
        </div>
      </div>

      <p className="mt-8 max-w-2xl text-lg text-gray-600">{person.shortBio}</p>

      <div className="mt-8 flex flex-col gap-4 text-gray-600">
        {person.bio.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-foreground">Areas of Expertise</h2>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {person.expertise.map((item) => (
            <span
              key={item}
              className="rounded-md border border-border bg-gray-50 px-3 py-2 text-center text-sm text-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-foreground">Experience</h2>
        <div className="mt-4 flex flex-col gap-5">
          {person.experience.map((entry) => (
            <div key={entry.heading}>
              <h3 className="font-heading text-base font-semibold text-foreground">{entry.heading}</h3>
              <p className="mt-1 text-gray-600">{entry.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-lg border border-border bg-gray-50 p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground">{person.editorialNoteHeading}</h2>
        <p className="mt-2 text-gray-600">{person.editorialNote}</p>
      </div>

      <div className="mt-12">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          {person.role === "author" ? "Articles" : "Articles Reviewed"} by {person.name} ({posts.length})
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
                  <span className="text-xs font-medium uppercase tracking-wide text-blue-600">{post.category}</span>
                  <p className="mt-1 font-medium text-foreground group-hover:text-blue-700">{post.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(post.published_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    &middot; {estimateReadingTime(post.content, post.faqs?.map((f) => `${f.question} ${f.answer}`))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No articles yet.</p>
        )}
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <Link href="/blog" className="text-sm font-medium text-blue-700 hover:underline">
          &larr; Back to the blog
        </Link>
      </div>
    </div>
  );
}
