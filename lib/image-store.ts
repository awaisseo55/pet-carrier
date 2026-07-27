import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { put, head } from "@vercel/blob";

/**
 * Storage backend for processed product/category/hero images, mirroring
 * lib/data-store.ts. Locally these are written under /public/uploads/ same as
 * before. On Vercel, /public is read-only at runtime, so once
 * BLOB_READ_WRITE_TOKEN is set uploads go to Vercel Blob instead.
 *
 * The Blob store is private (can't be changed to public after creation), so
 * uploaded images aren't fetchable by their raw Blob URL. Instead this
 * returns a URL under our own /api/blob/[...path] proxy route, which
 * authenticates to Blob server-side and streams the image back publicly.
 * That route only ever serves "uploads/" paths, never "data/" (see
 * lib/data-store.ts), so product/category/hero images are public exactly
 * like before, while the JSON data files stay private.
 */

const ON_VERCEL = !!process.env.VERCEL;
const HAS_BLOB_TOKEN = !!process.env.BLOB_READ_WRITE_TOKEN;
const USE_BLOB = HAS_BLOB_TOKEN;

console.log(
  `[image-store] mode=${USE_BLOB ? "blob" : "local-fs"} onVercel=${ON_VERCEL} hasBlobToken=${HAS_BLOB_TOKEN}`
);

const PUBLIC_DIR = path.join(process.cwd(), "public");

/** Uploads a processed image buffer under `pathname` (relative to /public, e.g. "uploads/product/abc123/main.webp"). Returns the public URL to store on the record. */
export async function uploadImageBuffer(
  pathname: string,
  buffer: Buffer,
  contentType = "image/webp"
): Promise<string> {
  if (USE_BLOB) {
    await put(pathname, buffer, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
    });
    return `/api/blob/${pathname}`;
  }

  if (ON_VERCEL) {
    throw new Error(
      `Cannot upload "${pathname}": Vercel's filesystem is read-only and no Blob store is configured. ` +
        `Add a Blob store (Storage tab -> Create Database -> Blob) and connect it to this project so ` +
        `BLOB_READ_WRITE_TOKEN is set, then redeploy.`
    );
  }

  const destPath = path.join(PUBLIC_DIR, pathname);
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buffer);
  return `/${pathname}`;
}

/** Looks up whether an image already exists at `pathname` (admin-uploaded category/hero overrides). Returns a cache-bust-friendly URL if found, otherwise null. */
export async function findUploadedImage(pathname: string): Promise<string | null> {
  if (USE_BLOB) {
    try {
      const meta = await head(pathname);
      return `/api/blob/${pathname}?v=${new Date(meta.uploadedAt).getTime()}`;
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
