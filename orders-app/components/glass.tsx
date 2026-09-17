"use client";

import type { MotionProps } from "motion/react";
import { cn } from "@/lib/utils";

interface RevealOptions {
  x?: number;
  y?: number;
  duration?: number;
  delay?: number;
}

/**
 * Scroll-into-view entrance: fade plus an optional slide, played once.
 * MotionConfig reducedMotion="user" strips the transform for users who ask for less motion.
 */
export function reveal({ x = 0, y = 0, duration = 0.6, delay = 0 }: RevealOptions = {}): MotionProps {
  return {
    initial: { opacity: 0, x, y },
    whileInView: { opacity: 1, x: 0, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration, delay, ease: "easeOut" },
  };
}

/** Italic serif accent word, set in Instrument Serif. */
export function Serif({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-serif font-normal italic", className)}>{children}</span>;
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs font-medium tracking-[0.2em] text-foreground/60 uppercase", className)}>{children}</p>;
}
