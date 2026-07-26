import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import type { BlogPost } from "./types";

const BLOG_FILE = path.join(process.cwd(), "data", "blog.json");

async function getRawPosts(): Promise<BlogPost[]> {
  const raw = await fs.readFile(BLOG_FILE, "utf-8");
  return JSON.parse(raw) as BlogPost[];
}

async function saveAllBlogPosts(posts: BlogPost[]): Promise<void> {
  await fs.writeFile(BLOG_FILE, JSON.stringify(posts, null, 2), "utf-8");
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
