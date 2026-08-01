/* eslint-disable @next/next/no-img-element */

"use client";

import { useState } from "react";

type ProductCoverProps = {
  src: string | null;
  title: string;
};

export function ProductCover({ src, title }: ProductCoverProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        aria-label={`У товара ${title} пока нет обложки`}
        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised px-2 text-center text-xs leading-4 text-foreground/55"
        role="img"
      >
        Нет фото
      </div>
    );
  }

  return (
    <img
      alt={`Обложка товара: ${title}`}
      className="h-20 w-20 shrink-0 rounded-xl object-cover"
      onError={() => setHasError(true)}
      src={src}
    />
  );
}
