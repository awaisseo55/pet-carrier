import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_DATA_BUCKET, HAS_R2_CREDENTIALS } from "./r2-client";

/**
 * Storage backend for the /data/*.json files that lib/products.ts, lib/orders.ts
 * etc. read and write. On localhost (no R2 credentials set) this is just the
 * file on disk, same as before. In production, reads/writes go to the private
 * R2_DATA_BUCKET (no public access enabled), so customer emails, password
 * hashes and order details stay unreachable by URL. Public-facing images are
 * handled separately in lib/image-store.ts, in a different, public bucket.
 */

const ON_VERCEL = !!process.env.VERCEL;
const USE_R2 = HAS_R2_CREDENTIALS;

// Runs once per cold start, shows up in Vercel function logs so missing R2
// credentials in production are obvious instead of surfacing as a confusing
// "EROFS: read-only file system" error from a failed fs.writeFile.
console.log(`[data-store] mode=${USE_R2 ? "r2" : "local-fs"} onVercel=${ON_VERCEL}`);

const DATA_PREFIX = "data/";

function localPath(filename: string): string {
  return path.join(process.cwd(), "data", filename);
}

async function readLocalFile<T>(filename: string): Promise<T> {
  const raw = await fs.readFile(localPath(filename), "utf-8");
  return JSON.parse(raw) as T;
}

function isNoSuchKey(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    ("name" in error && (error as { name?: string }).name === "NoSuchKey")
  );
}

const readJsonFileUncached = async <T>(filename: string): Promise<T> => {
  if (USE_R2) {
    let neverWritten = false;
    try {
      const result = await r2Client.send(
        new GetObjectCommand({ Bucket: R2_DATA_BUCKET, Key: `${DATA_PREFIX}${filename}` })
      );
      const text = await result.Body?.transformToString("utf-8");
      if (text === undefined) {
        throw new Error(`Empty response body reading "${filename}" from R2`);
      }
      return JSON.parse(text) as T;
    } catch (error) {
      if (isNoSuchKey(error)) {
        // No object written yet for this file: seed from the copy bundled in
        // the deployment.
        neverWritten = true;
      } else {
        // Transient R2 API failure (not a "doesn't exist yet" signal): fall
        // back to the bundled copy for this read without touching R2, so a
        // network blip can't be mistaken for an empty store and overwrite
        // whatever's actually there.
        console.error(`[data-store] R2 read failed for "${filename}", falling back to local file`, error);
      }
    }

    const local = await readLocalFile<T>(filename);
    if (neverWritten) {
      // First-ever read of this file: persist the bundled seed data to R2 so
      // it becomes the durable source of truth immediately, rather than
      // silently re-reading the bundled copy (which only reflects whatever
      // was last committed to git) on every request until something else
      // writes this file first.
      r2Client
        .send(
          new PutObjectCommand({
            Bucket: R2_DATA_BUCKET,
            Key: `${DATA_PREFIX}${filename}`,
            Body: JSON.stringify(local, null, 2),
            ContentType: "application/json",
          })
        )
        .catch((error) => {
          console.error(`[data-store] Failed to auto-seed R2 for "${filename}"`, error);
        });
    }
    return local;
  }
  return readLocalFile<T>(filename);
};

/** Memoized per-request (React `cache`) so multiple reads of the same file within one render don't refetch. */
export const readJsonFile = cache(readJsonFileUncached) as <T>(filename: string) => Promise<T>;

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  const body = JSON.stringify(data, null, 2);

  if (USE_R2) {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_DATA_BUCKET,
        Key: `${DATA_PREFIX}${filename}`,
        Body: body,
        ContentType: "application/json",
      })
    );
    return;
  }

  if (ON_VERCEL) {
    throw new Error(
      `Cannot save "${filename}": Vercel's filesystem is read-only and no R2 store is configured. ` +
        `Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and R2_DATA_BUCKET_NAME ` +
        `in the project's environment variables, then redeploy.`
    );
  }

  await fs.writeFile(localPath(filename), body, "utf-8");
}
