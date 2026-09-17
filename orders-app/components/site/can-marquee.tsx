"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from "motion/react";
import { Eyebrow } from "@/components/glass";
import { asset } from "@/lib/base-path";

/*
  Endless ribbon of every Sun Cruiser can drifting across the page. Two copies of the
  row sit side by side; when the first has scrolled fully out, x snaps back by one row
  width so the loop never shows a seam. Hovering eases the speed down instead of
  stopping dead. Under reduced motion it becomes a plain horizontal scroller.
*/

const CANS = [
  { src: "/products/cutouts/sc-classic-iced-tea.png", name: "Classic Iced Tea", tilt: -6 },
  { src: "/products/cutouts/sc-half-and-half.png", name: "Half & Half", tilt: 5 },
  { src: "/products/cutouts/sc-peach-iced-tea.png", name: "Peach Iced Tea", tilt: -4 },
  { src: "/products/cutouts/sc-raspberry-iced-tea.png", name: "Raspberry Iced Tea", tilt: 7 },
  { src: "/products/cutouts/sc-classic-lemonade.png", name: "Classic Lemonade", tilt: -7 },
  { src: "/products/cutouts/sc-pink-lemonade.png", name: "Pink Lemonade", tilt: 4 },
  { src: "/products/cutouts/sc-strawberry-lemonade.png", name: "Strawberry Lemonade", tilt: -5 },
  { src: "/products/cutouts/sc-blueberry-lemonade.png", name: "Blueberry Lemonade", tilt: 6 },
];

const CRUISE_SPEED = 42; // px per second
const HOVER_SPEED = 8;

export function CanMarquee() {
  const reduced = useReducedMotion() ?? false;
  const rowRef = React.useRef<HTMLUListElement>(null);
  const x = useMotionValue(0);
  const speed = React.useRef(CRUISE_SPEED);
  const target = React.useRef(CRUISE_SPEED);

  useAnimationFrame((_, delta) => {
    if (reduced) return;
    const row = rowRef.current;
    if (!row) return;
    // Ease the speed toward its target so hover feels like a glide, not a brake.
    speed.current += (target.current - speed.current) * Math.min(1, delta / 400);
    const width = row.offsetWidth;
    let next = x.get() - (speed.current * delta) / 1000;
    if (next <= -width) next += width;
    x.set(next);
  });

  const row = (copy: number) => (
    <ul
      ref={copy === 0 ? rowRef : undefined}
      aria-hidden={copy === 1 || undefined}
      className="flex shrink-0 items-end gap-8 pr-8 sm:gap-12 sm:pr-12"
    >
      {CANS.map((can, i) => (
        <li key={`${copy}-${can.name}`} className="flex w-[84px] shrink-0 flex-col items-center gap-3 sm:w-[112px]">
          <motion.div
            className="w-[56px] sm:w-[76px]"
            initial={{ rotate: can.tilt }}
            whileHover={reduced ? undefined : { rotate: 0, y: -10, scale: 1.06 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
          >
            <Image
              src={asset(can.src)}
              alt={copy === 0 ? `Sun Cruiser ${can.name} can` : ""}
              width={302}
              height={852}
              sizes="76px"
              loading={i < 4 ? "eager" : "lazy"}
              className="h-auto w-full drop-shadow-[0_18px_24px_rgba(0,0,0,0.55)]"
            />
          </motion.div>
          <span className="text-center text-[10px] leading-tight font-medium tracking-[0.16em] text-foreground/60 uppercase">
            {can.name}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label="Sun Cruiser lineup" className="relative overflow-hidden border-y border-white/10 bg-background py-8 sm:py-10">
      <div aria-hidden className="glow-center absolute inset-0" />
      <Eyebrow className="relative mb-6 text-center">The Sun Cruiser lineup · 8 flavors</Eyebrow>
      <div
        className="relative [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
        onPointerEnter={() => (target.current = HOVER_SPEED)}
        onPointerLeave={() => (target.current = CRUISE_SPEED)}
      >
        {reduced ? (
          <div className="scroll-thin overflow-x-auto px-6">{row(0)}</div>
        ) : (
          <motion.div className="flex w-max will-change-transform" style={{ x }}>
            {row(0)}
            {row(1)}
          </motion.div>
        )}
      </div>
    </section>
  );
}
