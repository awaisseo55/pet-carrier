/**
 * Picking the right stored size for a product image.
 *
 * lib/image-pipeline.ts writes three sizes of every product photo to R2:
 * `<name>-main.webp` (1200x1200), `<name>-thumb.webp` (400x400) and
 * `<name>-zoom.webp` (longest side capped at 2000px). Only the main URL is
 * stored on `Product.images`, so until this helper existed every listing grid
 * pointed its ~300px tiles at the 1200px file.
 *
 * That is what made product images intermittently break: a category page like
 * /carriers/dog-carriers renders 86 cards (two photos each) and was shipping
 * ~26 MB of images over ~170 requests to a single host. Everything returned
 * 200 when measured one request at a time, but on a real connection that
 * volume stalls, and when the browser's connection to the image host gives up
 * every in-flight image on the page fails at once, which is exactly the
 * "all product images broken, page itself fine" symptom. The same images at
 * thumbnail size are ~16 KB each instead of ~115 KB.
 *
 * These are pure string helpers with no server-only dependency on purpose:
 * components/shop/product-card.tsx is a client component.
 *
 * Callers must treat the returned URL as a *preferred* source, not a
 * guaranteed one, and fall back to the original on error. Not every image in
 * the catalogue was written by the pipeline (older imports used
 * `gallery-N.webp` names with no thumb sibling), so a derived thumb URL can
 * 404. scripts/backfill-image-thumbs.mjs generates the missing ones and
 * `npm run check:thumbs` reports any that are still absent.
 */

const R2_PUBLIC_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/$/, "");

/** True for images we host on R2 ourselves, the only ones with known sibling sizes. */
function isOwnImage(url: string): boolean {
  return !!R2_PUBLIC_URL && url.startsWith(`${R2_PUBLIC_URL}/`) && url.endsWith(".webp");
}

/**
 * The 400x400 variant of a stored product image, for listing grids, cart rows
 * and any other tile rendered well under 400px. Returns the URL unchanged when
 * there is no known smaller variant (placeholders, non-R2 URLs, and the zoom
 * size, which is requested deliberately).
 */
export function thumbnailUrl(url: string): string {
  if (!isOwnImage(url)) return url;
  if (url.endsWith("-thumb.webp") || url.endsWith("-zoom.webp")) return url;
  if (url.endsWith("-main.webp")) return url.replace(/-main\.webp$/, "-thumb.webp");
  return url.replace(/\.webp$/, "-thumb.webp");
}
