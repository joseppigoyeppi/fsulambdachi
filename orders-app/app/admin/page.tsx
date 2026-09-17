"use client";

import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Card, EmptyState, PageHeader, StatCard, formatDate } from "@/components/admin/primitives";
import { useAdmin } from "@/components/admin/session";
import { downloadOrdersCsv } from "@/lib/csv";
import { formatCents } from "@/lib/money";
import { productStats, summarize } from "@/lib/stats";

export default function AdminDashboard() {
  const { data } = useAdmin();
  if (!data) return null;
  const { orders, products } = data;
  const summary = summarize(orders);
  const stats = productStats(orders, products);
  const recent = orders.slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="The count"
        description="Everything that has been ordered, who still needs a payment check, and what to buy."
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total orders" value={String(summary.orders)} detail={`${summary.units} packs total`} />
        <StatCard
          label="Needs review"
          value={String(summary.pending)}
          detail={`${formatCents(summary.pendingCents)} unverified`}
          tone={summary.pending > 0 ? "warning" : "default"}
        />
        <StatCard label="Collected" value={formatCents(summary.collectedCents)} detail="Paid + delivered" tone="success" />
        <StatCard label="Delivered" value={String(summary.delivered)} detail={`${summary.cancelled} cancelled`} />
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl tracking-tight">Total of each product</h2>
          <p className="text-xs text-foreground/60">Cancelled orders are not counted</p>
        </div>
        {stats.length === 0 ? (
          <EmptyState
            title="No products yet"
            action={
              <Link href="/admin/products" className="text-sm underline underline-offset-4">
                Add one
              </Link>
            }
          />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs tracking-wider text-foreground/60 uppercase">
                  <th className="px-5 py-4 font-medium">Product</th>
                  <th className="px-3 py-4 text-right font-medium">Review</th>
                  <th className="px-3 py-4 text-right font-medium">Paid</th>
                  <th className="px-3 py-4 text-right font-medium">Delivered</th>
                  <th className="px-3 py-4 text-right font-medium">Total</th>
                  <th className="px-5 py-4 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {stats.map((stat) => (
                  <tr key={stat.productId} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5">
                      <p className="font-medium">{stat.name}</p>
                      <p className="text-xs text-foreground/60">{stat.brand}</p>
                    </td>
                    <td className="px-3 py-3.5 text-right text-warning tabular-nums">{stat.byStatus.pending || "-"}</td>
                    <td className="px-3 py-3.5 text-right text-success tabular-nums">{stat.byStatus.confirmed || "-"}</td>
                    <td className="px-3 py-3.5 text-right text-info tabular-nums">{stat.byStatus.delivered || "-"}</td>
                    <td className="px-3 py-3.5 text-right font-semibold tabular-nums">{stat.units}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums">{formatCents(stat.revenueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl tracking-tight">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-sm text-foreground/70 transition-colors hover:text-foreground"
          >
            All orders <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState title="No orders yet" body="Orders show up here the moment a brother submits one." />
        ) : (
          <Card className="divide-y divide-white/10">
            {recent.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders?id=${order.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03]"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    <span className="text-foreground/60 tabular-nums">#{order.number}</span> {order.fullName}
                  </p>
                  <p className="truncate text-xs text-foreground/60">
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold tabular-nums">{formatCents(order.totalCents)}</span>
                  <StatusBadge status={order.status} />
                </div>
              </Link>
            ))}
          </Card>
        )}
      </section>
    </>
  );
}
