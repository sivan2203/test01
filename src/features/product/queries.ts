import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getProductPriceLabel,
  type ProductAvailabilityStatus,
  type ProductPriceMode,
  type ProductStatus,
} from "./schema";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type StoreIdRow = {
  id: string;
};

const PRODUCT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isProductId(value: string) {
  return PRODUCT_ID_PATTERN.test(value);
}

export type ProductRow = {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  price_mode: ProductPriceMode;
  price_amount: number | null;
  availability_status: ProductAvailabilityStatus;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
};

export type SellerProduct = {
  id: string;
  storeId: string;
  title: string;
  description: string;
  priceMode: ProductPriceMode;
  priceAmount: number | null;
  priceLabel: string;
  availabilityStatus: ProductAvailabilityStatus;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

export type SellerProductsResult =
  | { status: "found"; products: SellerProduct[] }
  | { status: "store_not_found" }
  | { status: "unauthenticated" }
  | { status: "error" };

export type SellerProductResult =
  | { status: "found"; product: SellerProduct }
  | { status: "not_found" }
  | { status: "store_not_found" }
  | { status: "unauthenticated" }
  | { status: "error" };

export function mapProductRow(row: ProductRow): SellerProduct {
  return {
    id: row.id,
    storeId: row.store_id,
    title: row.title,
    description: row.description ?? "",
    priceMode: row.price_mode,
    priceAmount: row.price_amount,
    priceLabel: getProductPriceLabel(row.price_mode, row.price_amount),
    availabilityStatus: row.availability_status,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCurrentSellerStoreForProducts(
  supabase: SupabaseServerClient,
  sellerId: string,
) {
  const { data, error } = await supabase
    .from("stores")
    .select("id")
    .eq("seller_id", sellerId)
    .maybeSingle<StoreIdRow>();

  if (error) {
    return { status: "error" as const };
  }

  if (!data) {
    return { status: "store_not_found" as const };
  }

  return { status: "found" as const, storeId: data.id };
}

export async function getSellerProducts(): Promise<SellerProductsResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { status: "unauthenticated" };
    }

    const storeResult = await getCurrentSellerStoreForProducts(supabase, user.id);
    if (storeResult.status !== "found") {
      return storeResult;
    }

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, store_id, title, description, price_mode, price_amount, availability_status, status, created_at, updated_at",
      )
      .eq("store_id", storeResult.storeId)
      .neq("status", "deleted")
      .order("updated_at", { ascending: false })
      .returns<ProductRow[]>();

    if (error) {
      return { status: "error" };
    }

    return { status: "found", products: (data ?? []).map(mapProductRow) };
  } catch {
    return { status: "error" };
  }
}

export async function getSellerProductById(
  productId: string,
): Promise<SellerProductResult> {
  if (!isProductId(productId)) {
    return { status: "not_found" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { status: "unauthenticated" };
    }

    const storeResult = await getCurrentSellerStoreForProducts(supabase, user.id);
    if (storeResult.status !== "found") {
      return storeResult;
    }

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, store_id, title, description, price_mode, price_amount, availability_status, status, created_at, updated_at",
      )
      .eq("id", productId)
      .eq("store_id", storeResult.storeId)
      .neq("status", "deleted")
      .maybeSingle<ProductRow>();

    if (error) {
      return { status: "error" };
    }

    if (!data) {
      return { status: "not_found" };
    }

    return { status: "found", product: mapProductRow(data) };
  } catch {
    return { status: "error" };
  }
}

/** @deprecated Use getSellerProductById for all editable non-deleted products. */
export async function getSellerProductDraftById(
  productId: string,
): Promise<SellerProductResult> {
  return getSellerProductById(productId);
}
