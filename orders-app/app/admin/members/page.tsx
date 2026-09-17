"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Loader2, Users } from "lucide-react";
import { Card, PageHeader } from "@/components/admin/primitives";
import { errorMessage, useAdmin } from "@/components/admin/session";
import { RankBadge } from "@/components/site/rank-badge";
import { Button } from "@/components/ui/button";
import { FieldError, Hint, Label, Textarea } from "@/components/ui/input";
import * as api from "@/lib/api";
import { formatCents } from "@/lib/money";
import { RANKS, ordersOf, statsFor } from "@/lib/ranks";
import type { Member } from "@/lib/types";

/*
  The allowed-names list, edited as plain text: one "First Last" per line. Saving
  replaces the whole list, so removing a line removes that brother's access.
*/

const toText = (members: Member[]) => members.map((m) => `${m.firstName} ${m.lastName}`).join("\n");

/** "First Middle Last" → first word is the first name, the rest is the last name. */
function parseLines(text: string): Member[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/[,\t]+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((line) => {
      const [firstName, ...rest] = line.split(" ");
      return { firstName, lastName: rest.join(" ") };
    })
    .filter((m) => m.firstName && m.lastName);
}

export default function MembersPage() {
  const { data, mutate } = useAdmin();
  const [text, setText] = React.useState(() => toText(data?.members ?? []));
  const [pending, setPending] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  if (!data) return null;

  const parsed = parseLines(text);
  const skipped = text.split(/\r?\n/).filter((l) => l.trim()).length - parsed.length;

  // Leaderboard: every brother on the list with their paid packs and rank, best first.
  const board = data.members
    .map((m) => {
      const mine = ordersOf(m, data.orders);
      const stats = statsFor(mine);
      const spentCents = mine.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.totalCents, 0);
      return { member: m, stats, spentCents };
    })
    .sort(
      (a, b) =>
        b.stats.packs - a.stats.packs ||
        b.stats.pendingPacks - a.stats.pendingPacks ||
        a.member.lastName.localeCompare(b.member.lastName),
    );

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await mutate(() => api.saveMembers(parsed));
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err, "Could not save the list."));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Members"
        title="Who can get in"
        description="Only these names get past the door (with the access code). Capitalization and extra spaces are ignored when they sign in."
      />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-5 md:p-6">
          <Label htmlFor="members">Allowed names — one per line</Label>
          <Textarea
            id="members"
            value={text}
            onChange={(e) => {
              setSaved(false);
              setText(e.target.value);
            }}
            spellCheck={false}
            className="min-h-[420px] font-mono text-sm leading-7"
            placeholder={"Tarokh Bani\nJohn Smith\nMike Van Der Berg"}
          />
          <Hint>
            First word is the first name, everything after it is the last name. Paste straight from a roster —
            commas and tabs are fine.
          </Hint>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {pending ? "Saving…" : "Save list"}
            </Button>
            {saved && (
              <span role="status" className="inline-flex items-center gap-1.5 text-sm text-success">
                <Check className="size-4" aria-hidden />
                Saved
              </span>
            )}
            <FieldError>{error}</FieldError>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5 md:p-6">
            <p className="text-xs font-medium tracking-[0.16em] text-foreground/60 uppercase">On the list</p>
            <p className="mt-3 flex items-center gap-2 text-3xl font-semibold tracking-tight tabular-nums">
              <Users className="size-6 text-foreground/60" aria-hidden />
              {data.members.length}
            </p>
            <p className="mt-2 text-sm text-foreground/60">
              {parsed.length !== data.members.length ? `${parsed.length} after you save` : "saved and live"}
              {skipped > 0 ? ` · ${skipped} line${skipped === 1 ? "" : "s"} missing a last name will be skipped` : ""}
            </p>
          </Card>
          <Card className="p-5 text-sm leading-relaxed text-foreground/70 md:p-6">
            Removing a name kicks that person out immediately — their browser goes back to the door next time it
            loads. The access code itself is under <span className="text-foreground">Settings</span>.
          </Card>
        </div>
      </form>

      <section className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl tracking-tight">Ranks</h2>
            <p className="mt-1 text-sm text-foreground/60">
              Packs from paid + delivered orders. Pending orders count once you mark them paid.
            </p>
          </div>
          <ul className="flex flex-wrap gap-3 text-xs text-foreground/60">
            {RANKS.map((r) => (
              <li key={r.id} className="flex items-center gap-1.5">
                <RankBadge rank={r.id} className="w-5" />
                {r.name} {r.min}+
              </li>
            ))}
          </ul>
        </div>
        {board.length === 0 ? (
          <Card className="px-6 py-10 text-center text-sm text-foreground/60">Add names above and they show up here.</Card>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs tracking-wider text-foreground/60 uppercase">
                  <th className="px-5 py-4 font-medium">Brother</th>
                  <th className="px-3 py-4 font-medium">Rank</th>
                  <th className="px-3 py-4 text-right font-medium">Packs</th>
                  <th className="px-3 py-4 text-right font-medium">Pending</th>
                  <th className="px-3 py-4 text-right font-medium">Orders</th>
                  <th className="px-3 py-4 text-right font-medium">Spent</th>
                  <th className="px-5 py-4 text-right font-medium">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {board.map(({ member, stats, spentCents }) => (
                  <tr key={`${member.firstName} ${member.lastName}`} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-5 py-3 font-medium">
                      {member.firstName} {member.lastName}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-2">
                        <RankBadge rank={stats.rank.id} className="w-7" />
                        {stats.rank.name}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">{stats.packs}</td>
                    <td className="px-3 py-3 text-right text-warning tabular-nums">{stats.pendingPacks || "-"}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{stats.orders}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatCents(spentCents)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/orders?q=${encodeURIComponent(`${member.firstName} ${member.lastName}`)}`}
                        className="inline-flex items-center gap-1 text-foreground/70 transition-colors hover:text-foreground"
                      >
                        Orders <ArrowUpRight className="size-4" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </>
  );
}
