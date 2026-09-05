#!/usr/bin/env node
/**
 * Stage B of the bulk product import: merge scripts/.bulk-research/*.json
 * (Stage A's scraped data) with scripts/bulk-content.mjs (hand-written
 * copy), download and upload every gallery/colour image to the R2 public
 * image bucket, build full Product records, and write them to R2's private
 * data bucket via a read-current -> merge -> write cycle (never a wholesale
 * overwrite of live data), plus mirror the result to the local git-tracked
 * data/products.json.
 *
 * Run with: node --env-file=.env.local scripts/bulk-build.mjs
 */
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { PRODUCTS, hexForColour } from "./bulk-content.mjs";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET_NAME;
const R2_DATA_BUCKET = process.env.R2_DATA_BUCKET_NAME;
const R2_PUBLIC_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/$/, "");

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_DATA_BUCKET || !R2_PUBLIC_URL) {
  console.error("Missing R2 env vars. Run with: node --env-file=.env.local scripts/bulk-build.mjs");
  process.exit(1);
}
if (R2_PUBLIC_URL.includes(".r2.dev")) {
  // Hard rule from CLAUDE.md: never point production image URLs at the rate-limited dev subdomain.
  console.error(`Refusing to run: NEXT_PUBLIC_R2_PUBLIC_URL is a .r2.dev dev URL (${R2_PUBLIC_URL}), not the custom domain.`);
  process.exit(1);
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const RESEARCH_DIR = path.join(process.cwd(), "scripts", ".bulk-research");
const LOCAL_PRODUCTS_PATH = path.join(process.cwd(), "data", "products.json");

function slugifyColour(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uploadBuffer(key, buffer) {
  await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: buffer, ContentType: "image/webp" }));
  return `${R2_PUBLIC_URL}/${key}`;
}

async function downloadAndUploadSet(sourceUrl, keyPrefix) {
  const res = await fetch(sourceUrl, {
    headers: { "User-Agent": UA, Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${sourceUrl}`);
  const buf = Buffer.from(await res.arrayBuffer());

  const main = await sharp(buf).resize(1200, 1200, { fit: "cover" }).webp({ quality: 85 }).toBuffer();
  const thumb = await sharp(buf).resize(400, 400, { fit: "cover" }).webp({ quality: 80 }).toBuffer();
  const zoom = await sharp(buf)
    .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer();

  const mainUrl = await uploadBuffer(`${keyPrefix}-main.webp`, main);
  await uploadBuffer(`${keyPrefix}-thumb.webp`, thumb);
  await uploadBuffer(`${keyPrefix}-zoom.webp`, zoom);
  return mainUrl;
}

async function readLiveProducts() {
  try {
    const result = await r2.send(new GetObjectCommand({ Bucket: R2_DATA_BUCKET, Key: "data/products.json" }));
    const text = await result.Body.transformToString("utf-8");
    return JSON.parse(text);
  } catch (err) {
    console.error("Could not read live products.json from R2:", err.message);
    throw err;
  }
}

async function writeLiveProducts(products) {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_DATA_BUCKET,
      Key: "data/products.json",
      Body: JSON.stringify(products, null, 2),
      ContentType: "application/json",
    })
  );
}

function buildVariants(research, content, colourImageByName) {
  const matrix = (research.matrix || []).filter((entry) => {
    const values = entry.values || [];
    return !values.some((v) => /pack of/i.test(v));
  });
  if (matrix.length === 0) return { hasVariants: false, variantType: undefined, variants: undefined };

  const hasColour = research.colourSwatches.length > 0;
  const hasSize = research.sizeSwatches.length > 0;
  const variantType = hasColour && hasSize ? "size-colour" : hasColour ? "colour" : "size";

  // Amazon's dimensionValuesDisplayData value order isn't fixed: some
  // listings emit [colour, sizeLabel], others [sizeLabel, colour]. Classify
  // by shape instead of position: a dimension string always has digits
  // followed by "cm", a colour name never does.
  const isDimensionText = (v) => /\d+\s*(x|×)\s*\d+.*cm/i.test(v || "");

  const variants = matrix.map((entry) => {
    const values = entry.values || [];
    let colour, sizeLabel;
    if (variantType === "size-colour") {
      const dim = values.find(isDimensionText);
      const other = values.find((v) => v !== dim);
      sizeLabel = dim;
      colour = other;
    } else if (variantType === "colour") {
      [colour] = values;
    } else {
      [sizeLabel] = values;
    }

    const variant = {
      id: entry.asin,
      type: variantType,
      price: content.finalPrice,
      sku: `PC-${entry.asin}`,
      amazonUrl: `https://www.amazon.co.uk/dp/${entry.asin}`,
      inStock: true,
    };
    if (colour) {
      variant.colour = colour;
      const hex = hexForColour(colour);
      if (hex) variant.colourHex = hex;
      const img = colourImageByName.get(colour.toLowerCase().trim());
      if (img) variant.colourImage = img;
    }
    if (sizeLabel) {
      // Store the raw dimension text for now; a size-code prefix ("S", "M", ...)
      // is assigned below once every distinct size for this product is known,
      // since the product page's spec table expects `size` to be a real
      // prefix of `sizeLabel` (e.g. "M (43x32x30cm)"), and these Amazon
      // listings don't expose a short code of their own to reuse.
      variant.sizeLabel = sizeLabel.replace(/\s*\(L x W x H\)\s*$/i, "").trim();
    }
    return variant;
  });

  const TIERS = ["S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL"];
  const footprint = (dim) => {
    const nums = dim.match(/[\d.]+/g);
    return nums && nums.length >= 2 ? parseFloat(nums[0]) * parseFloat(nums[1]) : 0;
  };
  const distinctDims = Array.from(new Set(variants.map((v) => v.sizeLabel).filter(Boolean))).sort(
    (a, b) => footprint(a) - footprint(b)
  );
  const tierByDim = new Map(distinctDims.map((dim, i) => [dim, TIERS[i] || `T${i + 1}`]));
  for (const v of variants) {
    if (!v.sizeLabel) continue;
    const tier = tierByDim.get(v.sizeLabel);
    v.size = tier;
    v.sizeLabel = `${tier} (${v.sizeLabel})`;
  }

  return { hasVariants: true, variantType, variants };
}

async function buildProduct(content) {
  const researchPath = path.join(RESEARCH_DIR, `${content.asin}.json`);
  const research = JSON.parse(await fs.readFile(researchPath, "utf-8"));

  console.log(`\n--- Building ${content.asin}: ${content.title} ---`);

  // Gallery images.
  const images = [];
  for (let i = 0; i < research.images.length; i++) {
    try {
      const url = await downloadAndUploadSet(research.images[i], `uploads/product/${content.asin}/image-${i}`);
      images.push(url);
      console.log(`  gallery image ${i}: OK`);
    } catch (err) {
      console.log(`  gallery image ${i}: FAILED (${err.message})`);
    }
  }

  // One image per distinct colour, reused across every size of that colour.
  const colourImageByName = new Map();
  for (const swatch of research.colourSwatches) {
    if (!swatch.image) continue;
    try {
      const url = await downloadAndUploadSet(
        swatch.image,
        `uploads/product/${content.asin}/colour-${slugifyColour(swatch.label)}`
      );
      colourImageByName.set(swatch.label.toLowerCase().trim(), url);
      console.log(`  colour image "${swatch.label}": OK`);
    } catch (err) {
      console.log(`  colour image "${swatch.label}": FAILED (${err.message})`);
    }
  }

  const { hasVariants, variantType, variants } = buildVariants(research, content, colourImageByName);

  const now = new Date().toISOString();

  const product = {
    id: content.asin,
    slug: content.slug,
    title: content.title,
    description: content.description,
    // short_description is rendered as plain text on the product page, not
    // through the markdown renderer, so it must never contain [text](/link)
    // syntax the way the full description body does.
    short_description: content.shortDescription || content.title,
    features: content.features,
    specifications: content.specifications,
    price: content.finalPrice,
    compare_at_price: null,
    sku: `PC-${content.asin}`,
    stock_status: "in_stock",
    images: images.length > 0 ? images : [],
    category_slugs: content.category_slugs,
    size_range: "",
    weight_capacity: "",
    brand: content.brand,
    amazon_asin: content.asin,
    amazon_url: research.finalUrl || content.sourceUrl,
    is_active: images.length > 0,
    is_featured: false,
    created_at: now,
    updated_at: now,
    markup_percentage: 40,
    meta_title: content.metaTitle,
    meta_description: content.metaDescription,
    faqs: content.faqs,
  };
  if (hasVariants) {
    product.hasVariants = true;
    product.variantType = variantType;
    product.variants = variants;
  }

  if (images.length === 0) {
    console.log(`  WARNING: no images uploaded, marking is_active: false`);
  }

  return product;
}

const results = [];
const built = [];

for (const content of PRODUCTS) {
  try {
    const product = await buildProduct(content);
    built.push(product);
    results.push({
      asin: content.asin,
      slug: content.slug,
      title: content.title,
      colours: product.variants ? new Set(product.variants.map((v) => v.colour).filter(Boolean)).size : 0,
      sizes: product.variants ? new Set(product.variants.map((v) => v.sizeLabel).filter(Boolean)).size : 0,
      totalVariants: product.variants ? product.variants.length : 0,
      price: product.price,
      images: product.images.length,
      status: product.is_active ? "OK" : "NEEDS IMAGES",
    });
  } catch (err) {
    console.error(`FAILED to build ${content.asin}: ${err.message}`);
    results.push({ asin: content.asin, slug: content.slug, title: content.title, status: `FAILED: ${err.message}` });
  }
}

console.log("\n\nReading live products.json from R2...");
const liveProducts = await readLiveProducts();
console.log(`Live product count before merge: ${liveProducts.length}`);

const byId = new Map(liveProducts.map((p) => [p.id, p]));
for (const p of built) byId.set(p.id, p);
const merged = Array.from(byId.values());

console.log(`Live product count after merge: ${merged.length}`);
await writeLiveProducts(merged);
console.log("Wrote merged products.json to R2.");

await fs.writeFile(LOCAL_PRODUCTS_PATH, JSON.stringify(merged, null, 2) + "\n", "utf-8");
console.log("Wrote merged products.json to local data/products.json.");

console.log("\n=== BUILD SUMMARY ===");
console.table(results);
await fs.writeFile(path.join(RESEARCH_DIR, "_build_summary.json"), JSON.stringify(results, null, 2));
