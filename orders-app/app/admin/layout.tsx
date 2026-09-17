"use client";

import { Loader2 } from "lucide-react";
import { AdminShell } from "@/components/admin/shell";
import { LoginScreen } from "@/components/admin/login-form";
import { AdminSessionProvider, useAdmin } from "@/components/admin/session";

/*
  Every admin page is static HTML; this gate decides what to show once the browser
  knows whether a token exists: the login screen, or the shell with live data.
*/
function Gate({ children }: { children: React.ReactNode }) {
  const { authed, data, error } = useAdmin();
  if (authed === null) return null;
  if (!authed) return <LoginScreen />;
  if (!data) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        {error ? (
          <div role="alert" className="liquid-glass max-w-md rounded-2xl px-5 py-4 text-sm text-foreground/80">
            <p className="font-medium text-foreground">Could not load admin data.</p>
            <p className="mt-1 text-foreground/60">{error}</p>
          </div>
        ) : (
          <p role="status" className="inline-flex items-center gap-2 text-sm text-foreground/60">
            <Loader2 className="size-4 animate-spin" aria-hidden /> Loading orders…
          </p>
        )}
      </main>
    );
  }
  return <AdminShell storeName={data.settings.storeName}>{children}</AdminShell>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionProvider>
      <Gate>{children}</Gate>
    </AdminSessionProvider>
  );
}
