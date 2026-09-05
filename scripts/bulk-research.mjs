#!/usr/bin/env node
/**
 * Stage A of the bulk product import: resolve each amzn.to link, fetch the
 * real Amazon page, and extract raw data (title, brand, bullets, images,
 * colour/size variant matrix) without touching R2 or writing any product
 * content yet. Dumps one JSON file per product to scripts/.bulk-research/
 * so results can be sanity-checked before Stage B (image upload + content
 * generation + R2 write) runs on them.
 *
 * Amazon's modern "inline twister" markup exposes variants via:
 *  - #inline-twister-expander-content-{color_name|size_name}: the swatch
 *    list for ONE dimension at the CURRENTLY selected value of the other
 *    dimension (li[data-asin] with either an <img alt="Colour"> swatch or a
 *    .swatch-title-text-display text label).
 *  - dimensionValuesDisplayData (a JS object literal, not strict JSON):
 *    the FULL matrix, every sibling ASIN mapped to its exact
 *    [colour, sizeLabel] pair. This is the authoritative source used to
 *    build the variants array; the twister lists above are only used to
 *    recover colour swatch image URLs.
 */
import * as cheerio from "cheerio";
import { promises as fs } from "fs";
import path from "path";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const URLS = [
  { url: "https://amzn.to/4r4o7Pm", finalPrice: 63.99 },
  { url: "https://amzn.to/4xdLO9l", finalPrice: 57.99 },
  { url: "https://amzn.to/4yhlsUB", finalPrice: 57.76 },
  { url: "https://amzn.to/4iP8UiN", finalPrice: 106.99 },
  { url: "https://amzn.to/4gPOFii", finalPrice: 82.99 },
  { url: "https://amzn.to/4x71xqE", finalPrice: 35.99 },
  { url: "https://amzn.to/4A4q5Dt", finalPrice: 38.99 },
  { url: "https://amzn.to/4ydktVq", finalPrice: 48.56 },
  { url: "https://amzn.to/4ymE8ma", finalPrice: 33.99 },
  { url: "https://amzn.to/4ykG66i", finalPrice: 64.99 },
  { url: "https://amzn.to/4zYwm3c", finalPrice: 47.99 },
];

const OUT_DIR = path.join(process.cwd(), "scripts", ".bulk-research");
await fs.mkdir(OUT_DIR, { recursive: true });

async function resolveAsin(shortUrl) {
  const res = await fetch(shortUrl, { redirect: "follow", headers: { "User-Agent": UA } });
  const finalUrl = res.url;
  await res.text().catch(() => {});
  const m = finalUrl.match(/\/dp\/([A-Z0-9]{10})/) || finalUrl.match(/\/gp\/product\/([A-Z0-9]{10})/);
  return { finalUrl, asin: m ? m[1] : null };
}

/** Extracts a balanced {...} object literal starting at the first quoted `key`, then evaluates it as JS (not strict JSON, Amazon mixes single/double quotes). */
function extractBlob(html, key) {
  const idx = html.indexOf(`'${key}'`) !== -1 ? html.indexOf(`'${key}'`) : html.indexOf(`"${key}"`);
  if (idx === -1) return null;
  const braceStart = html.indexOf("{", idx);
  if (braceStart === -1) return null;
  let depth = 0;
  for (let i = braceStart; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) {
        const slice = html.slice(braceStart, i + 1);
        try {
          // eslint-disable-next-line no-new-func
          return new Function(`return (${slice});`)();
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/** Amazon image URLs encode size as a suffix like ._SS64_ or ._SL1500_; swap for a larger crop of the same underlying image. */
function upsizeImage(url) {
  if (!url) return url;
  return url.replace(/\.(_[A-Z]{2}\d+_)+\./, "._SL1500_.");
}

async function fetchProduct(asin) {
  const url = `https://www.amazon.co.uk/dp/${asin}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept-Language": "en-GB,en;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    },
  });
  const html = await res.text();
  return { status: res.status, html, finalUrl: res.url };
}

function parseSwatchList($, dimension) {
  const out = [];
  $(`#inline-twister-expander-content-${dimension} li[data-asin]`).each((_, el) => {
    const asin = $(el).attr("data-asin");
    const img = $(el).find("img.swatch-image").first();
    if (img.length) {
      out.push({ asin, label: img.attr("alt")?.trim(), image: upsizeImage(img.attr("src")) });
    } else {
      const text = $(el).find(".swatch-title-text-display").first().text().trim();
      out.push({ asin, label: text || null, image: null });
    }
  });
  return out;
}

function parseProduct(html, asin) {
  const $ = cheerio.load(html);

  const title = $("#productTitle").text().trim() || null;
  const bylineText = $("#bylineInfo").text().trim();
  const brand = bylineText.replace(/^(Visit the|Brand:)\s*/i, "").replace(/\s*Store$/i, "").trim() || null;

  const bullets = [];
  $("#feature-bullets ul li span.a-list-item").each((_, el) => {
    const t = $(el).text().trim();
    if (t && !/warranty|see more product details/i.test(t)) bullets.push(t);
  });

  let description = $("#productDescription").text().trim().replace(/\s+/g, " ");

  const hiResSet = new Set();
  for (const m of html.matchAll(/"hiRes":"([^"]+)"/g)) hiResSet.add(m[1]);
  const images = Array.from(hiResSet);

  const colourSwatches = parseSwatchList($, "color_name");
  const sizeSwatches = parseSwatchList($, "size_name");

  const colorImagesBlob = extractBlob(html, "colorImages");
  const colourImageMap = {};
  if (colorImagesBlob) {
    for (const [name, imgs] of Object.entries(colorImagesBlob)) {
      if (name === "initial" || !Array.isArray(imgs) || !imgs.length) continue;
      colourImageMap[name] = imgs[0].hiRes || imgs[0].large || null;
    }
  }

  const matrixBlob = extractBlob(html, "dimensionValuesDisplayData");
  // matrixBlob: { asin: [colour, sizeLabel] } or { asin: [singleDimensionValue] }
  let matrix = null;
  if (matrixBlob && typeof matrixBlob === "object") {
    matrix = Object.entries(matrixBlob).map(([siblingAsin, values]) => ({ asin: siblingAsin, values }));
  }

  const availabilityText = $("#availability").text().trim().replace(/\s+/g, " ");
  const outOfStock = /currently unavailable|out of stock/i.test(availabilityText) && !!availabilityText;

  return {
    asin,
    title,
    brand,
    bullets,
    description,
    images: images.slice(0, 12),
    colourSwatches,
    sizeSwatches,
    colourImageMap,
    matrix,
    availabilityText,
    outOfStock,
  };
}

const summary = [];

for (const { url, finalPrice } of URLS) {
  console.log(`\n=== ${url} (given price £${finalPrice}) ===`);
  try {
    const { finalUrl, asin } = await resolveAsin(url);
    if (!asin) {
      console.log(`[SKIPPED] Could not resolve ASIN from ${finalUrl}`);
      summary.push({ url, status: "SKIPPED", reason: "no ASIN resolved" });
      continue;
    }

    const { status, html } = await fetchProduct(asin);
    if (status !== 200) {
      console.log(`[SKIPPED] HTTP ${status}`);
      summary.push({ url, status: "SKIPPED", reason: `HTTP ${status}`, asin });
      continue;
    }

    const parsed = parseProduct(html, asin);
    parsed.finalPrice = finalPrice;
    parsed.sourceUrl = url;
    parsed.finalUrl = finalUrl;

    const outFile = path.join(OUT_DIR, `${asin}.json`);
    await fs.writeFile(outFile, JSON.stringify(parsed, null, 2));

    const matrixCount = parsed.matrix ? parsed.matrix.length : 0;
    console.log(
      `OK: "${parsed.title?.slice(0, 65)}" | brand=${parsed.brand} | images=${parsed.images.length} | colourSwatches=${parsed.colourSwatches.length} | sizeSwatches=${parsed.sizeSwatches.length} | matrixEntries=${matrixCount} | outOfStock=${parsed.outOfStock}`
    );
    summary.push({
      url,
      status: "OK",
      asin,
      title: parsed.title,
      brand: parsed.brand,
      images: parsed.images.length,
      colourSwatches: parsed.colourSwatches.length,
      sizeSwatches: parsed.sizeSwatches.length,
      matrixEntries: matrixCount,
      outOfStock: parsed.outOfStock,
    });
  } catch (err) {
    console.log(`[SKIPPED] Error: ${err.message}`);
    summary.push({ url, status: "SKIPPED", reason: err.message });
  }
}

console.log("\n\n=== RESEARCH SUMMARY ===");
console.table(summary);
await fs.writeFile(path.join(OUT_DIR, "_summary.json"), JSON.stringify(summary, null, 2));
