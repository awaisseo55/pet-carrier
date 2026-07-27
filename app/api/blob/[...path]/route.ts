import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

/**
 * Public proxy for images stored in the (private) Vercel Blob store: fetches
 * them server-side with BLOB_READ_WRITE_TOKEN and streams the content back,
 * so product/category/hero images can still be shown to every site visitor
 * without exposing the store's contents at large.
 *
 * Only ever serves "uploads/" paths. data/*.json (customer emails, password
 * hashes, order details) lives in the same store and must never be
 * reachable through this route, see lib/data-store.ts.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathname = path.join("/");

  if (!pathname.startsWith("uploads/")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "Cache-Control": "public, max-age=60",
    },
  });
}
