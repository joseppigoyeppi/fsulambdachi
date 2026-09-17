import type { Member, Order } from "./types";

/*
  Ranks are earned with packs from orders the treasurer has marked paid (or delivered),
  so placing orders alone does nothing — the money has to be in.
*/

export type RankId = "bronze" | "silver" | "gold" | "platinum" | "alcoholic";

export interface Rank {
  id: RankId;
  name: string;
  /** Tongue-in-cheek subtitle shown under the badge. */
  blurb: string;
  /** Packs needed to reach this rank. */
  min: number;
}

export const RANKS: Rank[] = [
  { id: "bronze", name: "Bronze", blurb: "Just getting started", min: 0 },
  { id: "silver", name: "Silver", blurb: "A regular", min: 10 },
  { id: "gold", name: "Gold", blurb: "Carries the pregame", min: 30 },
  { id: "platinum", name: "Platinum", blurb: "Chapter legend", min: 60 },
  { id: "alcoholic", name: "Alcoholic", blurb: "Beyond help (affectionately)", min: 100 },
];

export function rankFor(packs: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) if (packs >= rank.min) current = rank;
  return current;
}

export function nextRank(packs: number): Rank | null {
  return RANKS.find((rank) => rank.min > packs) ?? null;
}

export interface MemberStats {
  /** Packs from paid + delivered orders. */
  packs: number;
  /** Packs sitting in orders that still need a payment check. */
  pendingPacks: number;
  orders: number;
  rank: Rank;
  next: Rank | null;
  /** 0..1 progress from the current rank to the next. */
  progress: number;
}

export const packsIn = (order: Order) => order.items.reduce((sum, item) => sum + item.quantity, 0);

export function statsFor(orders: Order[]): MemberStats {
  let packs = 0;
  let pendingPacks = 0;
  let count = 0;
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    count += 1;
    if (order.status === "pending") pendingPacks += packsIn(order);
    else packs += packsIn(order);
  }
  const rank = rankFor(packs);
  const next = nextRank(packs);
  const progress = next ? (packs - rank.min) / (next.min - rank.min) : 1;
  return { packs, pendingPacks, orders: count, rank, next, progress };
}

const norm = (v: string) => v.toLowerCase().replace(/\s+/g, " ").trim();

/** Orders that belong to a member: names match ignoring case and spacing. */
export function ordersOf(member: Member, orders: Order[]): Order[] {
  const first = norm(member.firstName);
  const last = norm(member.lastName);
  return orders.filter((o) => norm(o.firstName) === first && norm(o.lastName) === last);
}
