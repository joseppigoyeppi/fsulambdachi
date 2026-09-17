"use client";

import * as React from "react";
import { Check, ImagePlus, Loader2, PartyPopper, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Hint, Input, Label, Textarea } from "@/components/ui/input";
import { ApiError, fileToUpload, submitOrder, type SubmitOrderResult } from "@/lib/api";
import { formatCents } from "@/lib/money";
import type { Settings } from "@/lib/types";
import { useCart } from "./cart-context";

const MAX_BYTES = 10 * 1024 * 1024;

interface SubmitState extends Partial<SubmitOrderResult> {
  ok: boolean;
  error?: string;
}

export function CheckoutForm({ settings, onSuccess }: { settings: Settings; onSuccess?: () => void }) {
  const cart = useCart();
  const [state, setState] = React.useState<SubmitState>({ ok: false });
  const [pending, setPending] = React.useState(false);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [note, setNote] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const errorRef = React.useRef<HTMLDivElement>(null);
  const { clear } = cart;

  // The moment the order is accepted: empty the cart and let the drawer switch to its done state.
  React.useEffect(() => {
    if (!state.ok) return;
    clear();
    onSuccess?.();
  }, [state.ok, clear, onSuccess]);

  React.useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);

  // Object URLs are created in the change handler and released when replaced or on unmount.
  const previewRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const chooseFile = (candidate: File | null) => {
    setFileError(null);
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    let problem: string | null = null;
    if (candidate && !candidate.type.startsWith("image/")) {
      problem = "That file is not an image. Upload a PNG, JPG, or HEIC screenshot.";
    } else if (candidate && candidate.size > MAX_BYTES) {
      problem = "That screenshot is over 10 MB. Try a smaller one.";
    }
    if (!candidate || problem) {
      setFileError(problem);
      setFile(null);
      setPreview(null);
      return;
    }
    previewRef.current = URL.createObjectURL(candidate);
    setFile(candidate);
    setPreview(previewRef.current);
  };

  if (state.ok) {
    return (
      <div className="scroll-thin flex flex-1 flex-col overflow-y-auto px-5 py-6 sm:px-6">
        <div className="flex flex-col items-center py-6 text-center">
          <span className="liquid-glass mb-5 inline-flex size-16 items-center justify-center rounded-full">
            <PartyPopper className="size-7 text-accent" aria-hidden />
          </span>
          <p className="text-xs tracking-[0.2em] text-foreground/60 uppercase">You are all set</p>
          <h3 className="mt-3 font-serif text-5xl tracking-tight">#{state.orderNumber}</h3>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground/70">
            Thanks, {state.fullName?.split(" ")[0]}. We will confirm once the payment is checked. Screenshot this page
            if you want a receipt.
          </p>
        </div>
        <ul className="mt-2 divide-y divide-white/10 rounded-2xl bg-white/[0.03] px-4">
          {state.items?.map((item) => (
            <li key={item.productId} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span className="min-w-0 truncate">
                <span className="text-foreground/60">{item.quantity} x</span> {item.name}
              </span>
              <span className="shrink-0 tabular-nums">{formatCents(item.unitPriceCents * item.quantity)}</span>
            </li>
          ))}
          <li className="flex items-center justify-between py-3 font-semibold">
            <span>Total paid</span>
            <span className="tabular-nums">{formatCents(state.totalCents ?? 0)}</span>
          </li>
        </ul>
        <Button size="lg" className="mt-6 w-full" onClick={cart.close}>
          Done
        </Button>
      </div>
    );
  }

  // Fields are controlled state, so a validation error from the backend never wipes
  // the typed name or the chosen screenshot.
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    if (!file) {
      setFileError("Add a screenshot of your payment.");
      return;
    }
    setPending(true);
    try {
      const result = await submitOrder({
        firstName,
        lastName,
        note,
        items: cart.lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        screenshot: await fileToUpload(file),
      });
      setState({ ok: true, ...result });
    } catch (err) {
      setState({ ok: false, error: err instanceof ApiError ? err.message : "Something went wrong saving your order. Try again in a second." });
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>

      <div className="scroll-thin flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        {state.error && (
          <div
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger outline-none"
          >
            {state.error}
          </div>
        )}

        <section className="liquid-glass rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Wallet className="size-4 text-accent" aria-hidden />
            Step 1 — Pay {formatCents(cart.totalCents)}
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/80">{settings.paymentInstructions}</p>
        </section>

        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-foreground/90">Your name</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName" className="sr-only">
                First name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                placeholder="First name"
                required
                maxLength={40}
                disabled={pending}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="sr-only">
                Last name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                placeholder="Last name"
                required
                maxLength={40}
                disabled={pending}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
          </div>
          <Hint>Both are required. Use the same name that is on your payment so we can match it.</Hint>
        </fieldset>

        <div>
          <Label htmlFor="screenshot">Payment screenshot</Label>
          <input
            ref={fileInputRef}
            id="screenshot"
            name="screenshot"
            type="file"
            accept="image/*"
            required
            className="sr-only"
            disabled={pending}
            onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
            aria-describedby={fileError ? "screenshot-error" : "screenshot-hint"}
          />
          {file && preview ? (
            <div className="relative overflow-hidden rounded-2xl border border-border bg-white/[0.03]">
              {/* eslint-disable-next-line @next/next/no-img-element -- object URL preview, not a static asset */}
              <img src={preview} alt="Your payment screenshot preview" className="max-h-72 w-full object-contain" />
              <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Check className="size-4 shrink-0 text-success" aria-hidden />
                  <span className="truncate">{file.name}</span>
                </span>
                <button
                  type="button"
                  className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-full px-3 text-xs text-foreground/70 transition-colors hover:bg-white/[0.06] hover:text-foreground"
                  onClick={() => {
                    chooseFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={pending}
                >
                  <X className="size-3.5" aria-hidden />
                  Replace
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={pending}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const dropped = event.dataTransfer.files?.[0] ?? null;
                if (dropped && fileInputRef.current) {
                  const transfer = new DataTransfer();
                  transfer.items.add(dropped);
                  fileInputRef.current.files = transfer.files;
                }
                chooseFile(dropped);
              }}
              className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-center transition-colors duration-200 ${
                dragging ? "border-foreground/70 bg-white/[0.06]" : "border-border bg-white/[0.02] hover:border-foreground/40 hover:bg-white/[0.04]"
              }`}
            >
              <ImagePlus className="size-6 text-foreground/70" aria-hidden />
              <span className="text-sm font-medium">Tap to upload your screenshot</span>
              <span id="screenshot-hint" className="text-xs text-muted-foreground">
                PNG, JPG, or HEIC · up to 10 MB
              </span>
            </button>
          )}
          <FieldError id="screenshot-error">{fileError}</FieldError>
        </div>

        <div>
          <Label htmlFor="note">
            Note <span className="font-normal text-foreground/50">(optional)</span>
          </Label>
          <Textarea
            id="note"
            name="note"
            placeholder="Anything we should know?"
            maxLength={500}
            disabled={pending}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      </div>

      <footer className="border-t border-white/10 px-5 py-4 sm:px-6">
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-sm text-foreground/70">
            {cart.count} {cart.count === 1 ? "item" : "items"}
          </span>
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatCents(cart.totalCents)}</span>
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={pending || cart.lines.length === 0 || !file || !firstName.trim() || !lastName.trim()}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Sending your order…
            </>
          ) : (
            "Submit order"
          )}
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          First name, last name, and screenshot are all required.
        </p>
      </footer>
    </form>
  );
}
