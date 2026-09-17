"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reveal } from "@/components/glass";
import { asset } from "@/lib/base-path";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { useCart } from "./cart-context";

const MotionButton = motion.create(Button);

export function ProductCard({ product, index, storeOpen }: { product: Product; index: number; storeOpen: boolean }) {
  const cart = useCart();
  const quantity = cart.quantities[product.id] ?? 0;
  const canOrder = product.available && storeOpen;
  // Each add spawns a short-lived "+1" that floats up from the price.
  const [pops, setPops] = React.useState<number[]>([]);
  const add = () => {
    cart.add(product.id);
    const id = Date.now();
    setPops((prev) => [...prev, id]);
    window.setTimeout(() => setPops((prev) => prev.filter((p) => p !== id)), 700);
  };

  return (
    <motion.article
      {...reveal({ y: 40, duration: 0.7, delay: Math.min(index, 8) * 0.05 })}
      whileHover={canOrder ? { y: -6 } : undefined}
      className={cn("liquid-glass group flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl", !product.available && "opacity-70")}
    >
      <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-tile sm:aspect-[4/5] sm:rounded-t-3xl">
        {product.image ? (
          <Image
            src={asset(product.image)}
            alt={`${product.brand} ${product.name}`}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, (min-width: 640px) 45vw, 90vw"
            className={cn(
              "transition-transform duration-700 ease-out group-hover:scale-[1.04]",
              product.imageFit === "cover" ? "object-cover" : "object-contain p-3 sm:p-6",
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-black/40">No image yet</div>
        )}
        {!product.available && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-black/85 px-2.5 py-1 text-[11px] font-semibold text-white sm:top-4 sm:left-4 sm:px-3 sm:text-xs">
            Sold out
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-5 md:p-6">
        <p className="text-[10px] font-medium tracking-[0.18em] text-foreground/60 uppercase sm:text-xs">{product.brand}</p>
        <h3 className="mt-1 text-sm leading-snug font-semibold tracking-tight text-foreground sm:mt-2 sm:text-lg">
          {product.name}
        </h3>
        {product.tag && <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">{product.tag}</p>}
        {product.description && (
          <p className="mt-2 hidden text-sm leading-relaxed text-foreground/70 sm:block">{product.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3 sm:gap-3 sm:pt-5">
          <p className="relative text-base font-semibold tracking-tight tabular-nums sm:text-xl">
            {formatCents(product.priceCents)}
            <AnimatePresence>
              {pops.map((id) => (
                <motion.span
                  key={id}
                  aria-hidden
                  className="pointer-events-none absolute -top-1 left-full ml-1 text-sm font-semibold text-accent"
                  initial={{ opacity: 0, y: 6, scale: 0.8 }}
                  animate={{ opacity: 1, y: -14, scale: 1 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  +1
                </motion.span>
              ))}
            </AnimatePresence>
          </p>

          {quantity === 0 ? (
            <MotionButton
              size="sm"
              className="h-9 px-3 sm:h-10 sm:px-4"
              disabled={!canOrder}
              onClick={add}
              whileTap={{ scale: 0.92 }}
              aria-label={`Add ${product.name} to cart`}
            >
              <Plus className="size-4" aria-hidden />
              Add
            </MotionButton>
          ) : (
            <div className="liquid-glass flex items-center rounded-full" role="group" aria-label={`${product.name} quantity`}>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-9 sm:size-10"
                onClick={() => cart.setQuantity(product.id, quantity - 1)}
                aria-label={`Remove one ${product.name}`}
              >
                <Minus className="size-4" aria-hidden />
              </Button>
              <span className="min-w-6 text-center text-sm font-semibold tabular-nums sm:min-w-7" aria-live="polite">
                <motion.span
                  key={quantity}
                  className="inline-block"
                  initial={{ scale: 1.5, color: "#e6b955" }}
                  animate={{ scale: 1, color: "#ffffff" }}
                  transition={{ type: "spring", stiffness: 600, damping: 22 }}
                >
                  {quantity}
                </motion.span>
              </span>
              <MotionButton
                variant="ghost"
                size="icon-sm"
                className="size-9 sm:size-10"
                onClick={add}
                disabled={!canOrder || quantity >= 99}
                whileTap={{ scale: 0.85 }}
                aria-label={`Add one more ${product.name}`}
              >
                <Plus className="size-4" aria-hidden />
              </MotionButton>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
