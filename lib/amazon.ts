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
