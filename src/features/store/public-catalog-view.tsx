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

export const PUBLIC_CATALOG_VIEW_STORAGE_KEY =
  "personal-storefront:catalog-view:v1";

export type PublicCatalogViewMode = "grid" | "list";

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

export function getPublicProductDetailHref(
  storeSlug: string,
  productId: string,
  isPreview = false,
) {
  const href = `/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(productId)}`;
  return isPreview ? `${href}?preview=1` : href;
}

type PublicProductCardProps = {
  item: PublicCatalogItem;
  storeSlug: string;
  contactConfigured: boolean;
  isPreview: boolean;
  view: PublicCatalogViewMode;
};

function PublicProductCard({
  item,
  storeSlug,
  contactConfigured,
  isPreview,
  view,
}: PublicProductCardProps) {
  const cover = item.media.find((media: ProductMedia) => media.isCover) ?? item.media[0];
  const detailHref = getPublicProductDetailHref(storeSlug, item.id, isPreview);
  const availabilityLabel =
    item.availabilityStatus === "out_of_stock" ? "Нет в наличии" : "В наличии";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-surface-raised",
        view === "list" && "sm:flex sm:items-stretch",
      )}
    >
      <Link
        className={cn(
          "group min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          view === "grid" ? "block" : "flex flex-1 items-stretch",
        )}
        href={detailHref}
      >
        <PublicStorefrontImage
          alt={`Фото товара: ${item.title}`}
          className={cn(
            "w-full object-cover transition-opacity group-hover:opacity-90",
            view === "grid" ? "h-40 sm:h-48" : "h-32 w-32 shrink-0 sm:h-40 sm:w-40",
          )}
          fallbackClassName={cn(
            "shrink-0",
            view === "grid" ? "h-40 sm:h-48" : "h-32 w-32 sm:h-40 sm:w-40",
          )}
          fallbackLabel="Нет фото"
          src={cover?.url}
        />
        <div className={cn("min-w-0 space-y-2 p-4", view === "list" && "flex-1")}>
          <h3 className="break-words text-base font-semibold leading-6 text-foreground">
            {item.title}
          </h3>
          <p className="break-words text-sm font-medium text-foreground">
            {getProductPriceLabel(item.priceMode, item.priceAmount)}
          </p>
          <p className="text-sm leading-5 text-foreground/65">{availabilityLabel}</p>
        </div>
      </Link>
      <div
        className={cn(
          "p-4 pt-0",
          view === "list" && "sm:flex sm:w-48 sm:items-center sm:pt-4",
        )}
      >
        <PublicProductContactCta
          className="w-full"
          contactConfigured={contactConfigured}
          isPreview={isPreview}
          productId={item.id}
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
};

export function PublicCatalogView({
  catalogItems,
  storeSlug,
  contactConfigured,
  isPreview = false,
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
      <p className="mt-4 rounded-2xl border border-border bg-surface-raised p-4 text-sm leading-6 text-foreground/70">
        Пока нет опубликованных товаров. Загляните позже.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-foreground/60">
          Вид каталога: {view === "grid" ? "сетка" : "список"}
        </p>
        <div
          aria-label="Выберите вид каталога"
          className="inline-flex rounded-full border border-border bg-surface-raised p-1"
          role="group"
        >
          {(["grid", "list"] as const).map((mode) => {
            const isActive = mode === view;
            return (
              <Button
                aria-pressed={isActive}
                className={cn(
                  "min-w-20 px-3 text-xs",
                  isActive && "font-semibold ring-2 ring-ring ring-offset-1",
                )}
                key={mode}
                onClick={() => handleViewChange(mode)}
                size="compact"
                variant={isActive ? "primary" : "ghost"}
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
          "mt-4",
          view === "grid" ? "grid grid-cols-2 gap-3 sm:gap-4" : "flex flex-col gap-4",
        )}
      >
        {catalogItems.map((item) => (
          <PublicProductCard
            contactConfigured={contactConfigured}
            isPreview={isPreview}
            item={item}
            key={item.id}
            storeSlug={storeSlug}
            view={view}
          />
        ))}
      </div>
    </div>
  );
}
