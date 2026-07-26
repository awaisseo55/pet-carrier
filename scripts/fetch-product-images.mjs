#!/usr/bin/env node
/**
 * Standalone CLI companion to lib/image-pipeline.ts's
 * downloadAndProcessProductImageSet, for scripting product additions outside
 * the admin panel (e.g. bulk-seeding from verified image URLs). Kept as a
 * plain Node script rather than importing the lib/ version directly because
 * lib files are guarded by "server-only", which only resolves correctly
 * inside Next's build/dev server, not under plain `node`.
 *
 * Usage:
 *   node scripts/fetch-product-images.mjs <productId> '["https://...jpg", ...]'
 *
 * Downloads each URL with a real browser User-Agent and writes three WebP
 * variants per image to public/uploads/product/<productId>/:
 *   image-N-main.webp  (1200x1200, cropped to fill — what Product.images[] should reference)
 *   image-N-thumb.webp (400x400, cropped to fill)
 *   image-N-zoom.webp  (longest side capped at 2000px, full frame preserved)
 *
 * Prints a JSON array of {main, thumb, zoom, sourceBytes} to stdout.
 * See docs/PRODUCT-WORKFLOW.md for the full product-adding process.
 */
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

const [, , id, urlsJson] = process.argv;
if (!id || !urlsJson) {
  console.error('Usage: node scripts/fetch-product-images.mjs <productId> \'["https://...jpg"]\'');
  process.exit(1);
}
const urls = JSON.parse(urlsJson);
const PRODUCTS_DIR = path.join(process.cwd(), "public", "uploads", "product");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const dir = path.join(PRODUCTS_DIR, id);
await fs.mkdir(dir, { recursive: true });

const results = [];
for (let i = 0; i < urls.length; i++) {
  const url = urls[i];
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8" },
    });
    if (!res.ok) {
      console.error(`FAIL image ${i}: HTTP ${res.status} - ${url}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const mainFile = `image-${i}-main.webp`;
    const thumbFile = `image-${i}-thumb.webp`;
    const zoomFile = `image-${i}-zoom.webp`;

    await sharp(buf).resize(1200, 1200, { fit: "cover" }).webp({ quality: 85 }).toFile(path.join(dir, mainFile));
    await sharp(buf).resize(400, 400, { fit: "cover" }).webp({ quality: 80 }).toFile(path.join(dir, thumbFile));
    await sharp(buf)
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 90 })
      .toFile(path.join(dir, zoomFile));

    results.push({
      main: `/uploads/product/${id}/${mainFile}`,
      thumb: `/uploads/product/${id}/${thumbFile}`,
      zoom: `/uploads/product/${id}/${zoomFile}`,
      sourceBytes: buf.length,
    });
    console.error(`OK image ${i}: ${buf.length} bytes -> ${mainFile}`);
  } catch (err) {
    console.error(`ERROR image ${i}: ${err.message} - ${url}`);
  }
}

console.log(JSON.stringify(results));
