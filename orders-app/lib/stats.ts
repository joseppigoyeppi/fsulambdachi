import type { Order, OrderStatus, Product } from "./types";

/*
  Pure aggregation helpers for the admin dashboard. Cancelled orders are kept in
  history but excluded from every count and dollar figure.
*/

export interface ProductStat {
  productId: string;
  brand: string;
  name: string;
  byStatus: Record<OrderStatus, number>;
  units: number;
  revenueCents: number;
}

export interface Summary {
  orders: number;
  pending: number;
  confirmed: number;
  delivered: number;
  cancelled: number;
  units: number;
  /** Money from confirmed + delivered orders. */
  collectedCents: number;
  /** Money still waiting on a payment check. */
  pendingCents: number;
}

export function summarize(orders: Order[]): Summary {
  const summary: Summary = {
    orders: 0,
    pending: 0,
    confirmed: 0,
    delivered: 0,
    cancelled: 0,
    units: 0,
    collectedCents: 0,
    pendingCents: 0,
  };
  for (const order of orders) {
    summary[order.status] += 1;
    if (order.status === "cancelled") continue;
    summary.orders += 1;
    summary.units += order.items.reduce((sum, item) => sum + item.quantity, 0);
    if (order.status === "pending") summary.pendingCents += order.totalCents;
    else summary.collectedCents += order.totalCents;
  }
  return summary;
}

export function productStats(orders: Order[], products: Product[]): ProductStat[] {
  const stats = new Map<string, ProductStat>();
  const ensure = (id: string, brand: string, name: string) => {
    let stat = stats.get(id);
    if (!stat) {
      stat = {
        productId: id,
        brand,
        name,
        byStatus: { pending: 0, confirmed: 0, delivered: 0, cancelled: 0 },
        units: 0,
        revenueCents: 0,
      };
      stats.set(id, stat);
    }
    return stat;
  };
  for (const product of products) ensure(product.id, product.brand, product.name);
  for (const order of orders) {
    for (const item of order.items) {
      const stat = ensure(item.productId, item.brand, item.name);
      stat.byStatus[order.status] += item.quantity;
      if (order.status === "cancelled") continue;
      stat.units += item.quantity;
      stat.revenueCents += item.quantity * item.unitPriceCents;
    }
  }
  return Array.from(stats.values()).sort(
    (a, b) => b.units - a.units || a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name),
  );
}
