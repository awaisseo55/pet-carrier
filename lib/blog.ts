import "server-only";
import { nanoid } from "nanoid";
import type { BlogPost } from "./types";
import { readJsonFile, writeJsonFile } from "./data-store";

async function getRawPosts(): Promise<BlogPost[]> {
  return readJsonFile<BlogPost[]>("blog.json");
}

async function saveAllBlogPosts(posts: BlogPost[]): Promise<void> {
  await writeJsonFile("blog.json", posts);
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const posts = await getRawPosts();
  return posts.sort((a, b) => (a.published_at < b.published_at ? 1 : -1));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const posts = await getAllBlogPosts();
  return posts.find((p) => p.slug === slug);
}

export async function getLatestBlogPosts(limit = 3): Promise<BlogPost[]> {
  const posts = await getAllBlogPosts();
  return posts.slice(0, limit);
}

/**
 * Hand-curated category path -> blog slug relevance map, used to surface posts
 * under the "From the Blog" section on category pages. Ordered most specific
 * to least specific; a category path can match several rules (e.g. an airline
 * approved dog carrier page matches both the airline rule and the broader
 * dog-carriers rule), so results are deduplicated and capped at `limit`.
 */
const CATEGORY_BLOG_RULES: { paths: string[]; prefix?: boolean; slugs: string[] }[] = [
  {
    paths: [
      "carriers/pet-airline-approved-carriers",
      "carriers/dog-carriers/airline-approved-dog-carriers",
      "carriers/cat-carriers/airline-approved-cat-carriers",
    ],
    slugs: ["flying-with-your-pet-what-uk-airlines-expect"],
  },
  {
    paths: [
      "carriers/pet-soft-sided-carriers",
      "carriers/pet-hard-sided-carriers",
      "carriers/cat-carriers/soft-sided-cat-carriers",
      "carriers/cat-carriers/hard-sided-cat-carriers",
      "carriers",
    ],
    slugs: ["soft-sided-vs-hard-shell-carriers-which-is-right-for-you"],
  },
  {
    paths: ["carriers/small-animal-carriers"],
    prefix: true,
    slugs: ["settling-a-rabbit-or-guinea-pig-for-a-short-trip"],
  },
  {
    paths: ["carriers/cat-carriers"],
    prefix: true,
    slugs: ["helping-a-nervous-cat-get-used-to-a-carrier"],
  },
  {
    paths: ["carriers/dog-carriers"],
    prefix: true,
    slugs: ["choosing-the-right-carrier-size-for-your-dog"],
  },
];

export async function getRelevantBlogPosts(categoryPath: string, limit = 2): Promise<BlogPost[]> {
  const slugs: string[] = [];
  for (const rule of CATEGORY_BLOG_RULES) {
    const matches = rule.prefix
      ? rule.paths.some((p) => categoryPath === p || categoryPath.startsWith(`${p}/`))
      : rule.paths.includes(categoryPath);
    if (matches) {
      for (const slug of rule.slugs) {
        if (!slugs.includes(slug)) slugs.push(slug);
      }
    }
    if (slugs.length >= limit) break;
  }
  if (slugs.length === 0) return [];

  const posts = await getAllBlogPosts();
  return slugs
    .slice(0, limit)
    .map((slug) => posts.find((p) => p.slug === slug))
    .filter((p): p is BlogPost => Boolean(p));
}

export async function createBlogPost(post: Omit<BlogPost, "id">): Promise<BlogPost> {
  const posts = await getRawPosts();
  const newPost: BlogPost = { ...post, id: nanoid(10) };
  posts.push(newPost);
  await saveAllBlogPosts(posts);
  return newPost;
}

export async function updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<BlogPost | null> {
  const posts = await getRawPosts();
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) return null;
  posts[index] = { ...posts[index], ...updates };
  await saveAllBlogPosts(posts);
  return posts[index];
}

export async function deleteBlogPost(id: string): Promise<void> {
  const posts = await getRawPosts();
  await saveAllBlogPosts(posts.filter((p) => p.id !== id));
}
