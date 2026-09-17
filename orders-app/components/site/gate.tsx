"use client";

import * as React from "react";
import { motion } from "motion/react";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Hint, Input, Label } from "@/components/ui/input";
import { ApiError, memberLogin } from "@/lib/api";
import type { MemberSession } from "@/lib/types";
import { GreekMark } from "./greek-mark";

/*
  The door. Nothing behind it renders until a brother enters a name that is on the
  members list and the current access code. Capitalization and extra spaces do not
  matter; the backend answers with the name exactly as it is on the list.
*/

interface GateProps {
  onEnter: (session: MemberSession) => void;
  /** Shown above the form, e.g. when a saved session stopped working. */
  notice?: string | null;
}

export function Gate({ onEnter, notice }: GateProps) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      onEnter(await memberLogin(firstName, lastName, code));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden className="hero-atmosphere opacity-70" />
      <div aria-hidden className="glow-top absolute inset-0" />

      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="liquid-glass relative w-full max-w-sm rounded-3xl p-7 sm:p-8"
        noValidate
      >
        <div className="mb-6 text-accent">
          <GreekMark mode="draw" delay={0.2} className="w-[84px]" title="Lambda Chi Alpha" />
        </div>
        <p className="text-xs font-medium tracking-[0.28em] text-foreground/60 uppercase">Brothers only</p>
        <h1 className="mt-2 text-2xl tracking-tight">
          Who&rsquo;s <span className="font-serif italic text-foreground/80">ordering</span>?
        </h1>
        <p className="mt-2 text-sm text-foreground/70">Your name as the chapter has it, plus the code from the group chat.</p>

        {notice && (
          <p role="status" className="mt-5 rounded-2xl bg-warning/10 px-4 py-3 text-xs leading-relaxed text-warning">
            {notice}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="gate-first">First name</Label>
            <Input
              id="gate-first"
              autoComplete="given-name"
              autoCapitalize="words"
              required
              maxLength={40}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={pending}
            />
          </div>
          <div>
            <Label htmlFor="gate-last">Last name</Label>
            <Input
              id="gate-last"
              autoComplete="family-name"
              autoCapitalize="words"
              required
              maxLength={40}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={pending}
            />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="gate-code">Access code</Label>
          <Input
            id="gate-code"
            type="password"
            autoComplete="off"
            autoCapitalize="none"
            required
            maxLength={40}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={pending}
            aria-describedby={error ? "gate-error" : "gate-hint"}
          />
          <Hint id="gate-hint">Capitalization doesn&rsquo;t matter.</Hint>
          <FieldError id="gate-error">{error}</FieldError>
        </div>

        <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending || !firstName.trim() || !lastName.trim() || !code.trim()}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <KeyRound className="size-4" aria-hidden />}
          {pending ? "Checking…" : "Enter"}
        </Button>
        <p className="mt-4 text-center text-xs text-foreground/50">This browser will remember you.</p>
      </motion.form>
    </main>
  );
}
