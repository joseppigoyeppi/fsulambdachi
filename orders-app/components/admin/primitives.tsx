import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-3 text-xs font-medium tracking-[0.2em] text-foreground/60 uppercase">{eyebrow}</p>
        <h1 className="text-3xl tracking-tight md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-foreground/70">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("liquid-glass rounded-3xl", className)} {...props} />;
}

export function StatCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "warning" | "success";
}) {
  const tones = { default: "text-foreground", warning: "text-warning", success: "text-success" };
  return (
    <Card className="p-5 md:p-6">
      <p className="text-xs font-medium tracking-[0.16em] text-foreground/60 uppercase">{label}</p>
      <p className={cn("mt-3 text-3xl font-semibold tracking-tight tabular-nums md:text-4xl", tones[tone])}>{value}</p>
      {detail && <p className="mt-2 text-sm text-foreground/60">{detail}</p>}
    </Card>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center px-6 py-14 text-center">
      <p className="text-lg font-medium">{title}</p>
      {body && <p className="mt-2 max-w-sm text-sm text-foreground/60">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </Card>
  );
}

/** Pill-tab link row, used for order status filters. */
export function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors duration-200",
        active ? "bg-primary text-primary-foreground" : "liquid-glass text-foreground/80 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
