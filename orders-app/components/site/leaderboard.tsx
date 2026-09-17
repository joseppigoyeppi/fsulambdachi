"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Crown } from "lucide-react";
import { Eyebrow, Serif, reveal } from "@/components/glass";
import { ApiError, fetchLeaderboard } from "@/lib/api";
import { rankFor } from "@/lib/ranks";
import type { Leaderboard as LeaderboardData, LeaderboardEntry, MemberSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RankBadge } from "./rank-badge";

/*
  All-time top 10 by paid packs. Podium for the top three, a list for the rest,
  and a line for where the signed-in brother stands if he is not on it. The data
  never resets: it is every paid order in the sheet since the page went live.
*/

const norm = (v: string) => v.toLowerCase().replace(/\s+/g, " ").trim();

function isMe(entry: LeaderboardEntry, member: MemberSession) {
  return norm(entry.firstName) === norm(member.firstName) && norm(entry.lastName) === norm(member.lastName);
}

function Podium({ entry, place, me }: { entry: LeaderboardEntry; place: 1 | 2 | 3; me: boolean }) {
  const rank = rankFor(entry.packs);
  const height = { 1: "sm:pt-0", 2: "sm:pt-10", 3: "sm:pt-16" }[place];
  const size = { 1: "w-28 sm:w-36", 2: "w-24 sm:w-28", 3: "w-24 sm:w-28" }[place];
  return (
    <motion.li
      {...reveal({ y: 40, duration: 0.7, delay: place === 1 ? 0 : place * 0.1 })}
      className={cn("flex flex-col items-center", height, place === 1 && "order-first sm:order-none")}
    >
      <div className="relative">
        <RankBadge rank={rank.id} className={size} />
        {place === 1 && (
          <Crown className="absolute -top-4 left-1/2 size-7 -translate-x-1/2 text-accent drop-shadow-[0_0_12px_rgba(230,185,85,0.7)]" aria-hidden />
        )}
      </div>
      <p className="mt-2 font-serif text-4xl italic text-foreground/50">#{place}</p>
      <p className={cn("text-center text-base font-semibold tracking-tight", me && "text-accent")}>
        {entry.firstName} {entry.lastName}
        {me && <span className="ml-1 text-xs font-normal text-accent/80">(you)</span>}
      </p>
      <p className="text-sm text-foreground/60 tabular-nums">
        {entry.packs} {entry.packs === 1 ? "pack" : "packs"} · {rank.name}
      </p>
    </motion.li>
  );
}

export function Leaderboard({ member, refreshKey }: { member: MemberSession; refreshKey: number }) {
  const [data, setData] = React.useState<LeaderboardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetchLeaderboard()
      .then((d) => !cancelled && setData(d))
      .catch((err: unknown) => !cancelled && setError(err instanceof ApiError ? err.message : "Could not load the leaderboard."));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const top = data?.top ?? [];
  const podium = top.slice(0, 3);
  const rest = top.slice(3);
  const onBoard = data?.me && data.me.position <= 10;

  return (
    <section id="leaderboard" className="relative scroll-mt-6 overflow-hidden bg-background px-4 py-24 sm:px-6 md:py-36">
      <div aria-hidden className="glow-center absolute inset-0" />
      <div className="relative mx-auto max-w-5xl">
        <motion.div {...reveal({ y: 20 })} className="mb-12 md:mb-16">
          <Eyebrow className="mb-6">Leaderboard</Eyebrow>
          <h2 className="max-w-3xl text-4xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
            Top 10 <Serif className="text-foreground/70">drinkers</Serif>.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/70">
            Every paid pack since day one. This board never resets, so the number only goes up.
          </p>
        </motion.div>

        {error && (
          <p role="alert" className="liquid-glass rounded-3xl px-6 py-8 text-center text-sm text-foreground/70">
            {error}
          </p>
        )}

        {data && top.length === 0 && (
          <motion.p {...reveal({ y: 30 })} className="liquid-glass rounded-3xl px-6 py-12 text-center text-foreground/70">
            Nobody on the board yet. The first paid order takes <span className="text-foreground">#1</span>.
          </motion.p>
        )}

        {podium.length > 0 && (
          <ol className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:items-end" aria-label="Top three">
            {podium[1] && <Podium entry={podium[1]} place={2} me={isMe(podium[1], member)} />}
            <Podium entry={podium[0]} place={1} me={isMe(podium[0], member)} />
            {podium[2] && <Podium entry={podium[2]} place={3} me={isMe(podium[2], member)} />}
          </ol>
        )}

        {rest.length > 0 && (
          <motion.ol {...reveal({ y: 30 })} start={4} className="liquid-glass mt-10 divide-y divide-white/10 rounded-3xl" aria-label="Places four to ten">
            {rest.map((entry, i) => {
              const rank = rankFor(entry.packs);
              const me = isMe(entry, member);
              return (
                <li key={`${entry.firstName}-${entry.lastName}`} className={cn("flex items-center gap-4 px-5 py-3.5", me && "bg-accent/10")}>
                  <span className="w-8 font-serif text-2xl italic text-foreground/50">#{i + 4}</span>
                  <RankBadge rank={rank.id} className="w-8 shrink-0" />
                  <span className={cn("min-w-0 flex-1 truncate font-medium", me && "text-accent")}>
                    {entry.firstName} {entry.lastName}
                    {me && <span className="ml-1 text-xs font-normal text-accent/80">(you)</span>}
                  </span>
                  <span className="text-sm text-foreground/60 tabular-nums">
                    {entry.packs} {entry.packs === 1 ? "pack" : "packs"}
                  </span>
                </li>
              );
            })}
          </motion.ol>
        )}

        {data && top.length > 0 && (
          <p className="mt-6 text-center text-sm text-foreground/60">
            {data.me && !onBoard
              ? `You're #${data.me.position} of ${data.totalBrothers} with ${data.me.packs} ${data.me.packs === 1 ? "pack" : "packs"}. Keep going.`
              : data.me
                ? `You're on the board. ${data.totalBrothers} brothers have paid orders.`
                : `${data.totalBrothers} brothers on the board. Your first paid order puts you on it.`}
          </p>
        )}
      </div>
    </section>
  );
}
