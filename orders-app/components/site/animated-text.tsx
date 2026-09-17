"use client";

import * as React from "react";
import { motion, useInView, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

/*
  Word-by-word entrance for headlines. Each word is a clipped box whose inner span
  slides up into view, so letters appear to rise out of the baseline.
*/

const container: Variants = {
  hidden: {},
  visible: (delay: number = 0) => ({ transition: { staggerChildren: 0.09, delayChildren: delay } }),
};

const word: Variants = {
  hidden: { y: "110%", rotate: 4, opacity: 0 },
  visible: { y: "0%", rotate: 0, opacity: 1, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
};

interface RiseInProps {
  /** Words (or word-like React nodes) to reveal in order. */
  words: React.ReactNode[];
  delay?: number;
  className?: string;
}

export function RiseIn({ words, delay = 0, className }: RiseInProps) {
  return (
    <motion.h1 className={cn("flex flex-wrap justify-center gap-x-[0.22em]", className)} variants={container} initial="hidden" animate="visible" custom={delay}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em]">
          <motion.span className="inline-block origin-bottom-left will-change-transform" variants={word}>
            {w}
          </motion.span>
        </span>
      ))}
    </motion.h1>
  );
}

/**
 * Clip-reveal for the giant footer wordmark: slides up when scrolled into view.
 * The wrapper is what gets observed — the inner span starts translated out of the
 * clip box, so watching it directly would never fire.
 */
export function ClipReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <span ref={ref} className={cn("block overflow-hidden", className)}>
      <motion.span
        className="block will-change-transform"
        initial={{ y: "100%" }}
        animate={inView ? { y: "0%" } : undefined}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}
