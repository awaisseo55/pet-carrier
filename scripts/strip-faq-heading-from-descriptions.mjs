#!/usr/bin/env node
/**
 * One-time fix: a number of AI-generated product descriptions ended with a
 * stray, empty "## Frequently Asked Questions" heading (a leftover from the
 * generation template, never followed by any content, since the real Q&A
 * pairs live in the separate product.faqs array rendered by its own
 * component). That produced a visible duplicate "Frequently Asked Questions"
 * heading on the product page: once from this trailing heading inside the
 * description body, once from the actual FAQ accordion section beneath it.
 * This strips only that trailing empty heading from description text.
 *
 * Plain Node script rather than importing lib/products.ts directly, because
 * that's guarded by "server-only" (see scripts/backfill-review-ratings.mjs
 * for the same pattern). Reads the live products.json from R2 first (if R2
 * credentials are present in .env.local), patches only the description
 * field on affected products, and writes the whole array back, so any
 * runtime-only fields (averageRating, reviewCount, ratingBreakdown) already
 * live on R2 are preserved rather than reset.
 *
 * Usage: node scripts/strip-faq-heading-from-descriptions.mjs
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
  console.log("[strip-faq-heading] reading/writing via R2");
} else {
  const dataDir = path.join(process.cwd(), "data");
  readJson = async (filename) => JSON.parse(await fs.readFile(path.join(dataDir, filename), "utf-8"));
  writeJson = async (filename, data) =>
    fs.writeFile(path.join(dataDir, filename), `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  console.log("[strip-faq-heading] reading/writing local /data files");
}

const pattern = /\n*##\s*Frequently Asked Questions\s*$/i;

const products = await readJson("products.json");

let changed = 0;
for (const product of products) {
  const desc = product.description;
  if (!desc) continue;
  const stripped = desc.replace(pattern, "");
  if (stripped !== desc) {
    product.description = stripped;
    changed += 1;
    console.log(`  fixed: ${product.slug}`);
  }
}

await writeJson("products.json", products);
console.log(`[strip-faq-heading] updated ${changed} product(s) of ${products.length}`);
