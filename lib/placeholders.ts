import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { CategoryNode } from "./categories";
import { HERO_IMAGE, IMAGES_BY_ANIMAL, BED_IMAGES, STROLLER_IMAGES } from "./images";
import { getResolvedCategory } from "./category-store";

const PUBLIC_DIR = path.join(process.cwd(), "public");

async function fileVersion(relativePath: string): Promise<number | null> {
  try {
    const stats = await fs.stat(path.join(PUBLIC_DIR, relativePath));
    return Math.floor(stats.mtimeMs);
  } catch {
    return null;
  }
}

export function categoryUploadSlug(categoryPath: string): string {
  return categoryPath.replace(/\//g, "-");
}

function curatedFallbackImage(node: CategoryNode): string {
  const pool = IMAGES_BY_ANIMAL[node.animal];
  if (pool && pool.length > 0) return pool[0];
  if (node.section === "beds") return BED_IMAGES[0];
  if (node.section === "strollers") return STROLLER_IMAGES[0];
  return HERO_IMAGE;
}

/**
 * Resolves the image shown for a category page: an admin upload if one
 * exists at /public/uploads/category/[path-with-dashes].webp, a manually
 * set override image, otherwise a curated Unsplash image verified to
 * actually show that animal (see lib/images.ts).
 */
export async function getCategoryImageUrl(
  categoryPath: string
): Promise<{ url: string; isCustom: boolean }> {
  const relativePath = `uploads/category/${categoryUploadSlug(categoryPath)}.webp`;
  const version = await fileVersion(relativePath);
  if (version !== null) {
    return { url: `/${relativePath}?v=${version}`, isCustom: true };
  }

  const resolved = await getResolvedCategory(categoryPath);
  if (resolved?.image) {
    return { url: resolved.image, isCustom: true };
  }
  if (resolved) {
    return { url: curatedFallbackImage(resolved.node), isCustom: false };
  }

  return { url: HERO_IMAGE, isCustom: false };
}

export async function getHeroImageUrl(): Promise<{ url: string; isCustom: boolean }> {
  const relativePath = "uploads/hero/main-hero.webp";
  const version = await fileVersion(relativePath);
  if (version !== null) {
    return { url: `/${relativePath}?v=${version}`, isCustom: true };
  }
  return { url: HERO_IMAGE, isCustom: false };
}

export { PRODUCT_PLACEHOLDER } from "./constants";
