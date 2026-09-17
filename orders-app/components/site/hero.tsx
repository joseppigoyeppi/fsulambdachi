"use client";

import { motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Serif } from "@/components/glass";
import type { Settings } from "@/lib/types";
import { RiseIn } from "./animated-text";
import { GreekMark } from "./greek-mark";
import { HeroScene } from "./hero-scene";
import { Navbar } from "./navbar";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: "easeOut" as const },
});

/*
  Load choreography (seconds): ΛΧΑ draws 0.2→1.6 · eyebrow 0.5 · headline words 0.7→1.1 ·
  tagline 1.0 · buttons 1.15 · cans fly in 0.5→0.8 · sun rises 0→2.4.
*/
export function Hero({ settings, productCount }: { settings: Settings; productCount: number }) {
  return (
    <HeroScene id="top" className="relative flex min-h-[78svh] flex-col overflow-hidden sm:min-h-svh">
      <>
        <div aria-hidden className="hero-atmosphere opacity-70" />
        <div aria-hidden className="glow-top absolute inset-0" />

        <Navbar settings={settings} />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-6 pb-16 text-center sm:pt-10 sm:pb-24 sm:-translate-y-[6%]">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="mb-5 text-accent"
          >
            <GreekMark mode="draw" delay={0.2} className="w-[84px] sm:w-[110px]" title="Lambda Chi Alpha" />
          </motion.div>

          <motion.p {...fade(0.5)} className="mb-6 text-xs font-medium tracking-[0.28em] text-foreground/70 uppercase">
            {settings.chapterName}
          </motion.p>

          <RiseIn
            delay={0.7}
            className="mb-8 font-serif text-[clamp(3.75rem,13vw,9.5rem)] leading-[0.95] tracking-tight text-foreground"
            words={[
              "Order",
              <>
                <Serif>up</Serif>.
              </>,
            ]}
          />

          <motion.p {...fade(1)} className="max-w-md text-base leading-relaxed text-foreground/80 sm:text-lg">
            {settings.tagline}
          </motion.p>

          <motion.div {...fade(1.15)} className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Button size="lg" onClick={() => document.querySelector("#drinks")?.scrollIntoView({ behavior: "smooth" })}>
              Browse the menu
              <ArrowDown className="size-4" aria-hidden />
            </Button>
            <Button
              variant="glass"
              size="lg"
              onClick={() => document.querySelector("#how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            >
              How it works
            </Button>
          </motion.div>

          {!settings.storeOpen && (
            <motion.p
              {...fade(1.3)}
              role="status"
              className="liquid-glass mt-8 max-w-md rounded-2xl px-5 py-3 text-sm text-warning"
            >
              {settings.closedMessage}
            </motion.p>
          )}
        </div>

        <motion.div
          {...fade(1.5)}
          className="relative z-10 flex flex-wrap justify-center gap-x-6 gap-y-1 px-6 pb-9 text-xs text-foreground/60 sm:pb-12"
        >
          <span>{productCount} drinks on the menu</span>
          <span aria-hidden>·</span>
          <span>Pay by screenshot</span>
          <span aria-hidden>·</span>
          <span>Brothers only</span>
        </motion.div>
      </>
    </HeroScene>
  );
}
