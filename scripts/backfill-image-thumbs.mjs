#!/usr/bin/env node
/**
 * Generates the missing 400x400 `-thumb.webp` sibling for every product image
 * on R2, so listing grids can serve thumbnails instead of the 1200x1200 main
 * files (see lib/image-variants.ts for why that matters).
 *
 * lib/image-pipeline.ts has written main/thumb/zoom for a while, but images
 * imported before that (the `gallery-N.webp` naming) only ever got one size.
 * Cards fall back to the full-size URL when a thumb is missing, so this script
 * is an optimisation rather than a correctness fix, but every image it covers
 * is one less oversized download on a category page.
 *
 *   npm run check:thumbs      report coverage, write nothing
 *   npm run backfill:thumbs   generate and upload the missing thumbs
 *
 * Both modes also verify that every image a product or variant references
 * actually exists in the bucket, and exit non-zero if any does not. That is
 * the one check nothing else in the repo performs: check-image-domains.mjs
 * validates hostnames but not that the object is really there, which is how a
 * dead variants[].colourImage URL survived unnoticed.
 *
 * Safety properties, per CLAUDE.md's R2 rules:
 *  - It only ever writes keys that do not already exist (checked with
 *    HeadObject first). An existing image key is never overwritten, so
 *    Cloudflare's edge cache can never be left holding stale bytes for a key
 *    whose content changed.
 *  - It only writes to the public image bucket (R2_BUCKET_NAME), never to the
 *    data bucket, and it never writes any *.json.
 *  - It reads the live products.json from R2 rather than trusting the local
 *    copy, and unions it with the local one so nothing referenced in either is
 *    missed. It does not write products.json back: thumb URLs are derived at
 *    render time, not stored.
 */
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const ROOT = process.cwd();
const DRY_RUN = process.argv.includes("--dry-run");
const CONCURRENCY = 8;

async function loadEnvLocal() {
  try {
    const text = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!(key in process.env)) process.env[key] = trimmed.slice(eq + 1).trim();
    }
  } catch {
    // no .env.local, fine when env vars are set directly
  }
}

/** Mirrors thumbnailUrl() in lib/image-variants.ts, on keys rather than URLs. */
function thumbKey(key) {
  if (!key.endsWith(".webp")) return null;
  if (key.endsWith("-thumb.webp") || key.endsWith("-zoom.webp")) return null;
  if (key.endsWith("-main.webp")) return key.replace(/-main\.webp$/, "-thumb.webp");
  return key.replace(/\.webp$/, "-thumb.webp");
}

function collectImageUrls(raw) {
  const products = Array.isArray(raw) ? raw : raw?.products || [];
  const urls = new Set();
  for (const product of products) {
    for (const url of product.images || []) urls.add(url);
    for (const variant of product.variants || []) if (variant.colourImage) urls.add(variant.colourImage);
  }
  return urls;
}

async function mapWithConcurrency(items, limit, worker) {
  const results = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await worker(items[index], index);
      }
    })
  );
  return results;
}

async function main() {
  await loadEnvLocal();

  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_DATA_BUCKET_NAME } = process.env;
  const publicUrl = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/$/, "");
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !publicUrl) {
    console.error("✗ R2 credentials and NEXT_PUBLIC_R2_PUBLIC_URL must be set (see .env.local.example).");
    process.exit(1);
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });

  // Live data first, unioned with the local copy so an image referenced in
  // either is covered. Read-only on both.
  const urls = new Set();
  if (R2_DATA_BUCKET_NAME) {
    try {
      // Same "data/" prefix lib/data-store.ts writes under.
      const res = await client.send(new GetObjectCommand({ Bucket: R2_DATA_BUCKET_NAME, Key: "data/products.json" }));
      const live = JSON.parse(await res.Body.transformToString());
      for (const url of collectImageUrls(live)) urls.add(url);
      console.log(`Read live products.json from R2 (${urls.size} distinct image URLs).`);
    } catch (err) {
      console.warn(`⚠️  Could not read live products.json from R2 (${err.name}), using the local copy only.`);
    }
  }
  const localRaw = JSON.parse(await fs.readFile(path.join(ROOT, "data", "products.json"), "utf8"));
  const before = urls.size;
  for (const url of collectImageUrls(localRaw)) urls.add(url);
  console.log(`Unioned with local data/products.json (+${urls.size - before} not present live) → ${urls.size} total.\n`);

  const candidates = [];
  for (const url of urls) {
    if (!url.startsWith(`${publicUrl}/`)) continue;
    const key = url.slice(publicUrl.length + 1);
    const thumb = thumbKey(key);
    if (thumb) candidates.push({ key, thumb });
  }

  const head = async (key) => {
    try {
      await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
      return true;
    } catch {
      return false;
    }
  };

  const state = await mapWithConcurrency(candidates, CONCURRENCY * 3, async (c) => ({
    source: await head(c.key),
    thumb: await head(c.thumb),
  }));

  // A referenced image that no longer exists in the bucket is the failure mode
  // CLAUDE.md calls #1: a dead URL sitting in data that nothing checks, usually
  // in a nested field like variants[].colourImage rather than images[], so it
  // is invisible until a customer picks that colour. Nothing else in the repo
  // verifies these actually resolve, only that their hostname is configured.
  const dead = candidates.filter((_, i) => !state[i].source);
  if (dead.length > 0) {
    console.error(`\n✗ ${dead.length} referenced product image(s) do not exist in R2:`);
    for (const d of dead) console.error(`   ${d.key}`);
    console.error("   Repoint the product/variant record at a real image (never re-upload to the same key).\n");
  }

  const missing = candidates.filter((_, i) => state[i].source && !state[i].thumb);
  console.log(`${candidates.length} product images, ${candidates.length - missing.length - dead.length} already have a thumb, ${missing.length} missing.`);

  if (missing.length === 0) {
    if (dead.length === 0) console.log("✓ Every product image exists and has a 400x400 thumbnail.");
    process.exit(dead.length > 0 ? 1 : 0);
  }

  if (DRY_RUN) {
    console.log("\nMissing thumbnails (dry run, nothing written):");
    for (const m of missing.slice(0, 20)) console.log(`   ${m.thumb}`);
    if (missing.length > 20) console.log(`   ... and ${missing.length - 20} more`);
    console.log("\nRun `npm run backfill:thumbs` to generate them.");
    process.exit(dead.length > 0 ? 1 : 0);
  }

  let done = 0;
  let failed = 0;
  let savedBytes = 0;

  await mapWithConcurrency(missing, CONCURRENCY, async (item) => {
    try {
      const res = await client.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: item.key }));
      const source = Buffer.from(await res.Body.transformToByteArray());

      // 400x400 cover, matching downloadAndProcessProductImageSet() in
      // lib/image-pipeline.ts so backfilled thumbs are framed identically to
      // pipeline-generated ones.
      const buffer = await sharp(source).resize(400, 400, { fit: "cover" }).webp({ quality: 80 }).toBuffer();

      // Re-check immediately before writing: the key was absent a moment ago,
      // and we must never overwrite an image key that exists.
      try {
        await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: item.thumb }));
        console.warn(`   skipped (appeared since the scan): ${item.thumb}`);
        return;
      } catch {
        // still absent, safe to write
      }

      await client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: item.thumb,
          Body: buffer,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        })
      );

      savedBytes += source.length - buffer.length;
      done++;
      if (done % 25 === 0) console.log(`   ${done}/${missing.length}...`);
    } catch (err) {
      failed++;
      console.error(`   ✗ ${item.key}: ${err.message}`);
    }
  });

  console.log(`\n✓ Generated ${done} thumbnail(s)${failed ? `, ${failed} failed` : ""}.`);
  console.log(`  ${(savedBytes / 1048576).toFixed(1)} MB less to download per full set of these images.`);
  if (dead.length > 0 || failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
