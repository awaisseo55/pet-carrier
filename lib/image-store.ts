import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { put, list } from "@vercel/blob";

/**
 * Storage backend for processed product/category/hero images, mirroring
 * lib/data-store.ts. Locally these are written under /public/uploads/ same as
 * before. On Vercel, /public is read-only at runtime, so once
 * BLOB_READ_WRITE_TOKEN is set uploads go to Vercel Blob instead and the
 * returned URL points at Blob's CDN rather than a local path.
 */

const usingBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const PUBLIC_DIR = path.join(process.cwd(), "public");

/** Uploads a processed image buffer under `pathname` (relative to /public, e.g. "uploads/product/abc123/main.webp"). Returns the public URL to store on the record. */
export async function uploadImageBuffer(
  pathname: string,
  buffer: Buffer,
  contentType = "image/webp"
): Promise<string> {
  if (usingBlob()) {
    const blob = await put(pathname, buffer, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
    });
    return blob.url;
  }

  const destPath = path.join(PUBLIC_DIR, pathname);
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buffer);
  return `/${pathname}`;
}

/** Looks up whether an image already exists at `pathname` (admin-uploaded category/hero overrides). Returns a cache-bust-friendly URL if found, otherwise null. */
export async function findUploadedImage(pathname: string): Promise<string | null> {
  if (usingBlob()) {
    const { blobs } = await list({ prefix: pathname, limit: 1 });
    const blob = blobs.find((b) => b.pathname === pathname);
    return blob ? `${blob.url}?v=${new Date(blob.uploadedAt).getTime()}` : null;
  }

  try {
    const stats = await fs.stat(path.join(PUBLIC_DIR, pathname));
    return `/${pathname}?v=${Math.floor(stats.mtimeMs)}`;
  } catch {
    return null;
  }
}
