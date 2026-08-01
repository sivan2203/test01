"use client";

import { useMemo, useRef, useState, type TouchEvent } from "react";

import type { ProductMedia } from "@/features/product/media-schema";
import { cn } from "@/lib/utils";
import { PublicStorefrontImage } from "./public-storefront-image";

type PublicProductGalleryProps = {
  media: ProductMedia[];
  productTitle: string;
};

export function PublicProductGallery({
  media,
  productTitle,
}: PublicProductGalleryProps) {
  const orderedMedia = useMemo(
    () => [...media].sort((left, right) => left.sortOrder - right.sortOrder),
    [media],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const total = orderedMedia.length;

  if (total === 0) {
    return (
      <div
        aria-label={"Фото товара: " + productTitle + ". Нет фото"}
        className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted px-6 text-center text-sm text-foreground/60"
        role="img"
      >
        Нет фото
      </div>
    );
  }

  const renderIndex = Math.min(activeIndex, total - 1);
  const activeMedia = orderedMedia[renderIndex];

  function setIndex(nextIndex: number) {
    setActiveIndex(Math.min(Math.max(nextIndex, 0), total - 1));
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    touchStartX.current = touch?.clientX ?? null;
    touchStartY.current = touch?.clientY ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startX = touchStartX.current;
    const startY = touchStartY.current;
    const endX = event.changedTouches[0]?.clientX;
    const endY = event.changedTouches[0]?.clientY;
    touchStartX.current = null;
    touchStartY.current = null;

    if (
      startX === null ||
      startY === null ||
      endX === undefined ||
      endY === undefined
    ) {
      return;
    }

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    setIndex(renderIndex + (deltaX < 0 ? 1 : -1));
  }

  function handleTouchCancel() {
    touchStartX.current = null;
    touchStartY.current = null;
  }

  return (
    <section aria-label={"Галерея товара: " + productTitle} className="space-y-3">
      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-surface-muted"
        onTouchCancel={handleTouchCancel}
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
      >
        <PublicStorefrontImage
          alt={"Фото " + (renderIndex + 1) + " из " + total + ": " + productTitle}
          className="aspect-square w-full object-cover"
          fallbackClassName="flex aspect-square w-full items-center justify-center"
          fallbackLabel="Нет фото"
          src={activeMedia.url}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          aria-label="Предыдущая фотография"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-surface-raised text-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          disabled={renderIndex === 0}
          onClick={() => setIndex(renderIndex - 1)}
          type="button"
        >
          ‹
        </button>
        <p aria-live="polite" className="text-sm text-foreground/65">
          Фото {renderIndex + 1} из {total}
        </p>
        <button
          aria-label="Следующая фотография"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-surface-raised text-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          disabled={renderIndex === total - 1}
          onClick={() => setIndex(renderIndex + 1)}
          type="button"
        >
          ›
        </button>
      </div>

      {total > 1 ? (
        <div
          aria-label="Выбор фотографии"
          className="flex gap-2 overflow-x-auto pb-1"
          role="group"
        >
          {orderedMedia.map((item, index) => (
            <button
              aria-label={
                "Открыть фото " +
                (index + 1) +
                " из " +
                total +
                ": " +
                productTitle
              }
              aria-pressed={renderIndex === index}
              className={cn(
                "min-h-11 min-w-11 rounded-xl border-2 p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                renderIndex === index ? "border-ring" : "border-border",
              )}
              key={item.id}
              onClick={() => setIndex(index)}
              type="button"
            >
              <PublicStorefrontImage
                alt=""
                className="h-10 w-10 rounded-lg object-cover"
                fallbackClassName="h-10 w-10 rounded-lg"
                fallbackLabel="Нет фото"
                src={item.url}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
