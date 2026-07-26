import "server-only";
import * as cheerio from "cheerio";

export interface ScrapedAmazonProduct {
  asin: string;
  title: string;
  price: number | null;
  images: string[];
  bullets: string[];
  description: string;
  amazon_url: string;
}

export function extractAsin(url: string): string | null {
  const patterns = [/\/dp\/([A-Z0-9]{10})/i, /\/gp\/product\/([A-Z0-9]{10})/i, /[?&]asin=([A-Z0-9]{10})/i];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1].toUpperCase();
  }
  return null;
}

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/(\d+(\.\d{1,2})?)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Best-effort Amazon UK product scraper. Amazon actively blocks automated
 * requests, so this can fail even for valid URLs, hence the clear error
 * messages and the manual-entry fallback in the admin UI.
 */
export async function scrapeAmazonProduct(url: string): Promise<ScrapedAmazonProduct> {
  const asin = extractAsin(url);
  if (!asin) {
    throw new Error("That doesn't look like a valid Amazon product URL (couldn't find an ASIN).");
  }

  let html: string;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-GB,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Amazon returned a ${response.status} response.`);
    }
    html = await response.text();
  } catch (error) {
    console.error("Amazon fetch failed", error);
    throw new Error(
      "Could not reach that Amazon page. Amazon sometimes blocks automated requests, please try again shortly or enter the details manually."
    );
  }

  const $ = cheerio.load(html);

  const title = $("#productTitle").text().trim();

  const priceText =
    $(".a-price .a-offscreen").first().text().trim() ||
    $("#corePrice_feature_div .a-offscreen").first().text().trim() ||
    $("#priceblock_ourprice").first().text().trim();
  const price = priceText ? parsePrice(priceText) : null;

  const bullets: string[] = [];
  $("#feature-bullets li span.a-list-item").each((_, el) => {
    const text = $(el).text().trim();
    if (text && !/warranty|asin|customer reviews/i.test(text)) bullets.push(text);
  });

  let description = $("#productDescription").text().trim().replace(/\s+/g, " ");
  if (!description && bullets.length > 0) {
    description = bullets.join(" ");
  }

  const images = new Set<string>();
  const hiResMatches = html.matchAll(/"hiRes":"(https:[^"]+?)"/g);
  for (const match of hiResMatches) images.add(match[1]);

  if (images.size === 0) {
    const largeMatches = html.matchAll(/"large":"(https:[^"]+?)"/g);
    for (const match of largeMatches) images.add(match[1]);
  }

  const landingImage = $("#landingImage").attr("data-old-hires") || $("#landingImage").attr("src");
  if (landingImage) images.add(landingImage);

  if (images.size === 0) {
    $("#altImages img").each((_, el) => {
      const src = $(el).attr("src");
      if (src) images.add(src.replace(/\._[A-Z0-9,_]+_\./, "."));
    });
  }

  if (!title) {
    throw new Error(
      "Could not read product details from that page. Amazon sometimes blocks automated requests, please try again in a moment or enter the details manually."
    );
  }

  return {
    asin,
    title,
    price,
    images: Array.from(images).slice(0, 6),
    bullets,
    description,
    amazon_url: url,
  };
}

const FETCH_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function urlIsImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET", headers: { "User-Agent": FETCH_USER_AGENT } });
    if (!res.ok) return false;
    const type = res.headers.get("content-type") || "";
    if (!type.startsWith("image/")) return false;
    // Amazon returns a genuine (tiny, ~43 byte) placeholder GIF with a real
    // image/* content-type for ASINs that don't have a matching legacy
    // catalogue image, so content-type alone isn't enough, a real product
    // photo is always well over this size.
    const buffer = Buffer.from(await res.arrayBuffer());
    return buffer.length > 2048;
  } catch {
    return false;
  }
}

/**
 * Method 1: legacy Amazon image CDN paths that embed the ASIN directly
 * (images-na.ssl-images-amazon.com/images/P/{asin}.NN.*). Only works for a
 * minority of listings (mostly older catalogue entries), Amazon's modern
 * image hosting uses opaque hash IDs unrelated to the ASIN, so this is
 * genuinely best-effort and expected to fail for most products.
 */
export async function tryAsinImagePatterns(asin: string): Promise<string[]> {
  const candidates = [
    `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`,
    `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.MAIN._SCLZZZZZZZ_.jpg`,
    `https://m.media-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`,
  ];
  const found: string[] = [];
  for (const url of candidates) {
    if (await urlIsImage(url)) found.push(url);
  }
  return found;
}

export interface OpenGraphResult {
  title: string | null;
  description: string | null;
  image: string | null;
}

/** Method 2: read Open Graph meta tags off the product page, lighter-weight than full selector scraping and sometimes present even when Amazon serves a simplified/blocked page. */
export async function tryOpenGraphFetch(url: string): Promise<OpenGraphResult> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": FETCH_USER_AGENT,
      "Accept-Language": "en-GB,en;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Amazon returned a ${response.status} response.`);
  const html = await response.text();
  const $ = cheerio.load(html);

  return {
    title: $('meta[property="og:title"]').attr("content")?.trim() || null,
    description: $('meta[property="og:description"]').attr("content")?.trim() || null,
    image: $('meta[property="og:image"]').attr("content")?.trim() || null,
  };
}

export interface AmazonFetchAttempt {
  method: "asin-pattern" | "open-graph" | "scrape";
  success: boolean;
  error?: string;
}

export interface AmazonFetchResult {
  asin: string;
  attempts: AmazonFetchAttempt[];
  successfulMethod: AmazonFetchAttempt["method"] | null;
  product: ScrapedAmazonProduct | null;
}

/**
 * The full fallback chain documented in docs/PRODUCT-WORKFLOW.md: try
 * ASIN-based image URL guessing, then Open Graph tags, then full page
 * scraping. Returns every attempt made (for transparent reporting) plus the
 * best product data found, or null if all three methods failed.
 */
export async function fetchAmazonProductWithFallback(url: string): Promise<AmazonFetchResult> {
  const asin = extractAsin(url);
  if (!asin) {
    return {
      asin: "",
      attempts: [{ method: "scrape", success: false, error: "No ASIN found in URL" }],
      successfulMethod: null,
      product: null,
    };
  }

  const attempts: AmazonFetchAttempt[] = [];

  // Method 1
  try {
    const images = await tryAsinImagePatterns(asin);
    if (images.length > 0) {
      attempts.push({ method: "asin-pattern", success: true });
      return {
        asin,
        attempts,
        successfulMethod: "asin-pattern",
        product: { asin, title: "", price: null, images, bullets: [], description: "", amazon_url: url },
      };
    }
    attempts.push({ method: "asin-pattern", success: false, error: "No image responded at the guessed URLs" });
  } catch (error) {
    attempts.push({ method: "asin-pattern", success: false, error: (error as Error).message });
  }

  // Method 2
  try {
    const og = await tryOpenGraphFetch(url);
    if (og.image) {
      attempts.push({ method: "open-graph", success: true });
      return {
        asin,
        attempts,
        successfulMethod: "open-graph",
        product: {
          asin,
          title: og.title || "",
          price: null,
          images: [og.image],
          bullets: [],
          description: og.description || "",
          amazon_url: url,
        },
      };
    }
    attempts.push({ method: "open-graph", success: false, error: "No og:image tag found on the page" });
  } catch (error) {
    attempts.push({ method: "open-graph", success: false, error: (error as Error).message });
  }

  // Method 3
  try {
    const scraped = await scrapeAmazonProduct(url);
    if (scraped.images.length > 0) {
      attempts.push({ method: "scrape", success: true });
      return { asin, attempts, successfulMethod: "scrape", product: scraped };
    }
    attempts.push({ method: "scrape", success: false, error: "Page scraped but no images were found" });
  } catch (error) {
    attempts.push({ method: "scrape", success: false, error: (error as Error).message });
  }

  return { asin, attempts, successfulMethod: null, product: null };
}
