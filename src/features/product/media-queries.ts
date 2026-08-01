import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  PRODUCT_MEDIA_BUCKET,
  PRODUCT_MEDIA_SIGNED_URL_TTL_SECONDS,
  type ProductMedia,
  type ProductMediaMimeType,
} from "./media-schema";
import { getCurrentSellerStoreForProducts, isProductId } from "./queries";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const PUBLIC_MEDIA_SIGNING_BATCH_SIZE = 50;

export type ProductMediaRow = {
  id: string;
  product_id: string;
  storage_path: string;
  mime_type: ProductMediaMimeType;
  byte_size: number;
  sort_order: number;
};

type PublishedProductMediaRow = Omit<ProductMediaRow, "byte_size">;

export type SellerProductMediaResult =
  | { status: "found"; media: ProductMedia[] }
  | { status: "not_found" }
  | { status: "store_not_found" }
  | { status: "unauthenticated" }
  | { status: "error" };

export type ProductMediaRowsResult =
  | { status: "found"; storeId: string; productStatus: string; rows: ProductMediaRow[] }
  | { status: "not_found" }
  | { status: "store_not_found" }
  | { status: "unauthenticated" }
  | { status: "error" };

export type SellerProductCoversResult =
  | { status: "found"; covers: Map<string, string> }
  | { status: "store_not_found" }
  | { status: "unauthenticated" }
  | { status: "error" };

export function mapProductMediaRow(
  row: Omit<ProductMediaRow, "byte_size">,
  url: string,
): ProductMedia {
  return {
    id: row.id,
    url,
    mimeType: row.mime_type,
    sortOrder: row.sort_order,
    isCover: row.sort_order === 0,
  };
}

export async function createSignedProductMediaUrl(
  supabase: SupabaseServerClient,
  storagePath: string,
) {
  const { data, error } = await supabase.storage
    .from(PRODUCT_MEDIA_BUCKET)
    .createSignedUrl(storagePath, PRODUCT_MEDIA_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

async function mapRowsToMedia(
  supabase: SupabaseServerClient,
  rows: ProductMediaRow[],
) {
  const media: ProductMedia[] = [];

  for (const row of rows) {
    const url = await createSignedProductMediaUrl(supabase, row.storage_path);
    if (!url) return null;
    media.push(mapProductMediaRow(row, url));
  }

  return media;
}

export async function getProductMediaRowsForSeller(
  productId: string,
): Promise<ProductMediaRowsResult> {
  if (!isProductId(productId)) return { status: "not_found" };

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return { status: "unauthenticated" };

    const storeResult = await getCurrentSellerStoreForProducts(supabase, user.id);
    if (storeResult.status !== "found") return storeResult;

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, status")
      .eq("id", productId)
      .eq("store_id", storeResult.storeId)
      .neq("status", "deleted")
      .maybeSingle<{ id: string; status: string }>();

    if (productError) return { status: "error" };
    if (!product) return { status: "not_found" };

    const { data: rows, error: mediaError } = await supabase
      .from("product_media")
      .select("id, product_id, storage_path, mime_type, byte_size, sort_order")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .returns<ProductMediaRow[]>();

    if (mediaError) return { status: "error" };

    return {
      status: "found",
      storeId: storeResult.storeId,
      productStatus: product.status,
      rows: rows ?? [],
    };
  } catch {
    return { status: "error" };
  }
}

export async function getSellerProductMedia(
  productId: string,
): Promise<SellerProductMediaResult> {
  const rowsResult = await getProductMediaRowsForSeller(productId);
  if (rowsResult.status !== "found") return rowsResult;

  try {
    const supabase = await createSupabaseServerClient();
    const media = await mapRowsToMedia(supabase, rowsResult.rows);
    if (!media) return { status: "error" };
    return { status: "found", media };
  } catch {
    return { status: "error" };
  }
}

export async function getSellerProductCovers(
  productIds: string[],
): Promise<SellerProductCoversResult> {
  if (productIds.length === 0) {
    return { status: "found", covers: new Map() };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return { status: "unauthenticated" };

    const storeResult = await getCurrentSellerStoreForProducts(supabase, user.id);
    if (storeResult.status !== "found") return storeResult;

    const { data: rows, error } = await supabase
      .from("product_media")
      .select("id, product_id, storage_path, mime_type, byte_size, sort_order")
      .in("product_id", productIds)
      .eq("sort_order", 0)
      .order("product_id", { ascending: true })
      .returns<ProductMediaRow[]>();

    if (error) return { status: "error" };

    const mediaRows = rows ?? [];
    const { data: signedUrls, error: signedUrlsError } = await supabase.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .createSignedUrls(
        mediaRows.map((row) => row.storage_path),
        PRODUCT_MEDIA_SIGNED_URL_TTL_SECONDS,
      );

    if (signedUrlsError) return { status: "error" };

    const covers = new Map<string, string>();
    for (const [index, row] of mediaRows.entries()) {
      const url = signedUrls?.[index]?.signedUrl;
      if (url) covers.set(row.product_id, url);
    }

    return { status: "found", covers };
  } catch {
    return { status: "error" };
  }
}

export async function getPublishedProductMediaForCatalog(
  supabase: SupabaseServerClient,
  productIds: string[],
) {
  if (productIds.length === 0) return new Map<string, ProductMedia[]>();

  const { data: rows, error } = await supabase
    .rpc("get_published_product_media_for_catalog", {
      target_product_ids: productIds,
    })
    .returns<PublishedProductMediaRow[]>();

  if (error) throw new Error("Published product media lookup failed.");

  const mediaRows = Array.isArray(rows) ? rows : [];
  if (mediaRows.length === 0) return new Map<string, ProductMedia[]>();

  const signedUrlsByIndex: Array<string | undefined> = Array(
    mediaRows.length,
  ).fill(undefined);

  for (
    let start = 0;
    start < mediaRows.length;
    start += PUBLIC_MEDIA_SIGNING_BATCH_SIZE
  ) {
    const batch = mediaRows.slice(start, start + PUBLIC_MEDIA_SIGNING_BATCH_SIZE);

    try {
      const { data: signedUrls } = await supabase.storage
        .from(PRODUCT_MEDIA_BUCKET)
        .createSignedUrls(
          batch.map((row) => row.storage_path),
          PRODUCT_MEDIA_SIGNED_URL_TTL_SECONDS,
        );

      for (const [batchIndex, signedUrl] of (signedUrls ?? []).entries()) {
        signedUrlsByIndex[start + batchIndex] = signedUrl?.signedUrl ?? undefined;
      }
    } catch {
      // Keep catalog data visible even when a media batch is temporarily unavailable.
      continue;
    }
  }

  const grouped = new Map<string, ProductMedia[]>();
  for (const [index, row] of mediaRows.entries()) {
    const url = signedUrlsByIndex[index];
    if (!url) continue;
    const current = grouped.get(row.product_id) ?? [];
    current.push(mapProductMediaRow(row, url));
    grouped.set(row.product_id, current);
  }

  return grouped;
}
