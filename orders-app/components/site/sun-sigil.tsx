"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/*
  Tiny version of the Sun Cruiser can art: sun over mountains over water. The sun
  rises behind the ridge when it scrolls into view; the water keeps drifting.
*/
export function SunSigil({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 64 64"
      aria-hidden
      className={cn("size-9 shrink-0 overflow-visible sm:size-11", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
    >
      <defs>
        <clipPath id="sun-sigil-sky">
          <rect x="0" y="0" width="64" height="40" />
        </clipPath>
      </defs>
      {/* sun rises inside the sky clip so the ridge hides its lower half */}
      <g clipPath="url(#sun-sigil-sky)">
        <motion.circle
          cx="32"
          cy="30"
          r="13"
          fill="#e6b955"
          variants={{ hidden: { y: 22, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 } } }}
        />
        <motion.g variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 1.2, delay: 0.5 } } }}>
          <motion.circle
            cx="32"
            cy="30"
            r="19"
            fill="none"
            stroke="#e6b955"
            strokeOpacity="0.35"
            strokeWidth="1"
            style={{ transformOrigin: "32px 30px" }}
            animate={reduced ? undefined : { scale: [1, 1.12, 1], opacity: [1, 0.45, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
          />
        </motion.g>
      </g>
      <motion.path
        d="M2 42 L14 30 L22 37 L32 25 L42 36 L50 30 L62 42 L62 44 L2 44 Z"
        fill="#0a0a0a"
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth="1.3"
        strokeLinejoin="round"
        variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
      />
      {[48, 54, 60].map((y, i) => (
        <motion.g
          key={y}
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.6, delay: 0.4 + i * 0.12 } } }}
        >
          <motion.path
            d={`M-8 ${y} C 2 ${y - 3}, 10 ${y + 3}, 20 ${y} S 38 ${y - 3}, 48 ${y} S 66 ${y + 3}, 76 ${y}`}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.55 - i * 0.15}
            strokeWidth="1.3"
            strokeLinecap="round"
            animate={reduced ? undefined : { x: [0, -10, 0] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.g>
      ))}
    </motion.svg>
  );
}
