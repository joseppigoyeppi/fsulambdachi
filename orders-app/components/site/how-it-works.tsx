"use client";

import { motion } from "motion/react";
import { Camera, ShoppingBag, Wallet } from "lucide-react";
import { Eyebrow, Serif, reveal } from "@/components/glass";
import type { Settings } from "@/lib/types";

export function HowItWorks({ settings }: { settings: Settings }) {
  const steps = [
    {
      Icon: ShoppingBag,
      step: "01",
      title: "Pick your drinks",
      body: "Add whatever you want from the menu. Change quantities in the cart any time before you submit.",
    },
    {
      Icon: Wallet,
      step: "02",
      title: "Pay the chapter",
      body: settings.paymentInstructions,
    },
    {
      Icon: Camera,
      step: "03",
      title: "Upload the screenshot",
      body: "Drop your full name and a screenshot of the payment at checkout. Your order is logged the moment it goes through.",
    },
  ];

  return (
    <section id="how-it-works" className="relative scroll-mt-6 overflow-hidden bg-background px-4 py-24 sm:px-6 md:py-36">
      <div aria-hidden className="glow-center absolute inset-0" />
      <div className="relative mx-auto max-w-6xl">
        <motion.div {...reveal({ y: 20 })} className="mb-12 md:mb-16">
          <Eyebrow className="mb-6">How it works</Eyebrow>
          <h2 className="max-w-3xl text-4xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Three steps. <Serif className="text-foreground/70">No group chat chaos.</Serif>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {steps.map(({ Icon, step, title, body }, index) => (
            <motion.article
              key={step}
              {...reveal({ y: 40, duration: 0.7, delay: index * 0.12 })}
              className="liquid-glass rounded-3xl p-7 md:p-8"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="liquid-glass inline-flex size-11 items-center justify-center rounded-full text-foreground">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="font-serif text-3xl text-foreground/40">{step}</span>
              </div>
              <h3 className="mb-3 text-xl tracking-tight text-foreground md:text-2xl">{title}</h3>
              <p className="text-sm leading-relaxed text-foreground/70">{body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
