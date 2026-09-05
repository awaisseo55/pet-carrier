#!/usr/bin/env node
/**
 * One-off fix: bulk-build.mjs derived short_description by grabbing the
 * first paragraph of the markdown description body. That paragraph often
 * contains a [text](/link), which renders literally as raw brackets since
 * short_description is shown as plain text on the product page, not run
 * through the markdown renderer. Patches all 10 products with the real
 * hand-written shortDescription now added to bulk-content.mjs.
 */
import { promises as fs } from "fs";
import path from "path";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { PRODUCTS } from "./bulk-content.mjs";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});
const R2_DATA_BUCKET = process.env.R2_DATA_BUCKET_NAME;

const res = await r2.send(new GetObjectCommand({ Bucket: R2_DATA_BUCKET, Key: "data/products.json" }));
const text = await res.Body.transformToString("utf-8");
const products = JSON.parse(text);
const byId = new Map(products.map((p) => [p.id, p]));

for (const content of PRODUCTS) {
  const product = byId.get(content.asin);
  if (!product) continue;
  console.log(`Fixing short_description for ${content.asin} (${product.title})`);
  console.log(`  old: ${product.short_description.slice(0, 80)}...`);
  product.short_description = content.shortDescription;
  console.log(`  new: ${product.short_description.slice(0, 80)}...`);
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
