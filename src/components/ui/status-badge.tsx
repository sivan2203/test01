import * as React from "react";

import { cn } from "@/lib/utils";

type StatusBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger";
};

export function StatusBadge({
  className,
  tone = "neutral",
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2 py-0.5 font-mono text-[0.6875rem] font-medium leading-4",
        tone === "neutral" && "border-border-strong bg-surface-raised text-ink-secondary",
        tone === "success" && "border-success/35 bg-success-surface text-success",
        tone === "warning" && "border-warning/35 bg-warning-surface text-warning",
        tone === "danger" && "border-destructive/35 bg-destructive-surface text-destructive",
        className,
      )}
      {...props}
    />
  );
}
