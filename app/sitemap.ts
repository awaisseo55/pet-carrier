import type { MetadataRoute } from "next";
import { getActiveProducts } from "@/lib/products";
import { getAllBlogPosts } from "@/lib/blog";
import { getAllCategoryNodes } from "@/lib/category-store";
import { siteUrl } from "@/lib/seo";

const STATIC_ROUTES = [
  "",
  "/about",
  "/contact",
  "/blog",
  "/shipping",
  "/returns",
  "/privacy",
  "/terms",
  "/disclaimer",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts, categories] = await Promise.all([
    getActiveProducts(),
    getAllBlogPosts(),
    getAllCategoryNodes(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteUrl}/${category.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: category.level === 1 ? 0.9 : category.level === 2 ? 0.8 : 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/product/${product.slug}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || post.published_at),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries, ...blogEntries];
}
