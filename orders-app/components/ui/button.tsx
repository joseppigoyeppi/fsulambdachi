import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "glass" | "ghost" | "danger" | "link" | "accent";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-white/90 active:bg-white/80 shadow-[0_8px_30px_rgba(255,255,255,0.12)]",
  glass: "liquid-glass text-foreground hover:bg-white/[0.06] active:bg-white/[0.09]",
  ghost: "text-foreground/80 hover:bg-white/[0.06] hover:text-foreground active:bg-white/[0.09]",
  danger: "bg-danger/15 text-danger hover:bg-danger/25 active:bg-danger/30",
  accent: "bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent/80",
  link: "h-auto p-0 text-foreground/80 underline-offset-4 hover:text-foreground hover:underline",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
  icon: "size-11",
  "icon-sm": "size-10",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** Pill button. Every size keeps a ≥40px hit area; primary/glass sizes are ≥44px. */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-[background-color,color,transform,opacity] duration-200 select-none",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[inherit]",
        variants[variant],
        variant !== "link" && sizes[size],
        className,
      )}
      {...props}
    />
  );
});
