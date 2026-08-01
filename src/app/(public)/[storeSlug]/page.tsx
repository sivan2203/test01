import { notFound } from "next/navigation";

import { getPublishedPublicCatalogItemsForStore } from "@/features/store/public-catalog";
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
  const catalogItems = await getPublishedPublicCatalogItemsForStore(store.slug);

  return <PublicStorefrontShell catalogItems={catalogItems} store={store} />;
}
