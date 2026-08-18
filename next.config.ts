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
    // R2's object responses carry no Cache-Control header, so without this
    // Next falls back to its 60s default and re-fetches every image variant
    // from the origin every minute. R2's public *.r2.dev dev URL (see
    // lib/r2-client.ts) is rate-limited and not meant for production
    // traffic, so keep this long since product images change rarely and are
    // cache-busted with a ?v= query string on re-upload anyway (see
    // lib/image-store.ts findUploadedImage).
    minimumCacheTTL: 2678400, // 31 days
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
};

export default nextConfig;
