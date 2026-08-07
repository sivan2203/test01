import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PublicAnalyticsBeacon } from "@/features/analytics/public-analytics-beacon";
import { MAX_SOURCE_HINT_LENGTH } from "@/features/analytics/source-attribution";
import { getPublicCatalogItemsForStore } from "@/features/store/public-catalog";
import { getPublicStoreBySlug } from "@/features/store/public-queries";
import { PublicStorefrontShell } from "@/features/store/public-storefront-shell";

export const dynamic = "force-dynamic";

const getCachedPublicStoreBySlug = cache(getPublicStoreBySlug);

type PublicStorePageProps = {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{
    source?: string | string[];
    utm_source?: string | string[];
  }>;
};

export async function generateMetadata({
  params,
}: Pick<PublicStorePageProps, "params">): Promise<Metadata> {
  const { storeSlug } = await params;
  const storeResult = await getCachedPublicStoreBySlug(storeSlug);

  if (storeResult.status !== "found") {
    return { title: "Витрина не найдена" };
  }

  return {
    title: storeResult.store.name,
    description:
      storeResult.store.description ||
      `Товары магазина «${storeResult.store.name}».`,
  };
}

export default async function PublicStorePage({
  params,
  searchParams,
}: PublicStorePageProps) {
  const { storeSlug } = await params;
  const query = await searchParams;
  const storeResult = await getCachedPublicStoreBySlug(storeSlug);

  if (storeResult.status === "not_found") {
    notFound();
  }

  if (storeResult.status === "error") {
    throw new Error("Public store lookup failed.");
  }

  const { store } = storeResult;
  const catalogResult = await getPublicCatalogItemsForStore(store.slug);

  if (catalogResult.status === "error") {
    throw new Error("Public catalog unavailable.");
  }

  return (
    <PublicStorefrontShell
      analyticsBeacon={
        <PublicAnalyticsBeacon eventName="store_view" storeSlug={store.slug} />
      }
      catalogItems={catalogResult.items}
      store={store}
      attributionQuery={{
        source:
          typeof query.source === "string" &&
          query.source.length <= MAX_SOURCE_HINT_LENGTH
            ? query.source
            : undefined,
        utmSource:
          typeof query.utm_source === "string" &&
          query.utm_source.length <= MAX_SOURCE_HINT_LENGTH
            ? query.utm_source
            : undefined,
      }}
    />
  );
}
