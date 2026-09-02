#!/usr/bin/env node
/**
 * One-time fix: patches live R2 data to match the local git-tracked copy for
 * a handful of specific fields that changed as part of the £70 free-shipping
 * threshold / 14-day returns / Manchester address update. Reads each live
 * file from R2 first, patches only the known fields, and writes it back, so
 * runtime-only fields (averageRating etc on products, though this script
 * never touches products.json) are never at risk. Mirrors the pattern in
 * scripts/backfill-review-ratings.mjs and scripts/strip-faq-heading-from-descriptions.mjs.
 *
 * Usage: node scripts/apply-policy-updates.mjs
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
  console.log("[apply-policy-updates] reading/writing via R2");
} else {
  const dataDir = path.join(process.cwd(), "data");
  readJson = async (filename) => JSON.parse(await fs.readFile(path.join(dataDir, filename), "utf-8"));
  writeJson = async (filename, data) =>
    fs.writeFile(path.join(dataDir, filename), `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  console.log("[apply-policy-updates] reading/writing local /data files");
}

// --- settings.json: patch only contact_address and free_shipping_threshold ---
const settings = await readJson("settings.json");
settings.contact_address = "Manchester, United Kingdom";
settings.free_shipping_threshold = 70;
await writeJson("settings.json", settings);
console.log("[apply-policy-updates] settings.json patched");

// --- homepage.json: patch only hero_subheading and trust_badges ---
const homepage = await readJson("homepage.json");
homepage.hero_subheading = "Curated pet carriers, strollers and beds. Free UK shipping over £70. 14-day returns.";
homepage.trust_badges = homepage.trust_badges.map((badge) =>
  badge === "30-Day Returns" ? "14-Day Returns" : badge
);
await writeJson("homepage.json", homepage);
console.log("[apply-policy-updates] homepage.json patched");

// --- category-content.json: patch admin-authored override text containing the old £50/30-day copy ---
const categoryContent = await readJson("category-content.json");
let categoryContentChanged = 0;

function patchString(value) {
  if (typeof value !== "string") return value;
  let next = value;
  if (next.includes("£50")) {
    next = next
      .replaceAll(
        "Yes, orders over £50 qualify for free standard UK shipping, with a small delivery charge shown at checkout for orders under that. We also offer 30-day returns.",
        "Yes, orders over £70 qualify for free standard UK shipping, with a small delivery charge shown at checkout for orders under that. We also offer 14-day returns."
      )
      .replaceAll("Free UK delivery over £50.", "Free UK delivery over £70.");
  }
  if (next !== value) categoryContentChanged += 1;
  return next;
}

function walk(node) {
  if (Array.isArray(node)) {
    return node.map(walk);
  }
  if (node && typeof node === "object") {
    const result = {};
    for (const [key, value] of Object.entries(node)) {
      result[key] = typeof value === "string" ? patchString(value) : walk(value);
    }
    return result;
  }
  return node;
}

const patchedCategoryContent = walk(categoryContent);
await writeJson("category-content.json", patchedCategoryContent);
console.log(`[apply-policy-updates] category-content.json patched (${categoryContentChanged} string(s) changed)`);
