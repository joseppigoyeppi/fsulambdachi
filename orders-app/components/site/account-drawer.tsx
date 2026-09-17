"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, LogOut, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatCents } from "@/lib/money";
import { RANKS, packsIn, type MemberStats } from "@/lib/ranks";
import type { MemberSession, Order } from "@/lib/types";
import { RankBadge } from "./rank-badge";

/*
  "My account": the signed-in brother's rank, how far to the next one, and every
  order they have placed with its status. Opens from their name in the top bar.
*/

interface AccountDrawerProps {
  open: boolean;
  onClose: () => void;
  member: MemberSession;
  orders: Order[] | null;
  stats: MemberStats | null;
  error: string | null;
  onRefresh: () => void;
  onSignOut: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function AccountDrawer(props: AccountDrawerProps) {
  return <AnimatePresence>{props.open && <Panel key="account" {...props} />}</AnimatePresence>;
}

function Panel({ onClose, member, orders, stats, error, onRefresh, onSignOut }: AccountDrawerProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => panelRef.current?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <>
      <motion.button
        type="button"
        aria-label="Close account"
        className="fixed inset-0 z-40 cursor-default bg-black/60 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
        tabIndex={-1}
        className="glass-strong fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col outline-none sm:inset-y-3 sm:right-3 sm:rounded-3xl"
        initial={{ x: "100%", opacity: 0.6 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0.6 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
          <h2 id="account-title" className="text-lg font-semibold tracking-tight">
            My account
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={onRefresh} aria-label="Refresh orders">
              <RefreshCw className="size-4" aria-hidden />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close account">
              <X className="size-5" aria-hidden />
            </Button>
          </div>
        </header>

        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {/* Rank card */}
          <section className="liquid-glass rounded-3xl p-5 text-center">
            <p className="text-xs tracking-[0.2em] text-foreground/60 uppercase">
              {member.firstName} {member.lastName}
            </p>
            {stats ? (
              <>
                <motion.div
                  key={stats.rank.id}
                  initial={{ scale: 0.7, opacity: 0, rotate: -6 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="mx-auto mt-3 w-[140px]"
                >
                  <RankBadge rank={stats.rank.id} label={stats.rank.name} />
                </motion.div>
                <p className="mt-1 font-serif text-xl italic text-foreground/80">{stats.rank.blurb}</p>
                <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums">
                  {stats.packs} <span className="text-base font-normal text-foreground/60">{stats.packs === 1 ? "pack" : "packs"}</span>
                </p>
                {stats.next ? (
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round(stats.progress * 100)}%` }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-foreground/60">
                      {stats.next.min - stats.packs} more {stats.next.min - stats.packs === 1 ? "pack" : "packs"} to{" "}
                      <span className="text-foreground">{stats.next.name}</span>
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-foreground/60">Top rank. There is nowhere left to go.</p>
                )}
                {stats.pendingPacks > 0 && (
                  <p className="mt-3 rounded-2xl bg-warning/10 px-3 py-2 text-xs text-warning">
                    {stats.pendingPacks} {stats.pendingPacks === 1 ? "pack counts" : "packs count"} once the treasurer marks your order paid.
                  </p>
                )}
              </>
            ) : error ? (
              <p role="alert" className="mt-4 text-sm text-danger">
                {error}
              </p>
            ) : (
              <p className="mt-6 inline-flex items-center gap-2 text-sm text-foreground/60">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Loading your orders…
              </p>
            )}
          </section>

          {/* Rank ladder */}
          {stats && (
            <ol className="mt-4 flex items-center justify-between gap-1 px-1" aria-label="Rank ladder">
              {RANKS.map((rank) => {
                const reached = stats.packs >= rank.min;
                return (
                  <li key={rank.id} className={`flex flex-col items-center gap-1 ${reached ? "opacity-100" : "opacity-35"}`}>
                    <RankBadge rank={rank.id} className="w-9" />
                    <span className="text-[10px] tracking-wider text-foreground/70 uppercase">{rank.min}+</span>
                  </li>
                );
              })}
            </ol>
          )}

          {/* History */}
          <section className="mt-6">
            <h3 className="mb-3 text-xs font-medium tracking-[0.2em] text-foreground/60 uppercase">Order history</h3>
            {orders && orders.length === 0 && (
              <p className="liquid-glass rounded-2xl px-4 py-6 text-center text-sm text-foreground/60">No orders yet. Your first one lands here.</p>
            )}
            {orders && orders.length > 0 && (
              <ul className="space-y-3">
                {orders.map((order) => (
                  <li key={order.id} className="liquid-glass rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">
                        <span className="text-foreground/60 tabular-nums">#{order.number}</span> · {formatDate(order.createdAt)}
                      </p>
                      <StatusBadge status={order.status} />
                    </div>
                    {order.run && <p className="mt-1 text-xs font-medium tracking-wide text-accent/90">{order.run}</p>}
                    <p className="mt-2 text-sm text-foreground/80">{order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}</p>
                    <p className="mt-1 text-xs text-foreground/60 tabular-nums">
                      {packsIn(order)} {packsIn(order) === 1 ? "pack" : "packs"} · {formatCents(order.totalCents)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <footer className="border-t border-white/10 px-5 py-4 sm:px-6">
          <Button variant="glass" size="md" className="w-full" onClick={onSignOut}>
            <LogOut className="size-4" aria-hidden />
            Not {member.firstName}? Sign out
          </Button>
        </footer>
      </motion.div>
    </>
  );
}
