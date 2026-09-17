"use client";

import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Settings } from "@/lib/types";
import { useCart } from "./cart-context";
import { GreekMark } from "./greek-mark";

const NAV_LINKS = [
  { href: "#drinks", label: "Drinks" },
  { href: "#merch", label: "Merch" },
  { href: "#how-it-works", label: "How it works" },
];

export function Navbar({ settings }: { settings: Settings }) {
  const cart = useCart();
  return (
    <header className="relative z-20 px-4 py-5 sm:px-6">
      <nav className="liquid-glass mx-auto flex max-w-5xl items-center justify-between rounded-full py-2.5 pr-2.5 pl-5 sm:pl-6">
        <div className="flex min-w-0 items-center">
          <a href="#top" className="group flex items-center gap-3" aria-label={`${settings.storeName} home`}>
            <GreekMark mode="hover" strokeWidth={9} className="w-[42px] text-accent" />
            <span className="truncate text-base font-semibold text-foreground">{settings.storeName}</span>
          </a>
          <div className="ml-8 hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/80 transition-colors duration-200 hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <Button
          variant="glass"
          size="md"
          onClick={cart.open}
          aria-label={cart.count > 0 ? `Open cart, ${cart.count} items` : "Open cart"}
          className="relative gap-2.5 px-4 sm:px-5"
        >
          <ShoppingBag className="size-[18px]" aria-hidden />
          <span className="hidden sm:inline">Cart</span>
          <AnimatePresence initial={false}>
            {cart.hydrated && cart.count > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 26 }}
                className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground tabular-nums"
              >
                {/* Re-keyed on every count change so the number pops. */}
                <motion.span
                  key={cart.count}
                  initial={{ scale: 1.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 600, damping: 20 }}
                  className="inline-block"
                >
                  {cart.count}
                </motion.span>
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </nav>
    </header>
  );
}
