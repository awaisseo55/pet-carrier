import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { BlogPost } from "./types";

const BLOG_FILE = path.join(process.cwd(), "data", "blog.json");

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const raw = await fs.readFile(BLOG_FILE, "utf-8");
  const posts = JSON.parse(raw) as BlogPost[];
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
