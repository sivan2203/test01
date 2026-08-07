import * as React from "react";

import { cn } from "@/lib/utils";

export function Surface({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface-raised text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Section({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn("border-t border-border py-6 text-foreground", className)}
      {...props}
    />
  );
}
