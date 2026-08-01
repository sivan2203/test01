import * as React from "react";

import { cn } from "@/lib/utils";

export function GlassPanel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-glass text-foreground shadow-sm backdrop-blur-xl motion-reduce:backdrop-blur-none forced-colors:shadow-none forced-colors:backdrop-blur-none",
        className,
      )}
      {...props}
    />
  );
}
