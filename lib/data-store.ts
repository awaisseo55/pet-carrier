import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";
import { put, list } from "@vercel/blob";

/**
 * Storage backend for the /data/*.json files that lib/products.ts, lib/orders.ts
 * etc. read and write. On localhost this is just the file on disk, same as
 * before. On Vercel the filesystem outside /tmp is read-only at runtime, so
 * once BLOB_READ_WRITE_TOKEN is set (Vercel adds it automatically once a Blob
 * store is connected to the project) writes go to Vercel Blob instead, and
 * reads check Blob first, falling back to the file bundled in the deployment
 * as seed data until the first write creates the blob.
 */

const usingBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

const BLOB_PREFIX = "data/";

function localPath(filename: string): string {
  return path.join(process.cwd(), "data", filename);
}

async function readLocalFile<T>(filename: string): Promise<T> {
  const raw = await fs.readFile(localPath(filename), "utf-8");
  return JSON.parse(raw) as T;
}

async function findBlobUrl(filename: string): Promise<string | undefined> {
  const pathname = `${BLOB_PREFIX}${filename}`;
  const { blobs } = await list({ prefix: pathname, limit: 1 });
  return blobs.find((b) => b.pathname === pathname)?.url;
}

const readJsonFileUncached = async <T>(filename: string): Promise<T> => {
  if (usingBlob()) {
    const url = await findBlobUrl(filename);
    if (url) {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return (await res.json()) as T;
    }
    // No blob written yet for this file: seed from the copy bundled in the
    // deployment, the next write will create the blob.
  }
  return readLocalFile<T>(filename);
};

/** Memoized per-request (React `cache`) so multiple reads of the same file within one render don't refetch. */
export const readJsonFile = cache(readJsonFileUncached) as <T>(filename: string) => Promise<T>;

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  const body = JSON.stringify(data, null, 2);

  if (usingBlob()) {
    await put(`${BLOB_PREFIX}${filename}`, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  await fs.writeFile(localPath(filename), body, "utf-8");
}
