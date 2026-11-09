/**
 * Pure Temu URL helpers, shared by the admin import form (a "use client"
 * component) and app/api/admin/temu/fetch/route.ts. Deliberately has no
 * "server-only" marker and no server imports, see the lib/constants.ts note
 * in CLAUDE.md.
 *
 * Why there is no Temu scraper to go with this: Temu answers every
 * server-side request for a product page with an obfuscated JavaScript
 * anti-bot challenge (verified against www/m/bare hosts and against Googlebot
 * and Facebook crawler user agents, all return the same ~1.4KB challenge
 * page, no Open Graph tags). Defeating that is bot-detection bypass, so the
 * Temu import is paste-assisted instead: everything that can be read from the
 * URL is read here, and the admin supplies the price and gallery image URLs.
 * Temu's image CDN is open, so lib/image-pipeline.ts can download those
 * normally once they are allowlisted by isTemuImageUrl().
 */

const TEMU_HOSTS = new Set(["temu.com", "www.temu.com", "m.temu.com"]);

/** Temu serves product imagery from kwcdn.com hosts (img./aimg./static.). */
function isKwcdnHost(hostname: string): boolean {
  return hostname === "kwcdn.com" || hostname.endsWith(".kwcdn.com");
}

export interface ParsedTemuUrl {
  /** Temu's numeric goods ID, from the "-g-<digits>.html" suffix. Used as the product id/SKU the way an ASIN is for Amazon. */
  goodsId: string;
  /** Scheme + host + path only. Every query parameter is dropped: Temu URLs carry session ids (_x_sessn_id) and referral tracking we should not store on the product record. */
  canonicalUrl: string;
  /** The listing's keyword-stuffed slug as readable text. Useful context for the AI rewrite, not usable as a title on its own. */
  keywordText: string;
  /**
   * A last-resort title seed when the admin doesn't paste the real listing
   * title. Capped near a normal product-title length rather than carrying the
   * full keyword string: if the AI rewrite is unavailable this value is what
   * actually gets published, so it has to be usable on its own.
   */
  titleSeed: string;
  /** Main gallery image, present when the URL was copied from a Temu search or listing page (top_gallery_url param). */
  galleryImage: string | null;
}

/** True for an https URL on a Temu image CDN host. The import downloads these server-side, so the host allowlist matters, don't relax it to "any URL the admin pasted". */
export function isTemuImageUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return false;
  }
  return url.protocol === "https:" && (isKwcdnHost(url.hostname) || TEMU_HOSTS.has(url.hostname));
}

function titleCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Trims to at most `max` characters without cutting a word in half. */
function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
}

/**
 * Pulls everything usable out of a pasted Temu product URL. Returns null for
 * anything that isn't a Temu product page, so the caller can show a clear
 * error rather than importing a junk record.
 */
export function parseTemuUrl(raw: string): ParsedTemuUrl | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (!TEMU_HOSTS.has(url.hostname)) return null;

  const segment = url.pathname.split("/").filter(Boolean).pop() || "";
  const withoutExtension = segment.replace(/\.html?$/i, "");

  // Product pages end "...-g-<digits>"; some listing URLs instead carry goods_id.
  const idFromPath = withoutExtension.match(/-g-(\d{6,})$/);
  const goodsId = idFromPath ? idFromPath[1] : url.searchParams.get("goods_id");
  if (!goodsId || !/^\d{6,}$/.test(goodsId)) return null;

  const slug = idFromPath ? withoutExtension.slice(0, -idFromPath[0].length) : withoutExtension;
  const keywordText = slug.replace(/-+/g, " ").replace(/\s+/g, " ").trim();

  const galleryImage = url.searchParams.get("top_gallery_url");

  return {
    goodsId,
    canonicalUrl: `${url.origin}${url.pathname}`,
    keywordText,
    titleSeed: titleCase(truncateAtWord(keywordText, 70)),
    galleryImage: galleryImage && isTemuImageUrl(galleryImage) ? galleryImage : null,
  };
}
