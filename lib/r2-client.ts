import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 (S3-compatible) client, shared by lib/data-store.ts and
 * lib/image-store.ts. Two buckets on the same account:
 *  - R2_DATA_BUCKET (private, no public access): the /data/*.json files,
 *    read/written only via authenticated PutObjectCommand/GetObjectCommand.
 *    Never expose this bucket's public dev URL, it holds customer emails,
 *    password hashes and order details.
 *  - R2_BUCKET (public dev URL enabled): processed product/category/hero
 *    images, served directly via NEXT_PUBLIC_R2_PUBLIC_URL.
 */

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

export const R2_BUCKET = process.env.R2_BUCKET_NAME || "";
export const R2_DATA_BUCKET = process.env.R2_DATA_BUCKET_NAME || "";
export const R2_PUBLIC_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/$/, "");

export const HAS_R2_CREDENTIALS = !!(
  R2_ACCOUNT_ID &&
  R2_ACCESS_KEY_ID &&
  R2_SECRET_ACCESS_KEY &&
  R2_BUCKET &&
  R2_DATA_BUCKET
);

if (!HAS_R2_CREDENTIALS && process.env.VERCEL) {
  console.warn("[r2-client] Missing R2 credentials in a Vercel environment — storage operations will fail");
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || "",
    secretAccessKey: R2_SECRET_ACCESS_KEY || "",
  },
});
