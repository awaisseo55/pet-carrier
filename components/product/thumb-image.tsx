"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { thumbnailUrl } from "@/lib/image-variants";

/**
 * next/image for any product photo rendered well under 400px: listing cards,
 * gallery strips, colour swatches, cart rows. It requests the stored 400x400
 * variant instead of the 1200x1200 one held on the product record.
 *
 * Images are served straight from R2 with `images.unoptimized: true` (see
 * next.config.ts), so nothing downsizes them in flight and a `sizes` attribute
 * has no effect. Picking the right stored file is the only lever there is, and
 * it is a big one: a category page was shipping ~26 MB of full-size photos,
 * which is what made every image on it break at once on a slow connection.
 *
 * Not every image in the catalogue has a thumb variant (older imports predate
 * the three-size pipeline), so a thumb that 404s falls back to the full-size
 * URL, which has always worked. The failure is tracked against the specific
 * src, so a reused component instance resets itself when shown a new image.
 */
export function ThumbImage({ src, onError, ...props }: Omit<ImageProps, "src"> & { src: string }) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);

  return (
    // eslint-disable-next-line jsx-a11y/alt-text -- alt is required by ImageProps and passed through in {...props}
    <Image
      {...props}
      src={failedSrc === src ? src : thumbnailUrl(src)}
      onError={(event) => {
        setFailedSrc(src);
        onError?.(event);
      }}
    />
  );
}
