import type { NextConfig } from "next";

const r2Hostname = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  ? new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    // Vercel's on-the-fly Image Optimization treats every distinct source
    // URL as a new "source image" against the plan's monthly quota. Bulk
    // migrating all product images to the new R2 custom domain (see
    // CLAUDE.md) made all of them look brand new at once and blew through
    // the Hobby plan's quota, returning 402 Payment Required for every
    // product image on the site. Since lib/image-pipeline.ts already
    // resizes/converts everything to correctly-sized WebP on upload,
    // Vercel's runtime resizing was mostly redundant, so this is disabled
    // rather than relied on. next/image still handles lazy loading and
    // layout, it just serves the original file instead of proxying through
    // /_next/image.
    unoptimized: true,
    // remotePatterns has no effect on runtime behaviour while `unoptimized`
    // is true above (Next only enforces it when proxying through
    // /_next/image), kept anyway as a source-of-truth allowlist and because
    // scripts/check-image-domains.mjs reads it. If `unoptimized` is ever
    // removed, re-add `minimumCacheTTL` (a long value, e.g. 31 days) before
    // doing so: R2 responses carry no Cache-Control header, so Next would
    // otherwise default to a 60s cache and re-fetch every image variant from
    // the origin every minute. See CLAUDE.md "Product images" section for
    // the full history of why this is configured this way.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
      },
      // Cloudflare R2 public bucket serving product/category/hero images (see lib/image-store.ts).
      ...(r2Hostname
        ? [
            {
              protocol: "https" as const,
              hostname: r2Hostname,
            },
          ]
        : []),
    ],
  },
  async redirects() {
    return [
      // "By Style" / "By Use" category rename to pet-specific SEO slugs (2026-08).
      { source: "/carriers/airline-approved-carriers", destination: "/carriers/pet-airline-approved-carriers", permanent: true },
      { source: "/carriers/backpack-carriers", destination: "/carriers/pet-backpack-carriers", permanent: true },
      { source: "/carriers/rolling-carriers", destination: "/carriers/pet-rolling-carriers", permanent: true },
      { source: "/carriers/sling-carriers", destination: "/carriers/pet-sling-carriers", permanent: true },
      { source: "/carriers/hard-sided-carriers", destination: "/carriers/pet-hard-sided-carriers", permanent: true },
      { source: "/carriers/soft-sided-carriers", destination: "/carriers/pet-soft-sided-carriers", permanent: true },
      { source: "/carriers/vet-visit-carriers", destination: "/carriers/pet-carriers-for-vet-visits", permanent: true },
      { source: "/carriers/car-travel-carriers", destination: "/carriers/pet-car-travel-carriers", permanent: true },
      { source: "/carriers/everyday-carriers", destination: "/carriers/everyday-pet-carriers", permanent: true },
      // Dycietx soft-sided carrier discontinued/removed (2026-09), redirected to the
      // equivalent Amazon Basics soft carrier listing.
      {
        source: "/product/dycietx-soft-sided-foldable-cat-dog-pet-puppy-carrier-bag-portable-pets-travel-carriers-for-cats-dogs-with-shoulder-strap-removable-mat-durable-cat-basket-of-17-lbs-airline-approved-black-m",
        destination: "/product/amazon-basics-soft-cat-and-dog-carrier-airline-approved-grey",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
