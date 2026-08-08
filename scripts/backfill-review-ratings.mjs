#!/usr/bin/env node
/**
 * One-time backfill: computes averageRating/reviewCount/ratingBreakdown for
 * every product from data/reviews.json and writes them onto data/products.json.
 * After this runs once, the review API routes (see syncProductRatingStats in
 * lib/reviews.ts) keep these fields in sync on every review create,
 * status change, or delete, so this script shouldn't normally need to run
 * again, it's here mainly as a recovery tool if the cached fields ever drift.
 *
 * Plain Node script rather than importing lib/reviews.ts or lib/products.ts
 * directly, because those are guarded by "server-only", which only resolves
 * inside Next's build/dev server (see scripts/fetch-product-images.mjs for
 * the same pattern). Reads/writes through R2 directly if R2 credentials are
 * present in .env.local (mirrors lib/data-store.ts), otherwise operates on
 * the local /data files.
 *
 * Usage: node scripts/backfill-review-ratings.mjs
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

let readJson;
let writeJson;

if (USE_R2) {
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
  readJson = async (filename) => {
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: `data/${filename}` }));
    return JSON.parse(await res.Body.transformToString("utf-8"));
  };
  writeJson = async (filename, data) => {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `data/${filename}`,
        Body: JSON.stringify(data, null, 2),
        ContentType: "application/json",
      })
    );
  };
  console.log("[backfill-review-ratings] reading/writing via R2");
} else {
  const dataDir = path.join(process.cwd(), "data");
  readJson = async (filename) => JSON.parse(await fs.readFile(path.join(dataDir, filename), "utf-8"));
  writeJson = async (filename, data) =>
    fs.writeFile(path.join(dataDir, filename), `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  console.log("[backfill-review-ratings] reading/writing local /data files");
}

function calculateStats(productReviews) {
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const review of productReviews) {
    const rating = Math.min(5, Math.max(1, Math.round(review.rating)));
    breakdown[rating] += 1;
  }
  const reviewCount = productReviews.length;
  const averageRating =
    reviewCount === 0 ? 0 : productReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount;
  return {
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount,
    ratingBreakdown: breakdown,
  };
}

const reviews = await readJson("reviews.json");
const products = await readJson("products.json");

for (const product of products) {
  const approved = reviews.filter((r) => r.productId === product.id && r.status === "approved");
  const stats = calculateStats(approved);
  product.averageRating = stats.averageRating;
  product.reviewCount = stats.reviewCount;
  product.ratingBreakdown = stats.ratingBreakdown;
}

await writeJson("products.json", products);
console.log(`[backfill-review-ratings] updated ${products.length} product(s)`);
