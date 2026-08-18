#!/usr/bin/env node
/**
 * Pre-push safeguard: cross-checks every image URL hostname referenced in
 * data/products.json against next.config.ts's images.remotePatterns, and
 * flags if the configured R2 public URL is still on Cloudflare's *.r2.dev
 * dev subdomain, which is rate-limited and explicitly not meant for
 * production traffic (see NEXT_PUBLIC_R2_PUBLIC_URL in .env.local /
 * next.config.ts). A rate-limited origin is the leading suspect for product
 * images that render fine via a plain <img> (e.g. the lightbox) but fail
 * through next/image's server-side optimiser, which re-fetches every
 * srcset width from the origin.
 *
 * Usage: npm run check:images
 */
import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();

async function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  try {
    const text = await fs.readFile(envPath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // no .env.local, fine in CI where env vars are set directly
  }
}

async function main() {
  await loadEnvLocal();

  const staticHostnames = ["images.unsplash.com", "m.media-amazon.com", "images-na.ssl-images-amazon.com"];
  const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  const r2Hostname = r2PublicUrl ? new URL(r2PublicUrl).hostname : undefined;
  const configuredHostnames = new Set([...staticHostnames, ...(r2Hostname ? [r2Hostname] : [])]);

  const productsPath = path.join(ROOT, "data", "products.json");
  const raw = JSON.parse(await fs.readFile(productsPath, "utf8"));
  const products = Array.isArray(raw) ? raw : raw.products;

  const seenHostnames = new Map(); // hostname -> [{id, title, url}]
  for (const product of products) {
    const urls = [...(product.images || []), ...(product.variants || []).flatMap((v) => (v.colourImage ? [v.colourImage] : []))];
    for (const url of urls) {
      let hostname;
      try {
        hostname = new URL(url).hostname;
      } catch {
        console.warn(`⚠️  Product ${product.id} (${product.title}) has an unparsable image URL: ${url}`);
        continue;
      }
      if (!seenHostnames.has(hostname)) seenHostnames.set(hostname, []);
      const bucket = seenHostnames.get(hostname);
      if (bucket.length < 3) bucket.push({ id: product.id, title: product.title, url });
    }
  }

  let hasError = false;

  for (const [hostname, examples] of seenHostnames) {
    if (!configuredHostnames.has(hostname)) {
      hasError = true;
      console.error(`✗ Hostname "${hostname}" is used by product images but missing from next.config.ts remotePatterns.`);
      for (const ex of examples) console.error(`   e.g. ${ex.id} (${ex.title}): ${ex.url}`);
    }
  }

  if (r2Hostname && r2Hostname.endsWith(".r2.dev")) {
    console.warn(
      `⚠️  NEXT_PUBLIC_R2_PUBLIC_URL ("${r2PublicUrl}") is Cloudflare's free public dev subdomain, which is ` +
        `rate-limited and documented by Cloudflare as unsuitable for production traffic. next/image's server-side ` +
        `optimiser fetches every srcset width from this origin, so sustained traffic can trip the rate limit and ` +
        `render product images broken while raw <img> tags (e.g. the lightbox) keep working. Attach a custom ` +
        `domain to the R2 bucket in the Cloudflare dashboard and point NEXT_PUBLIC_R2_PUBLIC_URL at it before relying ` +
        `on this for real production traffic.`
    );
  }

  if (!r2Hostname) {
    console.warn("⚠️  NEXT_PUBLIC_R2_PUBLIC_URL is not set, could not verify the R2 hostname.");
  }

  if (hasError) {
    console.error(`\n${seenHostnames.size} unique hostname(s) checked, mismatches found above.`);
    process.exit(1);
  }

  console.log(`✓ All ${seenHostnames.size} unique image hostname(s) across ${products.length} products are configured in next.config.ts.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
