import * as React from "react";

import { cn } from "@/lib/utils";

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "info" | "success" | "warning" | "danger";
  title?: string;
  titleAs?: "p" | "h1" | "h2" | "h3";
};

export function Alert({
  className,
  tone = "info",
  title,
  titleAs: Title = "p",
  children,
  ...props
}: AlertProps) {
  return (
    <div
      className={cn(
        "border-l-2 bg-surface-raised px-4 py-3 text-sm leading-6",
        tone === "info" && "border-primary",
        tone === "success" && "border-success bg-success-surface",
        tone === "warning" && "border-warning bg-warning-surface",
        tone === "danger" && "border-destructive bg-destructive-surface",
        className,
      )}
      role={tone === "danger" ? "alert" : "status"}
      {...props}
    >
      {title ? <Title className="font-semibold text-foreground">{title}</Title> : null}
      <div className={cn(title && "mt-1", tone === "danger" ? "text-destructive" : "text-ink-secondary")}>
        {children}
      </div>
    </div>
  );
}
