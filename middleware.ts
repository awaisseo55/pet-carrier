import { NextResponse, type NextRequest } from "next/server";

/**
 * Returns a genuine HTTP 410 Gone for URLs intentionally removed in the
 * 2026-09 carrier-only architecture change (see CLAUDE.md "Category
 * architecture"): Beds and Strollers were dropped from the active site to
 * keep pet-carrier.co.uk a focused carrier specialist, and the 6 discontinued
 * bed product pages. 410 (not a redirect, not a plain 404) signals to search
 * engines that these were real, intentionally-removed pages rather than URLs
 * that never existed, which is the more accurate and faster-to-deindex
 * signal here since ~5 Bed category pages had already been indexed. Only
 * these specific, deliberately discontinued paths get this treatment, the
 * rest of the site is untouched.
 */

const GONE_BED_PRODUCT_SLUGS = [
  "washable-calming-dog-bed-crate-mattress",
  "washable-anti-anxiety-dog-bed-non-slip-base",
  "memory-foam-orthopaedic-dog-bed-waterproof-cover",
  "washable-calming-dog-crate-mattress",
  "washable-orthopaedic-dog-bed-sofa",
  "memory-foam-orthopaedic-dog-bed-medium-waterproof",
];

function isGonePath(pathname: string): boolean {
  if (pathname === "/beds" || pathname.startsWith("/beds/")) return true;
  if (pathname === "/strollers" || pathname.startsWith("/strollers/")) return true;
  const productSlug = pathname.match(/^\/product\/([^/]+)$/)?.[1];
  if (productSlug && GONE_BED_PRODUCT_SLUGS.includes(productSlug)) return true;
  return false;
}

const GONE_HTML = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8" />
<title>Page no longer available | Pet Carrier</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:80px auto;padding:0 24px;color:#111827;">
<h1 style="font-size:1.5rem;font-weight:600;">This page is no longer available</h1>
<p style="color:#6B7280;line-height:1.6;">Pet Carrier is a specialist pet carrier shop, and this page has been intentionally removed as part of that focus. It won't be coming back at this address.</p>
<p style="line-height:1.6;"><a href="/carriers" style="color:#2563EB;">Shop our full range of pet carriers</a> or <a href="/" style="color:#2563EB;">return to the homepage</a>.</p>
</body>
</html>`;

export function middleware(request: NextRequest) {
  if (isGonePath(request.nextUrl.pathname)) {
    return new NextResponse(GONE_HTML, {
      status: 410,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/beds", "/beds/:path*", "/strollers", "/strollers/:path*", "/product/:slug"],
};
