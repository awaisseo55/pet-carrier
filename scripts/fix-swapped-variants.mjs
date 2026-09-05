#!/usr/bin/env node
/**
 * One-off fix: bulk-build.mjs assumed dimensionValuesDisplayData's `values`
 * array was always [colour, sizeLabel], but Amazon's actual order varies
 * per listing. For B0BYMN7SLY and B09YNBL3QR it was [sizeLabel, colour]
 * reversed, so their variants ended up with colour names in sizeLabel and
 * dimension strings in colour. Rebuilds their variants correctly using the
 * now-fixed shape-based classification (a dimension string always has
 * digits followed by "cm"), reusing the colour images already uploaded to
 * R2 in the first pass (same deterministic key pattern, no re-download).
 */
import { promises as fs } from "fs";
import path from "path";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { PRODUCTS, hexForColour } from "./bulk-content.mjs";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});
const R2_DATA_BUCKET = process.env.R2_DATA_BUCKET_NAME;
const R2_PUBLIC_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/$/, "");

const RESEARCH_DIR = path.join(process.cwd(), "scripts", ".bulk-research");
const TARGET_ASINS = ["B0BYMN7SLY", "B09YNBL3QR"];

function slugifyColour(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const isDimensionText = (v) => /\d+\s*(x|×)\s*\d+.*cm/i.test(v || "");

function buildVariants(research, content) {
  const matrix = (research.matrix || []).filter((entry) => {
    const values = entry.values || [];
    return !values.some((v) => /pack of/i.test(v));
  });

  const colourImageByName = new Map();
  for (const swatch of research.colourSwatches) {
    if (!swatch.image) continue;
    const url = `${R2_PUBLIC_URL}/uploads/product/${content.asin}/colour-${slugifyColour(swatch.label)}-main.webp`;
    colourImageByName.set(swatch.label.toLowerCase().trim(), url);
  }

  const variants = matrix.map((entry) => {
    const values = entry.values || [];
    const dim = values.find(isDimensionText);
    const colour = values.find((v) => v !== dim);

    const variant = {
      id: entry.asin,
      type: "size-colour",
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
    if (dim) {
      variant.sizeLabel = dim.replace(/\s*\(L x W x H\)\s*$/i, "").trim();
    }
    return variant;
  });

  const TIERS = ["S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL"];
  const footprint = (d) => {
    const nums = d.match(/[\d.]+/g);
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

  return variants;
}

const res = await r2.send(new GetObjectCommand({ Bucket: R2_DATA_BUCKET, Key: "data/products.json" }));
const text = await res.Body.transformToString("utf-8");
const products = JSON.parse(text);
const byId = new Map(products.map((p) => [p.id, p]));

for (const asin of TARGET_ASINS) {
  const content = PRODUCTS.find((p) => p.asin === asin);
  const research = JSON.parse(await fs.readFile(path.join(RESEARCH_DIR, `${asin}.json`), "utf-8"));
  const product = byId.get(asin);
  if (!product) {
    console.error(`${asin} not found in live products, skipping`);
    continue;
  }
  const variants = buildVariants(research, content);
  product.variants = variants;
  console.log(`Fixed ${asin} (${product.title}): ${variants.length} variants`);
  console.log("  sample:", variants.slice(0, 3).map((v) => `${v.colour} / ${v.sizeLabel}`).join(" | "));
  const missingImages = variants.filter((v) => !v.colourImage).length;
  if (missingImages) console.log(`  WARNING: ${missingImages} variants missing colourImage`);
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
