"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { useAdmin } from "./session";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/settings", label: "Settings" },
] as const;

export function AdminShell({ storeName, children }: { storeName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAdmin();
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
        <nav className="glass-strong mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full py-2 pr-2 pl-5">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/admin" className="flex shrink-0 items-center gap-2" aria-label="Admin home">
              <span aria-hidden className="font-serif text-2xl leading-none">ΛΧΑ</span>
              <span className="hidden text-sm font-semibold sm:inline">{storeName}</span>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-accent uppercase">
                Admin
              </span>
            </Link>
            <ul className="scroll-thin flex items-center gap-1 overflow-x-auto">
              {LINKS.map((link) => {
                const path = pathname.replace(/\/$/, "") || "/";
                const active = link.href === "/admin" ? path === "/admin" : path.startsWith(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex h-10 items-center rounded-full px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-200",
                        active ? "bg-white/10 text-foreground" : "text-foreground/70 hover:bg-white/[0.06] hover:text-foreground",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm text-foreground/70 transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              <span className="hidden sm:inline">View store</span>
              <ExternalLink className="size-4" aria-hidden />
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm text-foreground/70 transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-6">{children}</main>
    </div>
  );
}
