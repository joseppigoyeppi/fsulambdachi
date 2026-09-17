"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Download, Loader2, Search, X } from "lucide-react";
import { ActionButton } from "@/components/admin/pending-button";
import { Card, EmptyState, PageHeader, formatDate } from "@/components/admin/primitives";
import { useAdmin } from "@/components/admin/session";
import { StatusBadge, statusLabels } from "@/components/ui/badge";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import * as api from "@/lib/api";
import { downloadOrdersCsv } from "@/lib/csv";
import { formatCents } from "@/lib/money";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTERS: { key: "all" | OrderStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Needs review" },
  { key: "confirmed", label: "Paid" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const NEXT_ACTIONS: Record<OrderStatus, { status: OrderStatus; label: string; primary?: boolean }[]> = {
  pending: [
    { status: "confirmed", label: "Mark paid", primary: true },
    { status: "cancelled", label: "Cancel" },
  ],
  confirmed: [
    { status: "delivered", label: "Mark delivered", primary: true },
    { status: "pending", label: "Back to review" },
    { status: "cancelled", label: "Cancel" },
  ],
  delivered: [{ status: "confirmed", label: "Undo delivered" }],
  cancelled: [{ status: "pending", label: "Restore" }],
};

/** Case-insensitive match on name, order number (with or without #), or any item. */
function matchesQuery(order: Order, query: string): boolean {
  const needle = query.toLowerCase().replace(/^#/, "");
  const haystack = [order.fullName, order.firstName, order.lastName, String(order.number), ...order.items.map((i) => `${i.brand} ${i.name}`)]
    .join(" | ")
    .toLowerCase();
  return needle.split(/\s+/).every((part) => haystack.includes(part));
}

/** useSearchParams needs a Suspense boundary in a static export. */
export default function OrdersPage() {
  return (
    <React.Suspense fallback={null}>
      <OrdersView />
    </React.Suspense>
  );
}

function OrdersView() {
  const { data } = useAdmin();
  // ?id= opens an order (dashboard links), ?q= prefills the search (member leaderboard links).
  const params = useSearchParams();
  const initialId = params.get("id");
  const initialQuery = params.get("q") ?? "";
  const [filter, setFilter] = React.useState<"all" | OrderStatus>("all");
  const [run, setRun] = React.useState<string>("all");
  const [queryInput, setQueryInput] = React.useState(initialQuery);
  const [query, setQuery] = React.useState(initialQuery);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = selectedId ?? initialId;

  if (!data) return null;
  const orders = data.orders;
  const runNames = Array.from(new Set(orders.map((o) => o.run).filter(Boolean)));
  const inRun = run === "all" ? orders : orders.filter((o) => o.run === run);
  const matching = query ? inRun.filter((o) => matchesQuery(o, query)) : inRun;
  const counts = Object.fromEntries(FILTERS.map((f) => [f.key, 0])) as Record<string, number>;
  for (const order of matching) {
    counts.all += 1;
    counts[order.status] += 1;
  }
  const visible = filter === "all" ? matching : matching.filter((o) => o.status === filter);
  const selectedOrder = selected ? (orders.find((o) => o.id === selected) ?? null) : null;

  return (
    <>
      <PageHeader
        eyebrow="Orders"
        title="Who ordered what"
        description="Open an order to see the payment screenshot, then mark it paid once the money is in."
        actions={
          <button
            type="button"
            onClick={() => downloadOrdersCsv(orders)}
            className="liquid-glass inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-medium transition-colors hover:bg-white/[0.06]"
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </button>
        }
      />

      <form
        role="search"
        className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(queryInput.trim().slice(0, 80));
        }}
      >
        <div className="relative flex-1 sm:max-w-md">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-foreground/50" />
          <Label htmlFor="order-search" className="sr-only">
            Search orders by name
          </Label>
          <Input
            id="order-search"
            type="search"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Search by name, order #, or drink"
            autoComplete="off"
            enterKeyHint="search"
            className="pl-11"
          />
        </div>
        {runNames.length > 0 && (
          <div className="sm:w-56">
            <Label htmlFor="run-filter" className="sr-only">
              Order run
            </Label>
            <Select id="run-filter" value={run} onChange={(e) => setRun(e.target.value)} aria-label="Filter by order run">
              <option value="all">All runs</option>
              {runNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="inline-flex h-12 cursor-pointer items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-white/90"
          >
            Search
          </button>
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setQueryInput("");
              }}
              className="inline-flex h-12 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm text-foreground/70 transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
              Clear
            </button>
          )}
        </div>
      </form>
      {query && (
        <p role="status" className="mb-4 text-sm text-foreground/70">
          {counts.all === 0 ? "No orders" : counts.all === 1 ? "1 order" : `${counts.all} orders`} matching{" "}
          <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>
        </p>
      )}

      <div className="scroll-thin mb-6 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={cn(
              "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200",
              filter === f.key ? "bg-primary text-primary-foreground" : "liquid-glass text-foreground/80 hover:text-foreground",
            )}
          >
            {f.label}
            <span className={cn("text-xs tabular-nums", filter === f.key ? "opacity-70" : "text-foreground/50")}>{counts[f.key]}</span>
          </button>
        ))}
      </div>

      <div className={cn("grid gap-6", selectedOrder && "lg:grid-cols-[minmax(0,1fr)_400px]")}>
        {visible.length === 0 ? (
          <EmptyState
            title={query ? `Nothing for "${query}"` : filter === "all" ? "No orders yet" : `No ${statusLabels[filter as OrderStatus].toLowerCase()} orders`}
            body={query ? "Try just a first or last name, or an order number." : "Orders show up here the moment a brother submits one."}
          />
        ) : (
          <Card className="overflow-x-auto self-start">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs tracking-wider text-foreground/60 uppercase">
                  <th className="px-5 py-4 font-medium">Order</th>
                  <th className="px-3 py-4 font-medium">Items</th>
                  <th className="px-3 py-4 text-right font-medium">Total</th>
                  <th className="px-5 py-4 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {visible.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className={cn("cursor-pointer transition-colors hover:bg-white/[0.03]", selectedOrder?.id === order.id && "bg-white/[0.05]")}
                  >
                    <td className="px-5 py-3.5">
                      <button type="button" className="block cursor-pointer text-left" aria-label={`Open order #${order.number} ${order.fullName}`}>
                        <p className="font-medium">
                          <span className="text-foreground/60 tabular-nums">#{order.number}</span> {order.fullName}
                        </p>
                        <p className="text-xs text-foreground/60">
                          {formatDate(order.createdAt)}
                          {order.run && <span className="ml-2 text-accent/90">{order.run}</span>}
                        </p>
                      </button>
                    </td>
                    <td className="max-w-[260px] px-3 py-3.5 text-foreground/80">
                      <span className="line-clamp-2">{order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}</span>
                    </td>
                    <td className="px-3 py-3.5 text-right font-semibold tabular-nums">{formatCents(order.totalCents)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {selectedOrder && <OrderDetail key={selectedOrder.id} order={selectedOrder} onClose={() => setSelectedId("")} />}
      </div>
    </>
  );
}

function Screenshot({ order }: { order: Order }) {
  const [src, setSrc] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    api
      .fetchScreenshot(order.id)
      .then((r) => !cancelled && setSrc(r.dataUrl))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [order.id]);
  if (failed) return <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">Could not load the screenshot.</p>;
  if (!src) {
    return (
      <p className="inline-flex items-center gap-2 py-6 text-sm text-foreground/60">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Loading screenshot…
      </p>
    );
  }
  return (
    <a href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-border bg-white/[0.03]">
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the backend */}
      <img src={src} alt={`Payment screenshot from ${order.fullName}`} className="max-h-[420px] w-full object-contain" />
    </a>
  );
}

function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  const { mutate } = useAdmin();
  const [note, setNote] = React.useState(order.adminNote);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <Card className="self-start p-5 lg:sticky lg:top-24 md:p-6" aria-labelledby="order-detail-title">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.16em] text-foreground/60 uppercase">Order #{order.number}</p>
          <h2 id="order-detail-title" className="mt-1 text-2xl tracking-tight">
            {order.fullName}
          </h2>
          <p className="mt-1 text-xs text-foreground/60">
            {formatDate(order.createdAt)}
            {order.run && <span className="ml-2 text-accent/90">{order.run}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close order"
            className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <ul className="divide-y divide-white/10 rounded-2xl bg-white/[0.03] px-4">
        {order.items.map((item) => (
          <li key={item.productId} className="flex items-center justify-between gap-3 py-3 text-sm">
            <span className="min-w-0">
              <span className="text-foreground/60 tabular-nums">{item.quantity}x</span> {item.name}
              <span className="block text-xs text-foreground/50">{item.brand}</span>
            </span>
            <span className="shrink-0 tabular-nums">{formatCents(item.unitPriceCents * item.quantity)}</span>
          </li>
        ))}
        <li className="flex items-center justify-between py-3 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCents(order.totalCents)}</span>
        </li>
      </ul>

      {order.note && (
        <p className="mt-4 rounded-2xl bg-white/[0.03] px-4 py-3 text-sm text-foreground/80">
          <span className="text-xs tracking-wider text-foreground/50 uppercase">Note</span>
          <br />
          {order.note}
        </p>
      )}

      <div className="mt-5">
        <p className="mb-2 text-xs tracking-[0.16em] text-foreground/60 uppercase">Payment screenshot</p>
        <Screenshot order={order} />
        <p className="mt-2 text-xs text-foreground/50">Click to open full size.</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {NEXT_ACTIONS[order.status].map((action) => (
          <ActionButton
            key={action.status}
            size="sm"
            variant={action.primary ? "primary" : "glass"}
            action={() => mutate(() => api.setOrderStatus(order.id, action.status))}
            onFail={setError}
          >
            {action.label}
          </ActionButton>
        ))}
      </div>

      <div className="mt-6">
        <Label htmlFor="adminNote">Private note</Label>
        <Textarea id="adminNote" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. paid cash, picking up Friday" maxLength={500} className="min-h-20" />
        <div className="mt-3">
          <ActionButton size="sm" variant="glass" action={() => mutate(() => api.setOrderAdminNote(order.id, note))} onFail={setError}>
            Save note
          </ActionButton>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
        <p className="text-xs text-foreground/50">{ORDER_STATUSES.map((s) => statusLabels[s]).join(" · ")}</p>
        <ActionButton
          size="sm"
          variant="danger"
          confirm={`Delete order #${order.number} from ${order.fullName}? This also deletes the screenshot.`}
          action={async () => {
            await mutate(() => api.deleteOrder(order.id));
            onClose();
          }}
          onFail={setError}
        >
          Delete
        </ActionButton>
      </div>
    </Card>
  );
}
