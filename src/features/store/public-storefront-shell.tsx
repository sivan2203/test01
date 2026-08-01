import type { ReactNode } from "react";

import { GlassPanel } from "@/components/design-system";
import { getProductPriceLabel } from "@/features/product/schema";
import { cn } from "@/lib/utils";
import type { PublicCatalogItem } from "./public-catalog";
import { PublicStorefrontImage } from "./public-storefront-image";

export type BuyerFacingStoreProfile = {
  slug: string;
  name: string;
  avatarUrl?: string;
  description: string;
  additionalInfo: string;
};

type PublicStorefrontShellProps = {
  store: BuyerFacingStoreProfile;
  previewIndicator?: ReactNode;
  returnAction?: ReactNode;
  catalogItems?: PublicCatalogItem[];
};

export function PublicStorefrontShell({
  store,
  previewIndicator,
  returnAction,
  catalogItems = [],
}: PublicStorefrontShellProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6">
      {previewIndicator ? (
        <div className="rounded-full border border-border bg-surface-raised px-4 py-3 text-sm font-medium text-foreground shadow-sm">
          {previewIndicator}
        </div>
      ) : null}

      <GlassPanel className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <PublicStorefrontImage
            alt={`Фото магазина: ${store.name}`}
            className="h-20 w-20 shrink-0 rounded-full object-cover"
            fallbackClassName="h-20 w-20 shrink-0 rounded-full"
            fallbackLabel="Нет фото"
            src={store.avatarUrl}
          />
          <div className="min-w-0">
            <p className="break-all text-sm text-foreground/60">Витрина / {store.slug}</p>
            <h1 className="mt-2 break-words text-2xl font-semibold" id="store-name">
              {store.name}
            </h1>
          </div>
        </div>

        {store.description ? (
          <p className="mt-4 text-sm leading-6 text-foreground/70">
            {store.description}
          </p>
        ) : null}
        {store.additionalInfo ? (
          <p className="mt-3 text-sm leading-6 text-foreground/60">
            {store.additionalInfo}
          </p>
        ) : null}
      </GlassPanel>

      <GlassPanel className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-foreground/60">Каталог</p>
            <h2 className="mt-1 text-xl font-semibold" id="store-catalog">
              Товары магазина
            </h2>
          </div>
        </div>

        {catalogItems.length > 0 ? (
          <div aria-labelledby="store-catalog" className="mt-4 grid gap-4 sm:grid-cols-2">
            {catalogItems.map((item) => {
              const cover = item.media.find((media) => media.isCover) ?? item.media[0];
              const availabilityLabel =
                item.availabilityStatus === "out_of_stock"
                  ? "Нет в наличии"
                  : "В наличии";

              return (
                <article
                  className="overflow-hidden rounded-2xl border border-border bg-surface-raised"
                  key={item.id}
                >
                  <PublicStorefrontImage
                    alt={`Фото товара: ${item.title}`}
                    className="h-48 w-full object-cover"
                    fallbackClassName="h-48 w-full"
                    fallbackLabel="Нет фото"
                    src={cover?.url}
                  />
                  <div className="space-y-3 p-4">
                    <h3 className="break-words text-lg font-semibold">{item.title}</h3>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <span className="break-words font-medium">
                        {getProductPriceLabel(item.priceMode, item.priceAmount)}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs",
                          item.availabilityStatus === "out_of_stock"
                            ? "border-border text-foreground/60"
                            : "border-foreground/20 text-foreground/80",
                        )}
                      >
                        {availabilityLabel}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-border bg-surface-raised p-4 text-sm leading-6 text-foreground/70">
            Пока нет опубликованных товаров. Загляните позже.
          </p>
        )}
      </GlassPanel>

      {returnAction ? <div className="pb-2">{returnAction}</div> : null}
    </main>
  );
}
