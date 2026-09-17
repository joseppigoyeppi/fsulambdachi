"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { endpoint } from "@/lib/api";
import { errorMessage, useAdmin } from "./session";

export function LoginScreen() {
  const { login } = useAdmin();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const configured = typeof window !== "undefined" && Boolean(endpoint());

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err) {
      setError(errorMessage(err, "Could not sign in."));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="hero-atmosphere opacity-60" />
      <div aria-hidden className="glow-top absolute inset-0" />
      <div className="relative flex w-full flex-col items-center gap-6">
        <form onSubmit={onSubmit} className="liquid-glass w-full max-w-sm rounded-3xl p-7 sm:p-8">
          <span className="liquid-glass mb-6 inline-flex size-12 items-center justify-center rounded-full">
            <LockKeyhole className="size-5" aria-hidden />
          </span>
          <h1 className="text-2xl tracking-tight">Chapter admin</h1>
          <p className="mt-2 text-sm text-foreground/70">One account. Orders, prices, and settings live behind this door.</p>
          {!configured && (
            <p role="status" className="mt-5 rounded-2xl bg-warning/10 px-4 py-3 text-xs leading-relaxed text-warning">
              The backend URL is not set in config.js yet, so signing in will not work.
            </p>
          )}
          <div className="mt-6">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
              aria-describedby={error ? "password-error" : undefined}
            />
            <FieldError id="password-error">{error}</FieldError>
          </div>
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {pending ? "Checking…" : "Sign in"}
          </Button>
        </form>
        <Link href="/" className="text-sm text-foreground/60 transition-colors hover:text-foreground">
          ← Back to the store
        </Link>
      </div>
    </main>
  );
}
