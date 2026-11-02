import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLatestBlogPosts } from "@/lib/blog";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/reveal";

export async function BlogPreview() {
  const posts = await getLatestBlogPosts(3);
  if (posts.length === 0) return null;

  const [lead, ...rest] = posts;

  return (
    <section className="bg-gray-50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal direction="up">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="max-w-2xl">
            <span className="font-sans text-[0.7rem] font-bold tracking-[0.16em] text-ember-600 uppercase">
              Guides
            </span>
            <h2 className="mt-2.5 text-3xl leading-[1.1] text-ink sm:text-4xl lg:text-[2.75rem]">
              Travelling with your pet, made simpler
            </h2>
          </div>
          <Link
            href="/blog"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-forest-300 px-5 py-2.5 font-sans text-sm font-semibold text-forest-800 transition-all hover:-translate-y-0.5 hover:border-forest-600 hover:bg-forest-50"
          >
            All guides
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
          </div>
        </Reveal>

        <StaggerGroup className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Lead post gets the large treatment, the rest stack beside it, so
              this section does not repeat the same three-up grid used above. */}
          <StaggerItem>
          <Link
            href={`/blog/${lead.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-forest-200 hover:shadow-xl"
          >
            <div className="relative aspect-16/9 overflow-hidden bg-gray-100">
              <Image
                src={lead.cover_image}
                alt={lead.title}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-6">
              <span className="font-sans text-[0.65rem] font-bold tracking-[0.14em] text-ember-600 uppercase">
                {lead.category}
              </span>
              <h3 className="text-2xl leading-tight text-ink transition-colors group-hover:text-forest-700">
                {lead.title}
              </h3>
              <p className="leading-relaxed text-gray-600">{lead.excerpt}</p>
              <span className="mt-auto pt-3 font-sans text-sm font-semibold text-forest-700">
                Read the guide &rarr;
              </span>
            </div>
          </Link>
          </StaggerItem>

          <div className="flex flex-col gap-6">
            {rest.map((post) => (
              <StaggerItem key={post.slug} className="flex flex-1">
              <Link
                href={`/blog/${post.slug}`}
                className="group flex flex-1 gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-1.5 hover:border-forest-200 hover:shadow-xl sm:gap-5"
              >
                <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:w-40">
                  <Image
                    src={post.cover_image}
                    alt={post.title}
                    fill
                    sizes="160px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex min-w-0 flex-col justify-center gap-1.5">
                  <span className="font-sans text-[0.65rem] font-bold tracking-[0.14em] text-ember-600 uppercase">
                    {post.category}
                  </span>
                  <h3 className="text-lg leading-snug text-ink transition-colors group-hover:text-forest-700">
                    {post.title}
                  </h3>
                  <p className="line-clamp-2 font-sans text-sm text-gray-500">{post.excerpt}</p>
                </div>
              </Link>
              </StaggerItem>
            ))}
          </div>
        </StaggerGroup>
      </div>
    </section>
  );
}
