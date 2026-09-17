"use client";

import * as React from "react";
import type { Product } from "@/lib/types";

/*
  Cart lives in the browser (localStorage) until checkout. Quantities are keyed by
  product id; prices always come from the current product list so a price change
  in admin is reflected the moment the page reloads.

  Storage is exposed as a tiny external store so React can hydrate from an empty
  server snapshot and then swap in the saved cart without a setState-in-effect.
*/

const STORAGE_KEY = "zr-cart-v1";
const MAX_QTY = 99;
const EMPTY: Record<string, number> = {};

type Quantities = Record<string, number>;

let snapshot: Quantities | null = null;
const listeners = new Set<() => void>();

function readStorage(): Quantities {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY;
    const out: Quantities = {};
    for (const [id, qty] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof qty === "number" && Number.isInteger(qty) && qty > 0) out[id] = Math.min(qty, MAX_QTY);
    }
    return out;
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): Quantities {
  if (snapshot === null) snapshot = readStorage();
  return snapshot;
}

function getServerSnapshot(): Quantities {
  return EMPTY;
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      snapshot = readStorage();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function sameQuantities(a: Quantities, b: Quantities): boolean {
  const aKeys = Object.keys(a);
  return aKeys.length === Object.keys(b).length && aKeys.every((key) => a[key] === b[key]);
}

function write(update: (prev: Quantities) => Quantities) {
  const prev = getSnapshot();
  const next = update(prev);
  // Keep the same reference for no-op writes so useSyncExternalStore does not re-render.
  if (sameQuantities(prev, next)) return;
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* private mode or full storage: cart still works for this page load */
  }
  emit();
}

// Cart actions are module-level so they are referentially stable across renders.
function setQuantity(productId: string, quantity: number) {
  write((prev) => {
    const next = { ...prev };
    const clamped = Math.max(0, Math.min(MAX_QTY, Math.floor(quantity)));
    if (clamped === 0) delete next[productId];
    else next[productId] = clamped;
    return next;
  });
}

function add(productId: string) {
  write((prev) => ({ ...prev, [productId]: Math.min(MAX_QTY, (prev[productId] ?? 0) + 1) }));
}

function remove(productId: string) {
  setQuantity(productId, 0);
}

function clear() {
  write(() => EMPTY);
}

function useHydrated(): boolean {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  hydrated: boolean;
  quantities: Quantities;
  lines: CartLine[];
  count: number;
  totalCents: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({ products, children }: { products: Product[]; children: React.ReactNode }) {
  const quantities = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useHydrated();
  const [isOpen, setIsOpen] = React.useState(false);

  const productMap = React.useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const lines = React.useMemo<CartLine[]>(() => {
    return Object.entries(quantities)
      .map(([id, quantity]) => {
        const product = productMap.get(id);
        return product && product.available ? { product, quantity } : null;
      })
      .filter((line): line is CartLine => line !== null);
  }, [quantities, productMap]);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);

  const value = React.useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const totalCents = lines.reduce((sum, line) => sum + line.quantity * line.product.priceCents, 0);
    return { hydrated, quantities, lines, count, totalCents, isOpen, open, close, add, setQuantity, remove, clear };
  }, [hydrated, quantities, lines, isOpen, open, close]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
