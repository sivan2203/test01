import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PublicAnalyticsBeacon } from "@/features/analytics/public-analytics-beacon";
import { getPublicProductForStore } from "@/features/store/public-catalog";
import { getPublicStoreBySlug } from "@/features/store/public-queries";
import { getCurrentSellerStoreProfile } from "@/features/store/queries";
import { isAuthorizedPreviewStore } from "@/features/contact/preview";
import { PublicProductDetail } from "@/features/store/public-product-detail";

export const dynamic = "force-dynamic";

const getCachedPublicProductForStore = cache(getPublicProductForStore);
const getCachedPublicStoreBySlug = cache(getPublicStoreBySlug);

type PublicProductPageProps = {
  params: Promise<{ storeSlug: string; productId: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateMetadata({
  params,
}: Pick<PublicProductPageProps, "params">): Promise<Metadata> {
  const { productId, storeSlug } = await params;
  const [productResult, storeResult] = await Promise.all([
    getCachedPublicProductForStore(storeSlug, productId),
    getCachedPublicStoreBySlug(storeSlug),
  ]);

  if (productResult.status !== "found") {
    return { title: "Товар не найден" };
  }

  return {
    title:
      storeResult.status === "found"
        ? `${productResult.product.title} — ${storeResult.store.name}`
        : productResult.product.title,
    description:
      productResult.product.description ||
      `Товар «${productResult.product.title}».`,
  };
}

export default async function PublicProductPage({
  params,
  searchParams,
}: PublicProductPageProps) {
  const { productId, storeSlug } = await params;
  const { preview } = await searchParams;
  const productResult = await getCachedPublicProductForStore(storeSlug, productId);

  if (productResult.status === "not_found") {
    notFound();
  }

  if (productResult.status === "error") {
    throw new Error("Public product lookup failed.");
  }

  const storeResult = await getCachedPublicStoreBySlug(storeSlug);
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
