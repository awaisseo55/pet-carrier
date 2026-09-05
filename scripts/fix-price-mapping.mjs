#!/usr/bin/env node
/**
 * One-off fix: bulk-content.mjs originally had a mapping error where
 * B09YNBL3QR (Jaspuriea) and B08NC88YD7 (Bedsure) had swapped/wrong prices.
 * Patches only the .price field on the product and every variant, reading
 * the current live object first, per CLAUDE.md's "never wholesale overwrite"
 * rule.
 */
import { promises as fs } from "fs";
import path from "path";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});
const R2_DATA_BUCKET = process.env.R2_DATA_BUCKET_NAME;

const FIXES = {
  B09YNBL3QR: 33.99,
  B08NC88YD7: 64.99,
};

const res = await r2.send(new GetObjectCommand({ Bucket: R2_DATA_BUCKET, Key: "data/products.json" }));
const text = await res.Body.transformToString("utf-8");
const products = JSON.parse(text);

for (const p of products) {
  if (FIXES[p.id] !== undefined) {
    const newPrice = FIXES[p.id];
    console.log(`Fixing ${p.id} (${p.title}): price ${p.price} -> ${newPrice}`);
    p.price = newPrice;
    if (p.variants) {
      for (const v of p.variants) v.price = newPrice;
    }
  }
}

await r2.send(
  new PutObjectCommand({
    Bucket: R2_DATA_BUCKET,
    Key: "data/products.json",
    Body: JSON.stringify(products, null, 2),
    ContentType: "application/json",
  })
);
console.log("Wrote patched products.json to R2.");

await fs.writeFile(
  path.join(process.cwd(), "data", "products.json"),
  JSON.stringify(products, null, 2) + "\n",
  "utf-8"
);
console.log("Wrote patched products.json to local data/products.json.");
