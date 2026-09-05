#!/usr/bin/env node
/**
 * One-off fix: the bulk-build.mjs variant.size extraction assumed a short
 * code prefix like "M (43x32x30cm)" (the site's existing convention), but
 * these Amazon listings only expose raw dimension strings with no short
 * code ("132 x 104 x 20 cm (L x W x H)"), so the regex fallback produced
 * garbage ("122" as size, "x 89 x 19 cm L x W x H" as the leftover label).
 * The Specifications table on the product page does
 * `sizeLabel.replace(`${size} `, "")`, which only works if `size` is a real
 * prefix of `sizeLabel`.
 *
 * Fix: for each of the 10 newly-added products, derive S/M/L/XL/... tier
 * codes from each distinct size's footprint (length x width, parsed from
 * the dimension string), smallest first, and rewrite size/sizeLabel to
 * "{tier} ({original dimension text})" to match the established format.
 */
import { promises as fs } from "fs";
import path from "path";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});
const R2_DATA_BUCKET = process.env.R2_DATA_BUCKET_NAME;

const TARGET_IDS = new Set([
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
]);

const TIERS = ["S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL"];

function footprint(dimText) {
  const nums = dimText.match(/[\d.]+/g);
  if (!nums || nums.length < 2) return 0;
  return parseFloat(nums[0]) * parseFloat(nums[1]);
}

function rebuildSizes(product) {
  if (!product.variants || !product.variants.some((v) => v.sizeLabel)) return product;

  // Original dimension text is whatever sizeLabel currently holds (first
  // pass wrote the raw scraped string here, since size-code prefixing was
  // the part that was broken).
  const distinctDims = Array.from(new Set(product.variants.map((v) => v.sizeLabel).filter(Boolean)));
  distinctDims.sort((a, b) => footprint(a) - footprint(b));

  const tierByDim = new Map(distinctDims.map((dim, i) => [dim, TIERS[i] || `T${i + 1}`]));

  for (const v of product.variants) {
    if (!v.sizeLabel) continue;
    const tier = tierByDim.get(v.sizeLabel);
    const cleanDims = v.sizeLabel.replace(/\s*\(L x W x H\)\s*$/i, "").trim();
    v.size = tier;
    v.sizeLabel = `${tier} (${cleanDims})`;
  }
  return product;
}

const res = await r2.send(new GetObjectCommand({ Bucket: R2_DATA_BUCKET, Key: "data/products.json" }));
const text = await res.Body.transformToString("utf-8");
const products = JSON.parse(text);

for (const p of products) {
  if (TARGET_IDS.has(p.id)) {
    console.log(`Fixing size labels for ${p.id} (${p.title})`);
    rebuildSizes(p);
    if (p.variants) {
      const sample = p.variants.slice(0, 3).map((v) => `${v.size}: ${v.sizeLabel}`);
      console.log("  sample:", sample.join(" | "));
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
