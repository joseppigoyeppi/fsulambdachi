"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Button that runs an async action and shows a spinner meanwhile. Errors are handed
 * to `onFail` (or shown in an alert) so a failed click never leaves the button stuck.
 */
export function ActionButton({
  action,
  onFail,
  confirm,
  children,
  ...props
}: ButtonProps & { action: () => Promise<unknown>; onFail?: (message: string) => void; confirm?: string }) {
  const [pending, setPending] = React.useState(false);
  return (
    <Button
      type="button"
      {...props}
      disabled={pending || props.disabled}
      aria-busy={pending}
      onClick={async () => {
        if (confirm && !window.confirm(confirm)) return;
        setPending(true);
        try {
          await action();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Something went wrong.";
          if (onFail) onFail(message);
          else window.alert(message);
        } finally {
          setPending(false);
        }
      }}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}
