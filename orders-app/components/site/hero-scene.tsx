"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { asset } from "@/lib/base-path";

/*
  The Sun Cruiser hero backdrop: a sun rising behind a mountain ridge over water
  (the artwork on every can). On top of that sits a WebGL layer (hero-3d.tsx) with
  real 3D cans and gold Λ Χ Α letters. Browsers without WebGL, and people who ask
  for reduced motion, get the lighter 2D cutout cans below instead.
*/

const Hero3D = dynamic(() => import("./hero-3d"), { ssr: false });

/** WebGL availability is only knowable in the browser: false on the server, checked once on the client. */
let webglSupport: boolean | null = null;
function detectWebGL(): boolean {
  if (webglSupport === null) {
    try {
      const canvas = document.createElement("canvas");
      webglSupport = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}
function useWebGL(): boolean | null {
  return React.useSyncExternalStore(
    () => () => {},
    detectWebGL,
    () => null,
  );
}

// `pos` holds full Tailwind class strings so the JIT can see them: phones get two cans
// tucked into the top corners, wider screens get all four spread down the sides.
const CANS = [
  { src: "/products/cutouts/sc-peach-iced-tea.png", side: "left", pos: "top-[7%] -left-[7%] sm:top-[16%] sm:left-[5%]", width: 140, depth: 1, rotate: -14, float: 6.5, delay: 0.5 },
  { src: "/products/cutouts/sc-classic-iced-tea.png", side: "left", pos: "hidden sm:block sm:top-[60%] sm:left-[22%]", width: 104, depth: 0.55, rotate: 10, float: 7.5, delay: 0.7 },
  { src: "/products/cutouts/sc-raspberry-iced-tea.png", side: "right", pos: "top-[9%] -right-[8%] sm:top-[13%] sm:right-[14%]", width: 116, depth: 0.7, rotate: 12, float: 8, delay: 0.6 },
  { src: "/products/cutouts/sc-pink-lemonade.png", side: "right", pos: "hidden sm:block sm:top-[49%] sm:right-[4%]", width: 146, depth: 1.1, rotate: -9, float: 6, delay: 0.8 },
] as const;

/** Tracks the pointer inside `ref` as -1..1 on both axes, springing back to center on leave. */
function usePointerOffset(ref: React.RefObject<HTMLElement | null>) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      x.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
      y.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
    };
    const leave = () => {
      x.set(0);
      y.set(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [ref, x, y]);
  return { x, y };
}

function FloatingCan({ can, pointer, reduced }: { can: (typeof CANS)[number]; pointer: { x: MotionValue<number>; y: MotionValue<number> }; reduced: boolean }) {
  const px = useSpring(useTransform(pointer.x, (v) => v * 22 * can.depth), { stiffness: 60, damping: 18 });
  const py = useSpring(useTransform(pointer.y, (v) => v * 14 * can.depth), { stiffness: 60, damping: 18 });
  const enterFrom = can.side === "left" ? -60 : 60;

  return (
    // Outer: pointer parallax. Middle: entrance. Inner: idle float. Kept separate so
    // no two layers fight over the same transform axis.
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute z-[5] will-change-transform ${can.pos}`}
      style={{ x: px, y: py }}
    >
      <motion.div
        initial={{ opacity: 0, x: enterFrom, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 1.1, delay: can.delay, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          style={{ "--can-w": `${can.width}px` } as React.CSSProperties}
          className="w-[60px] opacity-90 sm:w-[96px] sm:opacity-100 md:w-[var(--can-w)]"
          animate={reduced ? { rotate: can.rotate } : { y: [0, -12, 0], rotate: [can.rotate - 2.5, can.rotate + 2.5, can.rotate - 2.5] }}
          transition={reduced ? undefined : { duration: can.float, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src={asset(can.src)}
            alt=""
            width={302}
            height={852}
            sizes="(min-width: 768px) 160px, 96px"
            priority
            className="h-auto w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.6)]"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function HeroScene({ id, children, className }: { id?: string; children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLElement>(null);
  const pointer = usePointerOffset(ref);
  const reduced = useReducedMotion() ?? false;
  const webgl = useWebGL();
  const use3D = webgl === true && !reduced;

  return (
    <section ref={ref} id={id} className={className}>
      {/* Sun: soft gold disc that rises from behind the ridge on load, then breathes. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 z-[1] aspect-square w-[min(120vw,900px)] -translate-x-1/2 rounded-full"
        style={{
          bottom: "-12%",
          background:
            "radial-gradient(circle at center, rgba(230,185,85,0.55) 0%, rgba(230,185,85,0.28) 22%, rgba(230,150,60,0.12) 40%, rgba(230,150,60,0) 62%)",
        }}
        initial={{ y: "45%", opacity: 0 }}
        animate={reduced ? { y: "0%", opacity: 1 } : { y: "0%", opacity: 1, scale: [1, 1.05, 1] }}
        transition={{
          y: { duration: 2.4, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 1.2 },
          scale: { duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2.4 },
        }}
      />

      {/* Ridge + water, drawn as SVG so it scales with the section. */}
      <svg
        aria-hidden
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[160px] w-full sm:h-[220px]"
      >
        <motion.path
          d="M0 150 L120 118 L230 140 L340 96 L430 126 L560 70 L640 104 L760 60 L860 100 L980 72 L1080 110 L1190 84 L1300 118 L1440 92 L1440 220 L0 220 Z"
          fill="#050505"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
        {[0, 1, 2].map((i) => (
          <motion.path
            key={i}
            d={`M-120 ${186 + i * 13} C 60 ${176 + i * 13}, 180 ${196 + i * 13}, 360 ${186 + i * 13} S 660 ${176 + i * 13}, 840 ${186 + i * 13} S 1140 ${196 + i * 13}, 1320 ${186 + i * 13} S 1500 ${176 + i * 13}, 1620 ${186 + i * 13}`}
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="1.2"
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, x: [0, -40, 0] }}
            transition={{ opacity: { duration: 1, delay: 0.8 + i * 0.15 }, x: { duration: 9 + i * 2, repeat: Infinity, ease: "easeInOut" } }}
          />
        ))}
      </svg>

      {use3D && <Hero3D eventSource={ref} />}
      {webgl === false || reduced
        ? CANS.map((can) => <FloatingCan key={can.src} can={can} pointer={pointer} reduced={reduced} />)
        : null}

      {children}
    </section>
  );
}
