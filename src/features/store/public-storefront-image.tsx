/* eslint-disable @next/next/no-img-element */

"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type PublicStorefrontImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  fallbackLabel?: string;
};

export function PublicStorefrontImage({
  src,
  alt,
  className,
  fallbackClassName,
  fallbackLabel = "Нет фото",
}: PublicStorefrontImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasError = Boolean(src && failedSrc === src);

  if (!src || hasError) {
    return (
      <div
        aria-label={`${alt}. ${fallbackLabel}`}
        className={cn(
          "flex items-center justify-center border border-dashed border-border bg-surface-muted px-3 text-center text-xs text-foreground/55",
          fallbackClassName,
        )}
        role="img"
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    <img
      alt={alt}
      className={className}
      decoding="async"
      loading="lazy"
      onError={() => setFailedSrc(src ?? null)}
      src={src}
    />
  );
}
