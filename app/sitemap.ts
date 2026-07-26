import type { MetadataRoute } from "next";
import { getActiveProducts } from "@/lib/products";
import { getAllBlogPosts } from "@/lib/blog";
import { siteUrl } from "@/lib/seo";

const STATIC_ROUTES = [
  "",
  "/shop",
  "/shop/dogs",
  "/shop/cats",
  "/shop/small-animals",
  "/shop/birds",
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
  const [products, posts] = await Promise.all([getActiveProducts(), getAllBlogPosts()]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/product/${product.slug}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.published_at),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...productEntries, ...blogEntries];
}
