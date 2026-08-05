import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL, HAS_R2_CREDENTIALS } from "./r2-client";

/**
 * Storage backend for processed product/category/hero images, mirroring
 * lib/data-store.ts. Locally these are written under /public/uploads/ same as
 * before. On Vercel, /public is read-only at runtime, so once R2 credentials
 * are set uploads go to the public R2_BUCKET instead.
 *
 * Unlike lib/data-store.ts's bucket, R2_BUCKET has its public dev URL
 * enabled, so uploaded images are served directly from
 * NEXT_PUBLIC_R2_PUBLIC_URL, no proxy route needed. Never put anything
 * containing customer data in this bucket, use R2_DATA_BUCKET for that.
 */

const ON_VERCEL = !!process.env.VERCEL;
const USE_R2 = HAS_R2_CREDENTIALS;

console.log(`[image-store] mode=${USE_R2 ? "r2" : "local-fs"} onVercel=${ON_VERCEL}`);

const PUBLIC_DIR = path.join(process.cwd(), "public");

/** Uploads a processed image buffer under `pathname` (relative to /public, e.g. "uploads/product/abc123/main.webp"). Returns the public URL to store on the record. */
export async function uploadImageBuffer(
  pathname: string,
  buffer: Buffer,
  contentType = "image/webp"
): Promise<string> {
  if (USE_R2) {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: pathname,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return `${R2_PUBLIC_URL}/${pathname}`;
  }

  if (ON_VERCEL) {
    throw new Error(
      `Cannot upload "${pathname}": Vercel's filesystem is read-only and no R2 store is configured. ` +
        `Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and NEXT_PUBLIC_R2_PUBLIC_URL ` +
        `in the project's environment variables, then redeploy.`
    );
  }

  const destPath = path.join(PUBLIC_DIR, pathname);
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buffer);
  return `/${pathname}`;
}

/** Looks up whether an image already exists at `pathname` (admin-uploaded category/hero overrides). Returns a cache-bust-friendly URL if found, otherwise null. */
export async function findUploadedImage(pathname: string): Promise<string | null> {
  if (USE_R2) {
    try {
      const meta = await r2Client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: pathname }));
      const v = meta.LastModified ? meta.LastModified.getTime() : Date.now();
      return `${R2_PUBLIC_URL}/${pathname}?v=${v}`;
    } catch {
      return null;
    }
  }

  try {
    const stats = await fs.stat(path.join(PUBLIC_DIR, pathname));
    return `/${pathname}?v=${Math.floor(stats.mtimeMs)}`;
  } catch {
    return null;
  }
}
