"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Hint, Input, Label, Textarea } from "@/components/ui/input";
import * as api from "@/lib/api";
import type { Settings } from "@/lib/types";
import { errorMessage, useAdmin } from "./session";

export function SettingsForm({ settings }: { settings: Settings }) {
  const { mutate } = useAdmin();
  const [form, setForm] = React.useState<api.SettingsInput>({
    storeName: settings.storeName,
    chapterName: settings.chapterName,
    tagline: settings.tagline,
    paymentInstructions: settings.paymentInstructions,
    storeOpen: settings.storeOpen,
    closedMessage: settings.closedMessage,
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
