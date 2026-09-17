import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-warning/15 text-warning",
  confirmed: "bg-success/15 text-success",
  delivered: "bg-info/15 text-info",
  cancelled: "bg-danger/15 text-danger",
};

export const statusLabels: Record<OrderStatus, string> = {
  pending: "Needs review",
  confirmed: "Paid",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        statusStyles[status],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}

export function Pill({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-foreground/80", className)}
      {...props}
    />
  );
}
