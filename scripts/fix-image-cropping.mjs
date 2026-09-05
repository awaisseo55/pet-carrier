#!/usr/bin/env node
/**
 * One-off fix: bulk-build.mjs processed every image with sharp's
 * `fit: "cover"`, which crops a source image to fill a 1200x1200 square.
 * Several of these Amazon hiRes images are wide banner-style shots
 * (e.g. 1500x726), so "cover" cropped away most of the product (a bed's
 * side panels, most of a carrier) rather than just trimming background.
 * The gallery displays images in a 1:1 `aspect-square` box with CSS
 * `object-cover`, so a perfectly square 1200x1200 source (with white
 * letterboxing baked in for non-square originals) fills that box exactly
 * with no further cropping — the fix is `fit: "contain"` on a white
 * canvas instead of `fit: "cover"`.
 *
 * Per CLAUDE.md's rule against overwriting an R2 image key once its bare
 * URL may have been requested, this uploads corrected images to new
 * "-v2" keys rather than overwriting the original (already-live) keys,
 * then repoints every product record at the new URLs.
 */
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const R2_BUCKET = process.env.R2_BUCKET_NAME;
const R2_DATA_BUCKET = process.env.R2_DATA_BUCKET_NAME;
const R2_PUBLIC_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/$/, "");

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});

const RESEARCH_DIR = path.join(process.cwd(), "scripts", ".bulk-research");
const TARGET_ASINS = [
  "B0GZPVDTL5",
  "B0H3KFJRRR",
  "B0F9WKZFRG",
  "B0GGB737J5",
  "B0BVY2K2JV",
  "B0BYMN7SLY",
  "B0CRYWDWDG",
  "B09YNBL3QR",
  "B08NC88YD7",
  "B0CRYW1CDB",
];

function slugifyColour(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function uploadBuffer(key, buffer) {
  await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: buffer, ContentType: "image/webp" }));
  return `${R2_PUBLIC_URL}/${key}`;
}

/** Same three sizes as bulk-build.mjs, but "contain" on white instead of "cover", so nothing is cropped away. */
async function downloadAndUploadFixed(sourceUrl, keyPrefix) {
  const res = await fetch(sourceUrl, {
    headers: { "User-Agent": UA, Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${sourceUrl}`);
  const buf = Buffer.from(await res.arrayBuffer());

  const white = { r: 255, g: 255, b: 255, alpha: 1 };
  const main = await sharp(buf)
    .resize(1200, 1200, { fit: "contain", background: white })
    .flatten({ background: white })
    .webp({ quality: 85 })
    .toBuffer();
  const thumb = await sharp(buf)
    .resize(400, 400, { fit: "contain", background: white })
    .flatten({ background: white })
    .webp({ quality: 80 })
    .toBuffer();
  // zoom was already fit:"inside" (no crop), left as-is by not touching it here.

  const mainUrl = await uploadBuffer(`${keyPrefix}-v2-main.webp`, main);
  await uploadBuffer(`${keyPrefix}-v2-thumb.webp`, thumb);
  return mainUrl;
}

const res = await r2.send(new GetObjectCommand({ Bucket: R2_DATA_BUCKET, Key: "data/products.json" }));
const text = await res.Body.transformToString("utf-8");
const products = JSON.parse(text);
const byId = new Map(products.map((p) => [p.id, p]));

for (const asin of TARGET_ASINS) {
  const product = byId.get(asin);
  const research = JSON.parse(await fs.readFile(path.join(RESEARCH_DIR, `${asin}.json`), "utf-8"));
  console.log(`\n--- ${asin}: ${product.title} ---`);

  const newImages = [];
  for (let i = 0; i < research.images.length; i++) {
    try {
      const url = await downloadAndUploadFixed(research.images[i], `uploads/product/${asin}/image-${i}`);
      newImages.push(url);
      console.log(`  gallery image ${i}: OK`);
    } catch (err) {
      console.log(`  gallery image ${i}: FAILED (${err.message}), keeping old URL`);
      if (product.images[i]) newImages.push(product.images[i]);
    }
  }
  product.images = newImages;

  const newColourUrlByName = new Map();
  for (const swatch of research.colourSwatches) {
    if (!swatch.image) continue;
    try {
      const url = await downloadAndUploadFixed(
        swatch.image,
        `uploads/product/${asin}/colour-${slugifyColour(swatch.label)}`
      );
      newColourUrlByName.set(swatch.label.toLowerCase().trim(), url);
      console.log(`  colour image "${swatch.label}": OK`);
    } catch (err) {
      console.log(`  colour image "${swatch.label}": FAILED (${err.message})`);
    }
  }
  if (product.variants) {
    for (const v of product.variants) {
      if (v.colour) {
        const newUrl = newColourUrlByName.get(v.colour.toLowerCase().trim());
        if (newUrl) v.colourImage = newUrl;
      }
    }
  }
}

await r2.send(
  new PutObjectCommand({
    Bucket: R2_DATA_BUCKET,
    Key: "data/products.json",
    Body: JSON.stringify(products, null, 2),
    ContentType: "application/json",
  })
);
console.log("\nWrote patched products.json to R2.");

await fs.writeFile(
  path.join(process.cwd(), "data", "products.json"),
  JSON.stringify(products, null, 2) + "\n",
  "utf-8"
);
console.log("Wrote patched products.json to local data/products.json.");
