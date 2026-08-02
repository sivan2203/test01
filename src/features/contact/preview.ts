import type { SellerStoreProfileResult } from "@/features/store/queries";

export function isAuthorizedPreviewStore(
  sellerStore: SellerStoreProfileResult,
  storeSlug: string,
) {
  return sellerStore.status === "found" && sellerStore.store.slug === storeSlug;
}
