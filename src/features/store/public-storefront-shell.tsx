import type { ReactNode } from "react";

import { GlassPanel } from "@/components/design-system";
import type { PublicCatalogItem } from "./public-catalog";

export type BuyerFacingStoreProfile = {
  slug: string;
  name: string;
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
  const catalogIsPrepared = catalogItems.length > 0;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 py-6">
      {previewIndicator ? (
        <div className="rounded-full border border-border bg-surface-raised px-4 py-3 text-sm font-medium text-foreground shadow-sm">
          {previewIndicator}
        </div>
      ) : null}

      <GlassPanel className="p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0">
            <p className="break-all text-sm text-foreground/60">
              Витрина / {store.slug}
            </p>
            <h1 className="mt-2 text-2xl font-semibold">{store.name}</h1>
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

      <GlassPanel className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-foreground/60">Каталог</p>
            <h2 className="mt-1 text-xl font-semibold">Товары магазина</h2>
          </div>
        </div>

        <p className="mt-4 rounded-2xl border border-border bg-surface-raised p-4 text-sm leading-6 text-foreground/70">
          {catalogIsPrepared
            ? "Каталог подготовлен и будет открыт покупателям в следующей истории."
            : "Каталог появится здесь в следующих шагах."}
        </p>
      </GlassPanel>

      {returnAction ? <div className="pb-2">{returnAction}</div> : null}
    </main>
  );
}
