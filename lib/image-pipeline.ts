import "server-only";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

const PRODUCTS_DIR = path.join(process.cwd(), "public", "products");

/**
 * Downloads product images from Amazon, resizes and converts them to WebP,
 * and stores them under /public/products/[asin]/. Returns the public URL
 * paths to reference from the product record.
 */
export async function downloadAndProcessImages(asin: string, imageUrls: string[]): Promise<string[]> {
  const dir = path.join(PRODUCTS_DIR, asin);
  await fs.mkdir(dir, { recursive: true });

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

      await sharp(buffer)
        .resize(size, size, { fit: "cover" })
        .webp({ quality: 85 })
        .toFile(path.join(dir, filename));

      results.push(`/products/${asin}/${filename}`);
    } catch (error) {
      console.error(`Failed to process image ${i} for ASIN ${asin}`, error);
    }
  }

  return results;
}
