"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Hint, Input, Label, Textarea } from "@/components/ui/input";
import * as api from "@/lib/api";
import type { Order, Run, Settings } from "@/lib/types";
import { errorMessage, useAdmin } from "./session";

export function SettingsForm({ settings, runs, orders }: { settings: Settings; runs: Run[]; orders: Order[] }) {
  const { mutate } = useAdmin();
  const [form, setForm] = React.useState<api.SettingsInput>({
    storeName: settings.storeName,
    chapterName: settings.chapterName,
    tagline: settings.tagline,
    paymentInstructions: settings.paymentInstructions,
    storeOpen: settings.storeOpen,
    closedMessage: settings.closedMessage,
    accessCode: settings.accessCode ?? "",
    runName: settings.runName ?? "",
  });
  const [pending, setPending] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const set = <K extends keyof api.SettingsInput>(key: K, value: api.SettingsInput[K]) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await mutate(() => api.updateSettings(form));
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err, "Could not save settings."));
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2">
      <section className="liquid-glass rounded-3xl p-5 md:p-6">
        <h2 className="mb-5 text-lg tracking-tight">Store</h2>
        <div className="space-y-5">
          <div>
            <Label htmlFor="storeName">Store name</Label>
            <Input id="storeName" value={form.storeName} onChange={(e) => set("storeName", e.target.value)} required maxLength={60} />
          </div>
          <div>
            <Label htmlFor="chapterName">Chapter line</Label>
            <Input id="chapterName" value={form.chapterName} onChange={(e) => set("chapterName", e.target.value)} maxLength={80} />
            <Hint>Shown above the headline and in the footer.</Hint>
          </div>
          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Textarea id="tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={200} className="min-h-20" />
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={form.storeOpen} onChange={(e) => set("storeOpen", e.target.checked)} className="size-5 cursor-pointer accent-white" />
            Ordering is open
          </label>
          <div>
            <Label htmlFor="closedMessage">Message when closed</Label>
            <Input id="closedMessage" value={form.closedMessage} onChange={(e) => set("closedMessage", e.target.value)} maxLength={200} />
          </div>
        </div>
      </section>

      <section className="liquid-glass rounded-3xl p-5 md:p-6">
        <h2 className="mb-1 text-lg tracking-tight">Current order run</h2>
        <p className="mb-5 text-sm text-foreground/60">
          Name a run, set its code, share the code. Every order placed while it is active is filed under that name.
        </p>
        <div className="space-y-5">
          <div>
            <Label htmlFor="runName">Run name</Label>
            <Input id="runName" value={form.runName} onChange={(e) => set("runName", e.target.value)} required maxLength={60} placeholder="Fall Smth" />
            <Hint>Make it funny. This is what shows on every order in that run.</Hint>
          </div>
          <div>
            <Label htmlFor="accessCode">Access code for this run</Label>
            <Input id="accessCode" value={form.accessCode} onChange={(e) => set("accessCode", e.target.value)} required minLength={4} maxLength={40} autoCapitalize="none" autoComplete="off" />
            <Hint>
              Capitalization doesn&rsquo;t matter when they type it. A new code signs everyone out until they enter it.
              Who is allowed in at all is the Members page.
            </Hint>
          </div>
        </div>
        {runs.length > 0 && (
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="mb-3 text-xs font-medium tracking-[0.16em] text-foreground/60 uppercase">Run history</p>
            <ul className="divide-y divide-white/10 text-sm">
              {runs.map((run, i) => {
                const count = orders.filter((o) => o.run === run.name && o.status !== "cancelled").length;
                const packs = orders.filter((o) => o.run === run.name && o.status !== "cancelled").reduce((s, o) => s + o.items.reduce((t, it) => t + it.quantity, 0), 0);
                return (
                  <li key={`${run.name}-${run.startedAt}`} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {run.name}
                        {i === 0 && <span className="ml-2 rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success">current</span>}
                      </p>
                      <p className="text-xs text-foreground/50">
                        code <span className="font-mono text-foreground/70">{run.code}</span> · started{" "}
                        {new Date(run.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <p className="shrink-0 text-right text-xs text-foreground/60 tabular-nums">
                      {count} {count === 1 ? "order" : "orders"}
                      <br />
                      {packs} {packs === 1 ? "pack" : "packs"}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <section className="liquid-glass rounded-3xl p-5 md:p-6">
        <h2 className="mb-5 text-lg tracking-tight">Payment</h2>
        <div>
          <Label htmlFor="paymentInstructions">How to pay</Label>
          <Textarea
            id="paymentInstructions"
            value={form.paymentInstructions}
            onChange={(e) => set("paymentInstructions", e.target.value)}
            required
            maxLength={600}
            className="min-h-40"
          />
          <Hint>
            Shown at checkout right before the screenshot upload, and in the How it works section. Put the Venmo /
            Zelle / Cash App handle here and ask people to include their name in the note.
          </Hint>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? "Saving…" : "Save settings"}
        </Button>
        {saved && (
          <span role="status" className="inline-flex items-center gap-1.5 text-sm text-success">
            <Check className="size-4" aria-hidden />
            Saved
          </span>
        )}
        <FieldError>{error}</FieldError>
      </div>
    </form>
  );
}
