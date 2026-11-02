"use client";

import * as React from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageLightbox } from "@/components/product/image-lightbox";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 overflow-hidden">
      {/* Sage frame around a white plate, matching the hero treatment. */}
      <div className="rounded-[1.75rem] bg-forest-100 p-2.5 sm:p-3">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="Open full-size image"
          className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-[1.4rem] bg-white"
        >
          <Image
            src={images[active]}
            alt={title}
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 90vw"
            // `contain`, not `cover`: these are cut-out product shots, and
            // cover was cropping the ends off wide carriers.
            className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <span className="absolute right-4 bottom-4 flex size-10 items-center justify-center rounded-full bg-forest-800 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
            <ZoomIn className="size-4" />
          </span>
        </button>
      </div>

      {images.length > 1 && (
        <div className="scrollbar-thin flex w-full max-w-full gap-3 overflow-x-auto pb-1">
          {images.map((img, index) => (
            <button
              key={img + index}
              onClick={() => setActive(index)}
              className={cn(
                "relative size-18 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 bg-white transition-colors",
                active === index ? "border-forest-700" : "border-gray-200 hover:border-forest-300"
              )}
              aria-label={`View image ${index + 1}`}
            >
              <Image src={img} alt="" fill sizes="72px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}

      <ImageLightbox
        images={images}
        title={title}
        isOpen={lightboxOpen}
        index={active}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setActive}
      />
    </div>
  );
}
