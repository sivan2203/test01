import * as React from "react";

import { cn } from "@/lib/utils";

export const fieldControlClassName =
  "min-h-11 w-full rounded-md border border-border-strong bg-surface-raised px-3.5 text-base text-foreground outline-none transition-colors placeholder:text-ink-disabled hover:border-foreground/55 focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-disabled";

type FieldProps = {
  htmlFor: string;
  label: string;
  helper?: React.ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Field({
  htmlFor,
  label,
  helper,
  error,
  optional,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="flex items-baseline justify-between gap-3 text-sm font-semibold" htmlFor={htmlFor}>
        <span>{label}</span>
        {optional ? (
          <span className="font-normal text-ink-secondary">необязательно</span>
        ) : (
          <span className="font-normal text-ink-secondary">обязательно</span>
        )}
      </label>
      {children}
      {error ? (
        <p className="text-sm leading-5 text-destructive" id={`${htmlFor}-error`} role="alert">
          {error}
        </p>
      ) : helper ? (
        <p className="text-sm leading-5 text-ink-secondary" id={`${htmlFor}-help`}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export function getFieldDescriptionId(id: string, error?: string) {
  return error ? `${id}-error` : `${id}-help`;
}
