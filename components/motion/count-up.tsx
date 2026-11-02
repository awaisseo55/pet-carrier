"use client";

import * as React from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/**
 * Counts from 0 to `value` the first time it scrolls into view. Renders the
 * final value immediately for reduced-motion users and in the initial HTML,
 * so the real number is always what a crawler or a no-JS visitor sees.
 */
export function CountUp({
  value,
  duration = 1.4,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [display, setDisplay] = React.useState(value);

  React.useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, reduce, value, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
