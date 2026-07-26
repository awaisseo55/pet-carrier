"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = React.useState(0);
  const [zoomStyle, setZoomStyle] = React.useState<React.CSSProperties>({});
  const [zooming, setZooming] = React.useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative aspect-square overflow-hidden rounded-3xl bg-cream-dark shadow-warm"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
      >
        <Image
          src={images[active]}
          alt={title}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 90vw"
          className={cn("object-cover transition-transform duration-300", zooming && "scale-150")}
          style={zoomStyle}
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((img, index) => (
            <button
              key={img + index}
              onClick={() => setActive(index)}
              className={cn(
                "relative size-18 shrink-0 overflow-hidden rounded-xl border-2 transition-colors cursor-pointer",
                active === index ? "border-primary" : "border-transparent"
              )}
              aria-label={`View image ${index + 1}`}
            >
              <Image src={img} alt="" fill sizes="72px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
