import type { ProductStatus } from "./schema";

const PRODUCT_STATUS_DRAFT = "draft" as const;
const PRODUCT_STATUS_PUBLISHED = "published" as const;
const PRODUCT_STATUS_HIDDEN = "hidden" as const;
const PRODUCT_STATUS_DELETED = "deleted" as const;

export const SELLER_PRODUCT_LIST_FILTERS = [
  "all",
  PRODUCT_STATUS_DRAFT,
  PRODUCT_STATUS_PUBLISHED,
  PRODUCT_STATUS_HIDDEN,
  PRODUCT_STATUS_DELETED,
] as const;

export type SellerProductListFilter =
  (typeof SELLER_PRODUCT_LIST_FILTERS)[number];

export function parseSellerProductListFilter(
  value: string | string[] | null | undefined,
): SellerProductListFilter {
  const candidate = Array.isArray(value) ? value[0] : value;

  return SELLER_PRODUCT_LIST_FILTERS.includes(
    candidate as SellerProductListFilter,
  )
    ? (candidate as SellerProductListFilter)
    : "all";
}

export function matchesSellerProductListFilter(
  status: ProductStatus,
  filter: SellerProductListFilter,
) {
  if (filter === "all") return status !== PRODUCT_STATUS_DELETED;
  return status === filter;
}
