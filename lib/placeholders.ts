import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { CATEGORY_IMAGES, HERO_IMAGE } from "./images";
import type { PetType } from "./types";

const PUBLIC_DIR = path.join(process.cwd(), "public");

async function fileVersion(relativePath: string): Promise<number | null> {
  try {
    const stats = await fs.stat(path.join(PUBLIC_DIR, relativePath));
    return Math.floor(stats.mtimeMs);
  } catch {
    return null;
  }
}

/**
 * Resolves the image shown for a category: an admin-uploaded custom image
 * if one exists at /public/categories/[category].webp, otherwise a curated
 * Unsplash image verified to actually show that animal (see lib/images.ts).
 * The upload's mtime is appended as a cache-busting query param so a
 * replaced image shows up immediately rather than serving a cached copy.
 */
export async function getCategoryImageUrl(category: PetType): Promise<{ url: string; isCustom: boolean }> {
  const relativePath = `categories/${category}.webp`;
  const version = await fileVersion(relativePath);
  if (version !== null) {
    return { url: `/${relativePath}?v=${version}`, isCustom: true };
  }
  return { url: CATEGORY_IMAGES[category], isCustom: false };
}

export async function getHeroImageUrl(): Promise<{ url: string; isCustom: boolean }> {
  const relativePath = "hero/main-hero.webp";
  const version = await fileVersion(relativePath);
  if (version !== null) {
    return { url: `/${relativePath}?v=${version}`, isCustom: true };
  }
  return { url: HERO_IMAGE, isCustom: false };
}

export { PRODUCT_PLACEHOLDER } from "./constants";
