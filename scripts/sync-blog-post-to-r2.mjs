#!/usr/bin/env node
/**
 * One-off: publishes the new "Complete Guide to Cat Carriers" pillar post
 * (already committed to the local/git data/blog.json) to the live R2 blog
 * data, and patches the existing nervous-cat post's related_slugs to link
 * back to it. Reads the live object first and only inserts/patches the
 * specific post rather than overwriting the file wholesale, so any other
 * live-only blog edits are untouched. Mirrors the pattern in
 * scripts/sync-dog-carrier-content-to-r2.mjs.
 *
 * Usage: node scripts/sync-blog-post-to-r2.mjs
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
  console.error("[sync-blog-post-to-r2] No R2 credentials found in .env.local, nothing to sync.");
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

const localBlog = JSON.parse(await fs.readFile(path.join(process.cwd(), "data", "blog.json"), "utf-8"));
const localPosts = Array.isArray(localBlog) ? localBlog : localBlog.posts;
const newPost = localPosts.find((p) => p.slug === "complete-guide-to-cat-carriers");
if (!newPost) {
  console.error('[sync-blog-post-to-r2] "complete-guide-to-cat-carriers" not found in local data/blog.json');
  process.exit(1);
}

const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: "data/blog.json" }));
const live = JSON.parse(await res.Body.transformToString("utf-8"));
const posts = Array.isArray(live) ? live : live.posts;

if (!posts.some((p) => p.slug === newPost.slug)) {
  posts.unshift(newPost);
  console.log("[sync-blog-post-to-r2] inserted new post");
} else {
  console.log("[sync-blog-post-to-r2] post already present, skipping insert");
}

const nervousCat = posts.find((p) => p.slug === "helping-a-nervous-cat-get-used-to-a-carrier");
if (nervousCat && !nervousCat.related_slugs.includes("complete-guide-to-cat-carriers")) {
  nervousCat.related_slugs.unshift("complete-guide-to-cat-carriers");
  console.log("[sync-blog-post-to-r2] patched related_slugs on nervous-cat post");
}

await client.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: "data/blog.json",
    Body: JSON.stringify(live, null, 2),
    ContentType: "application/json",
  })
);
console.log("[sync-blog-post-to-r2] done, total posts:", posts.length);
