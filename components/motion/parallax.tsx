"use client";

import * as React from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Translates its children vertically as the section scrolls through the
 * viewport. Kept deliberately shallow (tens of pixels, not hundreds) so it
 * reads as depth rather than as the page fighting the scroll, and disabled
 * entirely under `prefers-reduced-motion`.
 */
export function Parallax({
  children,
  distance = 48,
  className,
}: {
  children: React.ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const raw = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const y = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.4 });

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
