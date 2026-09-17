"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { asset } from "@/lib/base-path";
import { formatCents } from "@/lib/money";
import type { Settings } from "@/lib/types";
import { useCart } from "./cart-context";
import { CheckoutForm } from "./checkout-form";

type Step = "cart" | "checkout" | "done";

const TITLES: Record<Step, string> = { cart: "Your order", checkout: "Checkout", done: "Order received" };

export function CartDrawer({ settings }: { settings: Settings }) {
  const cart = useCart();
  return (
    <AnimatePresence>
      {cart.isOpen && <DrawerPanel key="panel" settings={settings} />}
    </AnimatePresence>
  );
}

/** Mounted only while open, so step state and focus handling reset naturally on close. */
function DrawerPanel({ settings }: { settings: Settings }) {
  const cart = useCart();
  const [step, setStep] = React.useState<Step>("cart");
  const panelRef = React.useRef<HTMLDivElement>(null);
  const { close } = cart;
  const finish = React.useCallback(() => setStep("done"), []);

  // Focus management: remember the opener, focus the panel, restore on close, lock scroll.
  React.useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => panelRef.current?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [close]);

  const empty = cart.lines.length === 0;

  return (
    <>
      <motion.button
            type="button"
            aria-label="Close cart"
            className="fixed inset-0 z-40 cursor-default bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            tabIndex={-1}
            className="glass-strong fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col outline-none sm:inset-y-3 sm:right-3 sm:rounded-3xl"
            initial={{ x: "100%", opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.6 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                {step === "checkout" && (
                  <Button variant="ghost" size="icon-sm" onClick={() => setStep("cart")} aria-label="Back to cart">
                    <ArrowLeft className="size-4" aria-hidden />
                  </Button>
                )}
                <h2 id="cart-title" className="text-lg font-semibold tracking-tight">
                  {TITLES[step]}
                </h2>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Close cart">
                <X className="size-5" aria-hidden />
              </Button>
            </header>

            {step === "cart" ? (
              <>
                <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                  {empty ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
                      <span className="liquid-glass inline-flex size-14 items-center justify-center rounded-full">
                        <ShoppingBag className="size-6 text-foreground/70" aria-hidden />
                      </span>
                      <p className="text-foreground/70">Nothing in here yet.</p>
                      <Button variant="glass" onClick={close}>
                        Back to the menu
                      </Button>
                    </div>
                  ) : (
                    <ul className="divide-y divide-white/10">
                      {cart.lines.map(({ product, quantity }) => (
                        <li key={product.id} className="flex gap-4 py-4">
                          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-tile">
                            {product.image && (
                              <Image
                                src={asset(product.image)}
                                alt=""
                                fill
                                sizes="64px"
                                className={product.imageFit === "cover" ? "object-cover" : "object-contain p-1.5"}
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs text-foreground/60">{product.brand}</p>
                            <p className="truncate font-medium">{product.name}</p>
                            <p className="mt-1 text-sm text-foreground/70 tabular-nums">
                              {formatCents(product.priceCents)} x {quantity} ={" "}
                              <span className="text-foreground">{formatCents(product.priceCents * quantity)}</span>
                            </p>
                          </div>
                          <div className="flex flex-col items-end justify-between gap-2">
                            <div
                              className="liquid-glass flex items-center rounded-full"
                              role="group"
                              aria-label={`${product.name} quantity`}
                            >
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-9"
                                onClick={() => cart.setQuantity(product.id, quantity - 1)}
                                aria-label={`Remove one ${product.name}`}
                              >
                                <Minus className="size-3.5" aria-hidden />
                              </Button>
                              <span className="min-w-6 text-center text-sm font-semibold tabular-nums">{quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="size-9"
                                onClick={() => cart.add(product.id)}
                                disabled={quantity >= 99}
                                aria-label={`Add one more ${product.name}`}
                              >
                                <Plus className="size-3.5" aria-hidden />
                              </Button>
                            </div>
                            <button
                              type="button"
                              onClick={() => cart.remove(product.id)}
                              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-full px-2 text-xs text-foreground/60 transition-colors hover:text-danger"
                            >
                              <Trash2 className="size-3.5" aria-hidden />
                              Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {!empty && (
                  <footer className="border-t border-white/10 px-5 py-4 sm:px-6">
                    <div className="mb-4 flex items-baseline justify-between">
                      <span className="text-sm text-foreground/70">
                        {cart.count} {cart.count === 1 ? "item" : "items"}
                      </span>
                      <span className="text-2xl font-semibold tracking-tight tabular-nums">
                        {formatCents(cart.totalCents)}
                      </span>
                    </div>
                    {settings.storeOpen ? (
                      <Button size="lg" className="w-full" onClick={() => setStep("checkout")}>
                        Continue to payment
                        <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    ) : (
                      <p role="status" className="rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning">
                        {settings.closedMessage}
                      </p>
                    )}
                  </footer>
                )}
              </>
            ) : (
              <CheckoutForm settings={settings} onSuccess={finish} />
            )}
      </motion.div>
    </>
  );
}
