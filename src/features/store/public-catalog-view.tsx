"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getProductPriceLabel } from "@/features/product/schema";
import { cn } from "@/lib/utils";
import type { ProductMedia } from "@/features/product/media-schema";
import type { PublicCatalogItem } from "./public-catalog";
import { PublicProductContactCta } from "./public-contact-cta";
import { PublicStorefrontImage } from "./public-storefront-image";
import {
  getPublicProductDetailHref,
  type PublicAttributionQuery,
} from "./public-attribution-links";

export const PUBLIC_CATALOG_VIEW_STORAGE_KEY =
  "personal-storefront:catalog-view:v1";

export type PublicCatalogViewMode = "grid" | "list";

export { getPublicProductDetailHref } from "./public-attribution-links";
export type { PublicAttributionQuery } from "./public-attribution-links";

type StorageReader = Pick<Storage, "getItem">;

export function parseStoredCatalogView(
  value: string | null | undefined,
): PublicCatalogViewMode | null {
  if (value === "grid" || value === "list") return value;
  return null;
}

export function readStoredCatalogView(
  storage?: StorageReader | null,
): PublicCatalogViewMode | null {
  if (!storage) return null;

  try {
    return parseStoredCatalogView(
      storage.getItem(PUBLIC_CATALOG_VIEW_STORAGE_KEY),
    );
  } catch {
    return null;
  }
}

export function getDefaultCatalogView(
  items: Pick<PublicCatalogItem, "media">[],
): PublicCatalogViewMode {
  return items.some((item) => item.media.length > 0) ? "grid" : "list";
}

type PublicProductCardProps = {
  item: PublicCatalogItem;
  storeSlug: string;
  contactConfigured: boolean;
  isPreview: boolean;
  attributionQuery?: PublicAttributionQuery;
  view: PublicCatalogViewMode;
};

function PublicProductCard({
  item,
  storeSlug,
  contactConfigured,
  isPreview,
  attributionQuery,
  view,
}: PublicProductCardProps) {
  const cover = item.media.find((media: ProductMedia) => media.isCover) ?? item.media[0];
  const detailHref = getPublicProductDetailHref(
    storeSlug,
    item.id,
    isPreview,
    attributionQuery,
  );
  const availabilityLabel =
    item.availabilityStatus === "out_of_stock" ? "Нет в наличии" : "В наличии";

  return (
    <article
      className={cn(
        "group border-t border-border pt-3",
        view === "list" && "grid grid-cols-[7rem_minmax(0,1fr)] gap-4 sm:grid-cols-[10rem_minmax(0,1fr)_13rem] sm:items-center",
      )}
    >
      <Link
        className={cn(
          "min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          view === "grid"
            ? "block"
            : "col-span-2 grid grid-cols-[7rem_minmax(0,1fr)] gap-4 rounded-sm sm:col-span-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center",
        )}
        href={detailHref}
      >
        <PublicStorefrontImage
          alt={`Фото товара: ${item.title}`}
          className={cn(
            "w-full rounded-sm object-cover transition-opacity group-hover:opacity-90",
            view === "grid" ? "aspect-[4/5]" : "aspect-square h-28 w-28 shrink-0 sm:h-40 sm:w-40",
          )}
          fallbackClassName={cn(
            "shrink-0 rounded-sm",
            view === "grid" ? "aspect-[4/5]" : "h-28 w-28 sm:h-40 sm:w-40",
          )}
          fallbackLabel="Нет фото"
          src={cover?.url}
        />
        <div className={cn("min-w-0 space-y-2 py-3", view === "list" && "self-center")}>
          <h3 className="break-words text-base font-semibold leading-6 text-foreground sm:text-lg">
            {item.title}
          </h3>
          <p className="break-words text-sm font-medium text-foreground">
            {getProductPriceLabel(item.priceMode, item.priceAmount)}
          </p>
          <p className="font-mono text-[0.6875rem] leading-5 text-ink-secondary">{availabilityLabel}</p>
        </div>
      </Link>
      <div
        className={cn(
          "pb-4",
          view === "list" && "col-span-2 sm:col-span-1 sm:self-center sm:pb-0",
        )}
      >
        <PublicProductContactCta
          className="w-full"
          contactConfigured={contactConfigured}
          isPreview={isPreview}
          productId={item.id}
          productTitle={item.title}
          storeSlug={storeSlug}
        />
      </div>
    </article>
  );
}

type PublicCatalogViewProps = {
  catalogItems: PublicCatalogItem[];
  storeSlug: string;
  contactConfigured: boolean;
  isPreview?: boolean;
  attributionQuery?: PublicAttributionQuery;
};

export function PublicCatalogView({
  catalogItems,
  storeSlug,
  contactConfigured,
  isPreview = false,
  attributionQuery,
}: PublicCatalogViewProps) {
  const [view, setView] = useState<PublicCatalogViewMode>(() =>
    getDefaultCatalogView(catalogItems),
  );
  useEffect(() => {
    let storedView: PublicCatalogViewMode | null = null;
    try {
      storedView = readStoredCatalogView(window.localStorage);
    } catch {
      storedView = null;
    }

    if (storedView) {
      queueMicrotask(() => setView(storedView));
    }
  }, []);

  function handleViewChange(nextView: PublicCatalogViewMode) {
    setView(nextView);
    try {
      window.localStorage.setItem(PUBLIC_CATALOG_VIEW_STORAGE_KEY, nextView);
    } catch {
      // Private browsing and storage policy errors must not break the catalog.
    }
  }

  if (catalogItems.length === 0) {
    return (
      <section className="border-y border-border py-10">
        <p className="font-mono text-xs text-ink-secondary">КАТАЛОГ / 00</p>
        <h3 className="mt-2 text-xl font-semibold">Опубликованных товаров пока нет</h3>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">Загляните позже — сама витрина уже работает.</p>
      </section>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <p aria-live="polite" className="text-sm text-ink-secondary">
          Вид каталога: {view === "grid" ? "сетка" : "список"}
        </p>
        <div
          aria-label="Выберите вид каталога"
          className="inline-flex gap-4"
          role="group"
        >
          {(["grid", "list"] as const).map((mode) => {
            const isActive = mode === view;
            return (
              <Button
                aria-pressed={isActive}
                className={cn("relative min-w-16 rounded-none border-0 bg-transparent px-0 text-xs text-ink-secondary hover:bg-transparent hover:text-foreground", isActive && "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary")}
                key={mode}
                onClick={() => handleViewChange(mode)}
                size="compact"
                variant="ghost"
              >
                {mode === "grid" ? "Сетка" : "Список"}
              </Button>
            );
          })}
        </div>
      </div>

      <div
        aria-label={view === "grid" ? "Товары сеткой" : "Товары списком"}
        className={cn(
          "mt-5",
          view === "grid" ? "grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col gap-5",
        )}
      >
        {catalogItems.map((item) => (
          <PublicProductCard
            contactConfigured={contactConfigured}
            isPreview={isPreview}
            item={item}
            key={item.id}
            storeSlug={storeSlug}
            attributionQuery={attributionQuery}
            view={view}
          />
        ))}
      </div>
    </div>
  );
}
