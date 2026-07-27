import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";
import { put, get } from "@vercel/blob";

/**
 * Storage backend for the /data/*.json files that lib/products.ts, lib/orders.ts
 * etc. read and write. On localhost this is just the file on disk, same as
 * before. On Vercel the filesystem outside /tmp is read-only at runtime, so
 * once BLOB_READ_WRITE_TOKEN is set (Vercel adds it automatically once a Blob
 * store is connected to the project) writes go to Vercel Blob instead, and
 * reads check Blob first, falling back to the file bundled in the deployment
 * as seed data until the first write creates the blob.
 *
 * The Blob store backing this project is private (access can't be changed to
 * public after creation), which is the correct setting anyway: these files
 * hold customer emails, password hashes and order details and must never be
 * fetchable by URL. Reads/writes use `get`/`put` with `access: "private"`,
 * which authenticates via BLOB_READ_WRITE_TOKEN. Public-facing images are
 * handled separately in lib/image-store.ts via a proxy route.
 */

const ON_VERCEL = !!process.env.VERCEL;
const HAS_BLOB_TOKEN = !!process.env.BLOB_READ_WRITE_TOKEN;
const USE_BLOB = HAS_BLOB_TOKEN;

// Runs once per cold start, shows up in Vercel function logs so a missing
// BLOB_READ_WRITE_TOKEN in production is obvious instead of surfacing as a
// confusing "EROFS: read-only file system" error from a failed fs.writeFile.
console.log(
  `[data-store] mode=${USE_BLOB ? "blob" : "local-fs"} onVercel=${ON_VERCEL} hasBlobToken=${HAS_BLOB_TOKEN}`
);

const BLOB_PREFIX = "data/";

function localPath(filename: string): string {
  return path.join(process.cwd(), "data", filename);
}

async function readLocalFile<T>(filename: string): Promise<T> {
  const raw = await fs.readFile(localPath(filename), "utf-8");
  return JSON.parse(raw) as T;
}

const readJsonFileUncached = async <T>(filename: string): Promise<T> => {
  if (USE_BLOB) {
    const result = await get(`${BLOB_PREFIX}${filename}`, { access: "private", useCache: false });
    if (result && result.statusCode === 200) {
      const text = await new Response(result.stream).text();
      return JSON.parse(text) as T;
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

  if (USE_BLOB) {
    await put(`${BLOB_PREFIX}${filename}`, body, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  if (ON_VERCEL) {
    throw new Error(
      `Cannot save "${filename}": Vercel's filesystem is read-only and no Blob store is configured. ` +
        `Add a Blob store (Storage tab -> Create Database -> Blob) and connect it to this project so ` +
        `BLOB_READ_WRITE_TOKEN is set, then redeploy.`
    );
  }

  await fs.writeFile(localPath(filename), body, "utf-8");
}
