import * as React from "react";

import { cn } from "@/lib/utils";

export function StatusMessage({
  className,
  error = false,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { error?: boolean }) {
  if (!children) return null;
  return (
    <p
      {...props}
      aria-live={error ? "assertive" : "polite"}
      className={cn("text-sm leading-6", error ? "text-destructive" : "text-ink-secondary", className)}
      role={error ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
