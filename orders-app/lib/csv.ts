import { formatCents } from "./money";
import type { Order } from "./types";

function cell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** One CSV row per line item, built in the browser and handed to the user as a download. */
export function ordersToCsv(orders: Order[]): string {
  const header = ["Order #", "Placed", "First name", "Last name", "Status", "Brand", "Product", "Qty", "Unit price", "Line total", "Order total", "Note"];
  const rows = orders.flatMap((order) =>
    order.items.map((item) => [
      order.number,
      new Date(order.createdAt).toLocaleString("en-US"),
      order.firstName,
      order.lastName,
      order.status,
      item.brand,
      item.name,
      item.quantity,
      formatCents(item.unitPriceCents),
      formatCents(item.unitPriceCents * item.quantity),
      formatCents(order.totalCents),
      order.note,
    ]),
  );
  return [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
}

export function downloadOrdersCsv(orders: Order[]) {
  const blob = new Blob([`\uFEFF${ordersToCsv(orders)}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zeta-rho-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
