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
