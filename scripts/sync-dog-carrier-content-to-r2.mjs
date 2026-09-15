#!/usr/bin/env node
/**
 * One-time fix: the dog carrier collection SEO copy/meta-title changes and
 * the Puppy Bicycle -> Puppy Bike Carriers merge were committed to the local
 * git-tracked /data files, but production reads/writes data/*.json through
 * R2 once it's been seeded there (lib/data-store.ts), not from the bundled
 * git copy on every deploy. So the new copy never reached the live site.
 * This patches only the specific fields that changed on the live R2 objects,
 * never overwriting either file wholesale, so nothing else live (other
 * admin edits, runtime-only product rating fields, custom categories) is at
 * risk. Mirrors the pattern in scripts/apply-policy-updates.mjs.
 *
 * Usage: node scripts/sync-dog-carrier-content-to-r2.mjs
 */
import { promises as fs } from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
try {
  const envText = await fs.readFile(envPath, "utf-8");
  for (const line of envText.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
} catch {
  // No .env.local present, rely on real environment variables instead.
}

const USE_R2 = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME &&
  process.env.R2_DATA_BUCKET_NAME
);

if (!USE_R2) {
  console.error("[sync-dog-carrier-content-to-r2] No R2 credentials found in .env.local, nothing to sync.");
  process.exit(1);
}

const { S3Client, GetObjectCommand, PutObjectCommand } = await import("@aws-sdk/client-s3");
const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.R2_DATA_BUCKET_NAME;

async function readR2(filename) {
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: `data/${filename}` }));
  return JSON.parse(await res.Body.transformToString("utf-8"));
}
async function writeR2(filename, data) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: `data/${filename}`,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
    })
  );
}

const dataDir = path.join(process.cwd(), "data");
async function readLocal(filename) {
  return JSON.parse(await fs.readFile(path.join(dataDir, filename), "utf-8"));
}

console.log("[sync-dog-carrier-content-to-r2] reading live category-content.json from R2");
const liveCategoryContent = await readR2("category-content.json");
const localCategoryContent = await readLocal("category-content.json");

const DOG_CARRIER_PATHS = [
  "carriers/dog-carriers",
  "carriers/dog-carriers/puppy-carriers",
  "carriers/dog-carriers/puppy-slings",
  "carriers/dog-carriers/puppy-bike-carriers",
  "carriers/dog-carriers/small-dog-carriers",
  "carriers/dog-carriers/medium-dog-carriers",
  "carriers/dog-carriers/large-dog-carriers",
  "carriers/dog-carriers/dog-slings",
  "carriers/dog-carriers/dog-backpack-carriers",
  "carriers/dog-carriers/airline-approved-dog-carriers",
  "carriers/dog-carriers/dog-car-carriers",
  "carriers/dog-carriers/dog-bike-carriers",
  "carriers/dog-carriers/hiking-dog-carriers",
  "carriers/dog-carriers/rolling-dog-carriers",
];

let removedBicycleOverride = false;
if (liveCategoryContent.overrides["carriers/dog-carriers/puppy-bicycle-carriers"]) {
  delete liveCategoryContent.overrides["carriers/dog-carriers/puppy-bicycle-carriers"];
  removedBicycleOverride = true;
}

let patchedCount = 0;
for (const p of DOG_CARRIER_PATHS) {
  const localOverride = localCategoryContent.overrides[p];
  if (!localOverride) {
    console.warn(`[sync-dog-carrier-content-to-r2] no local override for "${p}", skipping`);
    continue;
  }
  // Merge: local's edited fields win, but any field only present on the live
  // object (e.g. an admin-set `image` or `featured_product_ids`) is kept.
  liveCategoryContent.overrides[p] = { ...liveCategoryContent.overrides[p], ...localOverride };
  patchedCount += 1;
}

await writeR2("category-content.json", liveCategoryContent);
console.log(
  `[sync-dog-carrier-content-to-r2] category-content.json patched: ${patchedCount} path(s) updated, ` +
    `bicycle-carriers override removed: ${removedBicycleOverride}`
);

console.log("[sync-dog-carrier-content-to-r2] reading live products.json from R2");
const liveProducts = await readR2("products.json");
const liveProductList = Array.isArray(liveProducts) ? liveProducts : liveProducts.products;

const TARGET_SLUG = "carriers/dog-carriers/puppy-bicycle-carriers";
let productsPatched = 0;
for (const p of liveProductList) {
  if (Array.isArray(p.category_slugs) && p.category_slugs.includes(TARGET_SLUG)) {
    p.category_slugs = p.category_slugs.filter((s) => s !== TARGET_SLUG);
    productsPatched += 1;
  }
}

await writeR2("products.json", liveProducts);
console.log(`[sync-dog-carrier-content-to-r2] products.json patched: ${productsPatched} product(s) updated`);

console.log("[sync-dog-carrier-content-to-r2] done");
