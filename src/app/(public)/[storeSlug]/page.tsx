import { notFound } from "next/navigation";

import { PublicAnalyticsBeacon } from "@/features/analytics/public-analytics-beacon";
import { getPublicCatalogItemsForStore } from "@/features/store/public-catalog";
import { getPublicStoreBySlug } from "@/features/store/public-queries";
import { PublicStorefrontShell } from "@/features/store/public-storefront-shell";

export const dynamic = "force-dynamic";

export default async function PublicStorePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const storeResult = await getPublicStoreBySlug(storeSlug);

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
    />
  );
}
