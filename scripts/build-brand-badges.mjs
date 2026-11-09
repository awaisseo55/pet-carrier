// Turns the owner-supplied brand artwork in assets/brand-logos/ into the small,
// trimmed, transparent-background WebP files the checkout trust badges render
// from (public/badges/). Run with `npm run build:badges` after replacing or
// adding source art, then update the intrinsic sizes in
// components/checkout/brand-badge.tsx to match what this prints.
//
// The source files are kept in the repo rather than only on the owner's
// machine so this stays reproducible.

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "assets/brand-logos");
const OUT = path.join(root, "public/badges");

// 3x the largest height any badge is rendered at, so they stay crisp on
// retina without shipping full-size brand artwork to every visitor.
const EXPORT_HEIGHT = 96;

const jobs = [
  { name: "apple-pay", file: "Apple_Pay-Logo.wine.png", trim: true },
  { name: "klarna", file: "Klarna_Payment_Badge.svg.webp", trim: true },
  {
    name: "dpd",
    // The horizontal lockup. DPD also publishes a stacked parcel-above-wordmark
    // version, which is far too tall to sit inline in a badge row.
    file: "DPD_logo.webp",
    trim: true,
  },
  {
    name: "royal-mail",
    file: "Royal-Mail-Logo.png",
    // The supplied file pastes the crown into an opaque white square with a
    // stray red border around it, which would render as a visible white box
    // on the sage checkout panel. Crop to the red wordmark bar instead: it's
    // clean, fully opaque, and the right proportions for a badge row. If a
    // clean crown-inclusive version is ever sourced, drop this extract and
    // switch to `trim: true`.
    extract: { left: 330, top: 998, width: 3179, height: 784 },
  },
];

await mkdir(OUT, { recursive: true });

for (const job of jobs) {
  let img = sharp(path.join(SRC, job.file));
  if (job.extract) img = img.extract(job.extract);
  if (job.trim) img = img.trim({ threshold: 1 });

  const info = await img
    .resize({ height: EXPORT_HEIGHT, fit: "inside" })
    .webp({ quality: 92, effort: 6 })
    .toFile(path.join(OUT, `${job.name}.webp`));

  console.log(
    `${job.name}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)}KB`,
  );
}
