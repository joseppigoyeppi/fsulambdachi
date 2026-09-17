"use client";

import * as React from "react";
import { Gate } from "@/components/site/gate";
import { GreekMark } from "@/components/site/greek-mark";
import { Storefront } from "@/components/site/storefront";
import { ApiError, fetchCatalog, getMember, setMember, type Catalog } from "@/lib/api";
import type { MemberSession } from "@/lib/types";

/*
  Flow: no remembered member → the gate. Remembered member → load the menu with their
  token. If the backend rejects the token (code changed, name removed) the session is
  dropped and the gate comes back with a note. The storefront is static HTML, so all
  of this happens in the browser.
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

function useRememberedMember(): MemberSession | null | undefined {
  return React.useSyncExternalStore(
    () => () => {},
    () => getMember(),
    () => undefined,
  );
}

export default function HomePage() {
  const remembered = useRememberedMember();
  const [member, setMemberState] = React.useState<MemberSession | null | undefined>(undefined);
  const [catalog, setCatalog] = React.useState<Catalog | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const current = member === undefined ? remembered : member;

  React.useEffect(() => {
    if (!current) return;
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
        if (cancelled) return;
        if (err instanceof ApiError && err.code === "unauthorized") {
          // Code changed or the name came off the list: back to the door.
          setMember(null);
          setCatalog(null);
          setNotice("Your access has been reset — enter your name and the current code again.");
          setMemberState(null);
          return;
        }
        if (!cached) setError(err instanceof ApiError ? err.message : "Could not load the menu.");
      });
    return () => {
      cancelled = true;
    };
  }, [current]);

  const signOut = React.useCallback(() => {
    setMember(null);
    setCatalog(null);
    setNotice(null);
    setMemberState(null);
    try {
      window.sessionStorage.removeItem(CACHE_KEY);
    } catch {
      /* fine */
    }
  }, []);

  if (current === undefined) return null;
  if (!current) {
    return (
      <Gate
        notice={notice}
        onEnter={(session) => {
          setNotice(null);
          setError(null);
          setMemberState(session);
        }}
      />
    );
  }
  if (catalog) return <Storefront products={catalog.products} settings={catalog.settings} member={current} onSignOut={signOut} />;

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
