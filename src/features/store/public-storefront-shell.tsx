import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { PublicCatalogItem } from "./public-catalog";
import { PublicCatalogView, type PublicAttributionQuery } from "./public-catalog-view";
import { PublicStorefrontImage } from "./public-storefront-image";

export type BuyerFacingStoreProfile = {
  slug: string;
  name: string;
  avatarUrl?: string;
  contactConfigured: boolean;
  description: string;
  additionalInfo: string;
};

type PublicStorefrontShellProps = {
  store: BuyerFacingStoreProfile;
  previewIndicator?: ReactNode;
  returnAction?: ReactNode;
  catalogItems?: PublicCatalogItem[];
  isPreview?: boolean;
  analyticsBeacon?: ReactNode;
  attributionQuery?: PublicAttributionQuery;
};

export function PublicStorefrontShell({
  store,
  previewIndicator,
  returnAction,
  catalogItems = [],
  isPreview = false,
  analyticsBeacon,
  attributionQuery,
}: PublicStorefrontShellProps) {
  const Root = isPreview ? "div" : "main";

  return (
    <Root
      className={cn(
        "mx-auto min-h-dvh w-full max-w-[90rem]",
        isPreview ? "px-0 py-2 sm:px-2 sm:py-4" : "px-4 py-6 sm:px-8 sm:py-8",
      )}
      id={isPreview ? undefined : "main-content"}
      tabIndex={isPreview ? undefined : -1}
    >
      {analyticsBeacon}
      {previewIndicator ? (
        <div className="mb-6 border-l-2 border-primary bg-surface-raised px-4 py-3 text-sm font-semibold" role="status">
          {previewIndicator}
        </div>
      ) : null}

      <header className="grid gap-8 border-b border-border-strong pb-10 pt-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)] lg:items-end lg:pb-14 lg:pt-10">
        <div>
          <div className="flex items-center gap-4">
            <PublicStorefrontImage
              alt={`Фото магазина: ${store.name}`}
              className="h-16 w-16 shrink-0 rounded-md object-cover sm:h-20 sm:w-20"
              fallbackClassName="h-16 w-16 shrink-0 rounded-md sm:h-20 sm:w-20"
              fallbackLabel="Нет фото"
              src={store.avatarUrl}
            />
            <p className="font-mono text-xs text-primary">01 / {store.slug}</p>
          </div>
          <h1 className="mt-7 max-w-5xl break-words text-[clamp(3rem,8vw,7rem)] font-bold leading-[0.9] tracking-[-0.065em]" id="store-name">
            {store.name}
          </h1>
        </div>
        <div className="border-t-[3px] border-foreground pt-4">
          {store.description ? <p className="whitespace-pre-wrap break-words text-lg leading-7">{store.description}</p> : null}
          {store.additionalInfo ? <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-ink-secondary">{store.additionalInfo}</p> : null}
          {!store.contactConfigured ? <p className="mt-4 font-mono text-xs text-warning">КОНТАКТ ПОКА НЕ НАСТРОЕН</p> : null}
        </div>
      </header>

      <section className="py-10 sm:py-14" aria-labelledby="store-catalog">
        <div className="flex flex-wrap items-end justify-between gap-4 border-t-[3px] border-foreground py-4">
          <div>
            <p className="font-mono text-xs text-ink-secondary">КАТАЛОГ / {String(catalogItems.length).padStart(2, "0")}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight" id="store-catalog">Товары магазина</h2>
          </div>
        </div>

        <PublicCatalogView
          attributionQuery={attributionQuery}
          catalogItems={catalogItems}
          contactConfigured={store.contactConfigured}
          isPreview={isPreview}
          storeSlug={store.slug}
        />
      </section>

      {returnAction ? <div className="border-t border-border py-6">{returnAction}</div> : null}
      <footer className="border-t border-border py-5 font-mono text-[0.6875rem] text-ink-secondary">
        Персональная витрина · прямой контакт с продавцом
      </footer>
    </Root>
  );
}
