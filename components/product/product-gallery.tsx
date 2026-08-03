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
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label="Open full-size image"
        className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-xl bg-gray-100 shadow-sm"
      >
        <Image
          src={images[active]}
          alt={title}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 90vw"
          className="object-cover"
        />
        <span className="absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          <ZoomIn className="size-4" />
        </span>
      </button>
      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((img, index) => (
            <button
              key={img + index}
              onClick={() => setActive(index)}
              className={cn(
                "relative size-18 shrink-0 overflow-hidden rounded-xl border-2 transition-colors cursor-pointer",
                active === index ? "border-blue-600" : "border-transparent"
              )}
              aria-label={`View image ${index + 1}`}
            >
              <Image src={img} alt="" fill sizes="72px" className="object-cover" />
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
