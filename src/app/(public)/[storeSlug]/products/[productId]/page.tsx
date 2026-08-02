import { notFound } from "next/navigation";

import { PublicAnalyticsBeacon } from "@/features/analytics/public-analytics-beacon";
import { getPublicProductForStore } from "@/features/store/public-catalog";
import { getPublicStoreBySlug } from "@/features/store/public-queries";
import { getCurrentSellerStoreProfile } from "@/features/store/queries";
import { isAuthorizedPreviewStore } from "@/features/contact/preview";
import { PublicProductDetail } from "@/features/store/public-product-detail";

export const dynamic = "force-dynamic";

export default async function PublicProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string; productId: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { productId, storeSlug } = await params;
  const { preview } = await searchParams;
  const productResult = await getPublicProductForStore(storeSlug, productId);

  if (productResult.status === "not_found") {
    notFound();
  }

  if (productResult.status === "error") {
    throw new Error("Public product lookup failed.");
  }

  const storeResult = await getPublicStoreBySlug(storeSlug);
  if (storeResult.status === "not_found") {
    notFound();
  }
  if (storeResult.status === "error") {
    throw new Error("Public store lookup failed.");
  }

  const sellerStore = preview === "1" ? await getCurrentSellerStoreProfile() : null;
  const authorizedPreview = sellerStore
    ? isAuthorizedPreviewStore(sellerStore, storeSlug)
    : false;

  return (
    <PublicProductDetail
      analyticsBeacon={
        authorizedPreview ? null : (
          <PublicAnalyticsBeacon
            eventName="product_view"
            productId={productResult.product.id}
            storeSlug={storeSlug}
          />
        )
      }
      product={productResult.product}
      contactConfigured={
        storeResult.store.contactConfigured
      }
      isPreview={authorizedPreview}
      storeSlug={storeSlug}
    />
  );
}
