"use client";

import * as React from "react";
import { Storefront } from "@/components/site/storefront";
import { GreekMark } from "@/components/site/greek-mark";
import { ApiError, fetchCatalog, type Catalog } from "@/lib/api";

/*
  The storefront is static HTML; the menu and settings come from the backend at
  load time. A cached copy in sessionStorage makes repeat visits paint instantly
  while a fresh copy is fetched behind it.
*/

const CACHE_KEY = "zr-catalog-v1";

function readCache(): Catalog | null {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Catalog) : null;
  } catch {
    return null;
  }
}

export default function HomePage() {
  const [catalog, setCatalog] = React.useState<Catalog | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const cached = readCache();
    if (cached) queueMicrotask(() => !cancelled && setCatalog(cached));
    fetchCatalog()
      .then((fresh) => {
        if (cancelled) return;
        setCatalog(fresh);
        try {
          window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
        } catch {
          /* fine */
        }
      })
      .catch((err: unknown) => {
        if (cancelled || cached) return;
        setError(err instanceof ApiError ? err.message : "Could not load the menu.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (catalog) return <Storefront products={catalog.products} settings={catalog.settings} />;

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div aria-hidden className="hero-atmosphere opacity-60" />
      <div className="relative text-accent">
        <GreekMark mode={error ? "static" : "draw"} className="w-[110px]" title="Lambda Chi Alpha" />
      </div>
      {error ? (
        <div role="alert" className="liquid-glass relative mt-8 max-w-md rounded-2xl px-5 py-4 text-sm text-foreground/80">
          <p className="font-medium text-foreground">Ordering is offline right now.</p>
          <p className="mt-1 text-foreground/60">{error}</p>
        </div>
      ) : (
        <p role="status" className="relative mt-6 text-xs tracking-[0.28em] text-foreground/60 uppercase">
          Loading the menu
        </p>
      )}
    </main>
  );
}
