import "server-only";
import sharp from "sharp";
import { uploadImageBuffer } from "./image-store";

// A real browser UA, some source CDNs (including Amazon's) reject requests
// carrying an obvious bot identifier.
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Downloads product images from Amazon, resizes and converts them to WebP,
 * and stores them via lib/image-store.ts (local /public/uploads/product/[asin]/
 * in dev, Vercel Blob in production). Returns the public URLs to reference
 * from the product record.
 */
export async function downloadAndProcessImages(asin: string, imageUrls: string[]): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PetCarrierBot/1.0)" },
      });
      if (!response.ok) continue;

      const buffer = Buffer.from(await response.arrayBuffer());
      const isMain = i === 0;
      const filename = isMain ? "main.webp" : `image-${i}.webp`;
      const size = isMain ? 1200 : 400;

      const processed = await sharp(buffer)
        .resize(size, size, { fit: "cover" })
        .webp({ quality: 85 })
        .toBuffer();

      const imageUrl = await uploadImageBuffer(`uploads/product/${asin}/${filename}`, processed);
      results.push(imageUrl);
    } catch (error) {
      console.error(`Failed to process image ${i} for ASIN ${asin}`, error);
    }
  }

  return results;
}

export interface ProductImageSet {
  /** 1200x1200 WebP, cropped to fill. What Product.images should reference. */
  main: string;
  /** 400x400 WebP, cropped to fill. */
  thumb: string;
  /** Longest side capped at 2000px, full frame preserved (no crop), for zoom/lightbox use. */
  zoom: string;
}

/**
 * Richer version of downloadAndProcessImages: for each source URL, generates
 * all three sizes the admin workflow expects (main/thumb/zoom) via
 * lib/image-store.ts. Used by the Amazon import pipeline and the
 * product-adding workflow described in docs/PRODUCT-WORKFLOW.md.
 */
export async function downloadAndProcessProductImageSet(
  id: string,
  imageUrls: string[],
  startIndex = 0
): Promise<ProductImageSet[]> {
  const results: ProductImageSet[] = [];

  for (let offset = 0; offset < imageUrls.length; offset++) {
    const i = startIndex + offset;
    const url = imageUrls[offset];
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": BROWSER_USER_AGENT,
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
      });
      if (!response.ok) {
        console.error(`Image ${i} for ${id} returned HTTP ${response.status}: ${url}`);
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const mainFile = `image-${i}-main.webp`;
      const thumbFile = `image-${i}-thumb.webp`;
      const zoomFile = `image-${i}-zoom.webp`;

      const mainBuffer = await sharp(buffer).resize(1200, 1200, { fit: "cover" }).webp({ quality: 85 }).toBuffer();
      const thumbBuffer = await sharp(buffer).resize(400, 400, { fit: "cover" }).webp({ quality: 80 }).toBuffer();
      const zoomBuffer = await sharp(buffer)
        .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 90 })
        .toBuffer();

      results.push({
        main: await uploadImageBuffer(`uploads/product/${id}/${mainFile}`, mainBuffer),
        thumb: await uploadImageBuffer(`uploads/product/${id}/${thumbFile}`, thumbBuffer),
        zoom: await uploadImageBuffer(`uploads/product/${id}/${zoomFile}`, zoomBuffer),
      });
    } catch (error) {
      console.error(`Failed to process image ${i} for ${id}`, error);
    }
  }

  return results;
}
