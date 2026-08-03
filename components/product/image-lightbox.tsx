"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  title: string;
  isOpen: boolean;
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

/**
 * Full-image viewer opened by tapping/clicking the product gallery's main
 * image. Rendered via a portal so it isn't clipped by any ancestor's
 * overflow-hidden, and stays mounted (AnimatePresence lives inside, not
 * around, this component) so open/close gets a real exit animation instead
 * of just vanishing. Pinch-to-zoom here is native browser behaviour, this
 * component does nothing to either enable or block it.
 */
export function ImageLightbox({ images, title, isOpen, index, onClose, onIndexChange }: ImageLightboxProps) {
  const hasMultiple = images.length > 1;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // document.body isn't available during SSR, so the portal target can
    // only be resolved after mount, same pattern as the cart's localStorage
    // hydration in cart-context.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const goTo = React.useCallback(
    (delta: number) => onIndexChange((index + delta + images.length) % images.length),
    [index, images.length, onIndexChange]
  );

  React.useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasMultiple) goTo(-1);
      if (e.key === "ArrowRight" && hasMultiple) goTo(1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, hasMultiple, goTo, onClose]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -80) goTo(1);
    else if (info.offset.x > 80) goTo(-1);
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="lightbox-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="size-5" />
          </button>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(-1);
                }}
                aria-label="Previous image"
                className="absolute top-1/2 left-2 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:flex"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(1);
                }}
                aria-label="Next image"
                className="absolute top-1/2 right-2 hidden -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:flex"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}

          <motion.div
            key={images[index]}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            drag={hasMultiple ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-full max-h-[85vh] w-full max-w-4xl items-center justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- full-viewport lightbox image, next/image's fixed sizing doesn't suit an intrinsic max-height/max-width layout here */}
            <img
              src={images[index]}
              alt={title}
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
            />
          </motion.div>

          {hasMultiple && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white">
              {index + 1} / {images.length}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
