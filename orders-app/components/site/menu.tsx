"use client";

import { motion } from "motion/react";
import { Shirt } from "lucide-react";
import { Eyebrow, Serif, reveal } from "@/components/glass";
import type { CategoryGroup } from "@/lib/catalog";
import type { Settings } from "@/lib/types";
import { ProductCard } from "./product-card";
import { SunSigil } from "./sun-sigil";

interface MenuProps {
  categories: CategoryGroup[];
  settings: Settings;
}

/*
  The menu is split into sections per category (Drinks, Merch). Each section groups
  products by brand. A section with nothing in it still renders, as a "coming soon"
  card, so the nav link always has somewhere to land.
*/
export function Menu({ categories, settings }: MenuProps) {
  return (
    <section id="menu" className="relative scroll-mt-6 overflow-hidden bg-background px-4 pt-16 pb-16 sm:px-6 sm:pt-24 md:pt-36 md:pb-24">
      <div aria-hidden className="glow-top absolute inset-0" />

      <div className="relative mx-auto max-w-6xl">
        <motion.div {...reveal({ y: 20 })} className="mb-10 max-w-3xl sm:mb-16 md:mb-24">
          <Eyebrow className="mb-6">The menu</Eyebrow>
          <h2 className="text-4xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
            What are we <Serif className="text-foreground/70">having</Serif>?
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/70">
            Tap <span className="font-medium text-foreground">Add</span> on anything you want. Your cart sticks around
            until you check out.
          </p>
        </motion.div>

        <div className="space-y-20 sm:space-y-28 md:space-y-40">
          {categories.map((category) => (
            <div key={category.id} id={category.id} className="scroll-mt-24">
              <motion.div
                {...reveal({ y: 20 })}
                className="mb-6 flex flex-col gap-2 border-b border-white/10 pb-5 sm:mb-10 md:mb-14 md:flex-row md:items-end md:justify-between"
              >
                <h3 className="text-3xl tracking-tight text-foreground md:text-5xl">
                  {category.label}{" "}
                  <Serif className="text-foreground/50">{category.blurb}</Serif>
                </h3>
                <p className="text-sm text-foreground/60 tabular-nums">
                  {category.count === 0 ? "Coming soon" : `${category.count} ${category.count === 1 ? "option" : "options"}`}
                </p>
              </motion.div>

              {category.count === 0 ? (
                <motion.div
                  {...reveal({ y: 30 })}
                  className="liquid-glass flex flex-col items-center gap-4 rounded-3xl px-6 py-16 text-center"
                >
                  <span className="liquid-glass inline-flex size-14 items-center justify-center rounded-full">
                    <Shirt className="size-6 text-foreground/70" aria-hidden />
                  </span>
                  <p className="text-lg text-foreground">Nothing here yet.</p>
                  <p className="max-w-sm text-sm leading-relaxed text-foreground/60">
                    {category.label} is on the way. Check back soon.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-10 sm:space-y-16 md:space-y-24">
                  {category.brands.map(({ brand, products }) => (
                    <div key={brand}>
                      <motion.div {...reveal({ y: 20 })} className="mb-4 flex items-end justify-between gap-4 sm:mb-8 md:mb-10">
                        <h4 className="flex items-center gap-3 text-xl tracking-tight text-foreground sm:text-2xl md:text-3xl">
                          {/sun cruiser/i.test(brand) && <SunSigil />}
                          {brand}
                        </h4>
                        <p className="text-sm text-foreground/60 tabular-nums">
                          {products.length} {products.length === 1 ? "option" : "options"}
                        </p>
                      </motion.div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 md:gap-6">
                        {products.map((product, index) => (
                          <ProductCard key={product.id} product={product} index={index} storeOpen={settings.storeOpen} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
