import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md border border-transparent text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-button-primary text-button-primary-foreground hover:bg-button-primary-hover hover:text-button-primary-hover-foreground",
        secondary:
          "border-border-strong bg-surface-raised text-foreground hover:bg-surface-muted",
        telegram:
          "bg-button-primary text-button-primary-foreground hover:bg-button-primary-hover hover:text-button-primary-hover-foreground",
        ghost: "text-foreground hover:bg-surface-muted",
        destructive:
          "border-destructive/45 bg-surface-raised text-destructive hover:bg-destructive-surface",
      },
      size: {
        default: "h-11 px-5",
        compact: "h-11 px-4",
        lg: "min-h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { buttonVariants };
