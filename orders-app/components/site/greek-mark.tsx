"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/*
  ΛΧΑ drawn as line art so it can animate stroke-by-stroke. Each letter is a set of
  polylines; `draw` plays them on with pathLength, `hover` re-draws on pointer enter
  (used in the nav), `static` just renders.
*/

const STROKES: { d: string; delay: number }[] = [
  // Λ
  { d: "M 12 92 L 48 10", delay: 0 },
  { d: "M 48 10 L 84 92", delay: 0.18 },
  // Χ
  { d: "M 112 12 L 184 92", delay: 0.42 },
  { d: "M 184 12 L 112 92", delay: 0.6 },
  // Α
  { d: "M 212 92 L 248 10", delay: 0.84 },
  { d: "M 248 10 L 284 92", delay: 1.02 },
  { d: "M 227 64 L 269 64", delay: 1.2 },
];

type Mode = "draw" | "hover" | "static";

interface GreekMarkProps {
  mode?: Mode;
  /** Applied to the <svg>. Size it with a width class; height follows the 3:1 ratio. */
  className?: string;
  /** Delay before the first stroke starts drawing (draw mode). */
  delay?: number;
  strokeWidth?: number;
  title?: string;
}

export function GreekMark({ mode = "static", className, delay = 0, strokeWidth = 6, title }: GreekMarkProps) {
  const reduced = useReducedMotion();
  const animated = mode !== "static" && !reduced;

  return (
    <motion.svg
      viewBox="0 0 296 104"
      fill="none"
      className={cn("overflow-visible", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      initial={animated && mode === "draw" ? "hidden" : "visible"}
      animate={mode === "draw" ? "visible" : undefined}
      whileHover={mode === "hover" && animated ? "redraw" : undefined}
    >
      {/* Faint full-mark ghost so the shape reads even mid-draw. */}
      {STROKES.map((s, i) => (
        <path key={`ghost-${i}`} d={s.d} stroke="currentColor" strokeOpacity={0.14} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {STROKES.map((s, i) => (
        <motion.path
          key={i}
          d={s.d}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: {
              pathLength: 1,
              opacity: 1,
              transition: { pathLength: { duration: 0.55, delay: delay + s.delay, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.01, delay: delay + s.delay } },
            },
            redraw: {
              pathLength: [0, 1],
              opacity: 1,
              transition: { pathLength: { duration: 0.5, delay: s.delay * 0.35, ease: [0.16, 1, 0.3, 1] } },
            },
          }}
        />
      ))}
    </motion.svg>
  );
}
