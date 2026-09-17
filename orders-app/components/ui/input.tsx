import * as React from "react";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-2xl border border-border bg-white/[0.03] px-4 text-base text-foreground placeholder:text-foreground/40 transition-colors duration-200 hover:border-foreground/30 focus:border-foreground/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-50";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldClass, "h-12", className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(fieldClass, "min-h-24 py-3 leading-relaxed", className)} {...props} />;
  },
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={cn(fieldClass, "h-12 cursor-pointer bg-background", className)} {...props} />;
  },
);

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-2 block text-sm font-medium text-foreground/90", className)} {...props} />;
}

export function Hint({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-2 text-xs leading-relaxed text-muted-foreground", className)} {...props} />;
}

/** Inline error, announced to assistive tech. */
export function FieldError({ children, id }: { children?: React.ReactNode; id?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-2 flex items-start gap-2 text-sm text-danger">
      <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-danger" />
      <span>{children}</span>
    </p>
  );
}
