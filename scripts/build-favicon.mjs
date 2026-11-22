#!/usr/bin/env node
/**
 * Builds public/favicon.ico (and the small PNG icons) from public/favicon.svg.
 *
 * Why this exists: Google was showing Vercel's triangle instead of the Pet
 * Carrier logo in search results. Everything server-side checked out (the
 * files return 200, robots.txt allows them, the <head> declares them, and
 * both Googlebot and the "Google Favicon" fetcher get 200), so the SERP icon
 * was a stale cache from before the domain served a favicon of its own. The
 * one thing actually wrong on our side was the icon itself: a single
 * 256x256 frame weighing 106 KB, with none of the conventional 16/32/48
 * frames, and 256 is not one of the multiples of 48 Google documents as the
 * recommended favicon size.
 *
 * This writes a proper multi-size ICO (16/32/48/96, PNG-compressed frames,
 * supported by every modern browser and by Google's fetcher) plus a discrete
 * 48x48 PNG, which is the exact size Google asks for.
 *
 * Usage: npm run build:favicon
 * Re-run it whenever public/favicon.svg changes; the output is committed.
 */
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "public", "favicon.svg");
const ICO_SIZES = [16, 32, 48, 96];
const PNG_SIZES = [48, 192, 512];

/**
 * Packs PNG buffers into an .ico. The format is a 6-byte header, then one
 * 16-byte directory entry per image, then the payloads. Storing PNG rather
 * than BMP inside an ICO is standard and keeps the file small.
 */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(16 * images.length);
  let offset = header.length + directory.length;

  images.forEach((img, i) => {
    const e = i * 16;
    // 0 means 256 in the ICO directory; our sizes are all below that.
    directory[e] = img.size >= 256 ? 0 : img.size; // width
    directory[e + 1] = img.size >= 256 ? 0 : img.size; // height
    directory[e + 2] = 0; // palette size (0 = truecolour)
    directory[e + 3] = 0; // reserved
    directory.writeUInt16LE(1, e + 4); // colour planes
    directory.writeUInt16LE(32, e + 6); // bits per pixel
    directory.writeUInt32LE(img.data.length, e + 8);
    directory.writeUInt32LE(offset, e + 12);
    offset += img.data.length;
  });

  return Buffer.concat([header, directory, ...images.map((i) => i.data)]);
}

async function main() {
  const svg = await fs.readFile(SOURCE);

  const frames = [];
  for (const size of ICO_SIZES) {
    const data = await sharp(svg, { density: 600 })
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    frames.push({ size, data });
  }

  const ico = buildIco(frames);
  await fs.writeFile(path.join(ROOT, "public", "favicon.ico"), ico);
  console.log(
    `✓ favicon.ico: ${ICO_SIZES.join("/")} frames, ${(ico.length / 1024).toFixed(1)} KB ` +
      `(was a single 256x256 frame at 104 KB)`
  );

  for (const size of PNG_SIZES) {
    const out = path.join(ROOT, "public", `icon-${size}.png`);
    const data = await sharp(svg, { density: 600 })
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    await fs.writeFile(out, data);
    console.log(`✓ icon-${size}.png: ${(data.length / 1024).toFixed(1)} KB`);
  }

  const apple = await sharp(svg, { density: 600 })
    // Apple touch icons are composited on an opaque background by iOS anyway,
    // so bake in the page cream rather than letting it fall back to black.
    .resize(180, 180, { fit: "contain", background: "#F4F6EF" })
    .flatten({ background: "#F4F6EF" })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await fs.writeFile(path.join(ROOT, "public", "apple-touch-icon.png"), apple);
  console.log(`✓ apple-touch-icon.png: ${(apple.length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
