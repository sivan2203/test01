import { notFound } from "next/navigation";

import { getPublicProductForStore } from "@/features/store/public-catalog";
import { PublicProductDetail } from "@/features/store/public-product-detail";

export const dynamic = "force-dynamic";

export default async function PublicProductPage({
  params,
}: {
  params: Promise<{ storeSlug: string; productId: string }>;
}) {
  const { productId, storeSlug } = await params;
  const productResult = await getPublicProductForStore(storeSlug, productId);

  if (productResult.status === "not_found") {
    notFound();
  }

  if (productResult.status === "error") {
    throw new Error("Public product lookup failed.");
  }

  return (
    <PublicProductDetail
      product={productResult.product}
      storeSlug={storeSlug}
    />
  );
}
