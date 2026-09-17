"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { formatCents } from "@/lib/money";
import { useCart } from "./cart-context";

/** Floating summary pill that appears once something is in the cart. */
export function CartBar() {
  const cart = useCart();
  const visible = cart.hydrated && cart.count > 0 && !cart.isOpen;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center px-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <button
            type="button"
            onClick={cart.open}
            className="glass-strong pointer-events-auto flex h-14 w-full max-w-md cursor-pointer items-center justify-between rounded-full py-2 pr-2 pl-5 text-left transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
            aria-label={`View cart, ${cart.count} items, ${formatCents(cart.totalCents)}`}
          >
            <span className="flex items-center gap-3">
              <ShoppingBag className="size-5" aria-hidden />
              <span className="text-sm">
                <span className="font-semibold tabular-nums">{cart.count}</span>{" "}
                <span className="text-foreground/70">{cart.count === 1 ? "item" : "items"}</span>
              </span>
            </span>
            <span className="flex items-center gap-3">
              <span className="font-semibold tabular-nums">{formatCents(cart.totalCents)}</span>
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
