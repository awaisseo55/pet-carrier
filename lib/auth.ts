import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// TODO: set SESSION_SECRET to a long random string in .env.local before going live.
const SECRET = process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me";

export function signValue(value: string): string {
  const signature = createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${signature}`;
}

export function verifySignedValue(signed: string | undefined | null): string | null {
  if (!signed) return null;
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;

  const value = signed.slice(0, lastDot);
  const signature = signed.slice(lastDot + 1);
  const expected = createHmac("sha256", SECRET).update(value).digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  return value;
}
