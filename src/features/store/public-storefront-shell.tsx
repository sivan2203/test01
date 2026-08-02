import type { ReactNode } from "react";

import { GlassPanel } from "@/components/design-system";
import type { PublicCatalogItem } from "./public-catalog";
import { PublicCatalogView } from "./public-catalog-view";
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
};

export function PublicStorefrontShell({
  store,
  previewIndicator,
  returnAction,
  catalogItems = [],
  isPreview = false,
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

        <PublicCatalogView
          catalogItems={catalogItems}
          contactConfigured={store.contactConfigured}
          isPreview={isPreview}
          storeSlug={store.slug}
        />
      </GlassPanel>

      {returnAction ? <div className="pb-2">{returnAction}</div> : null}
    </main>
  );
}
