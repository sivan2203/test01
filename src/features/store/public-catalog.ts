import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getPublishedProductMediaForCatalog,
} from "@/features/product/media-queries";
import { isProductId } from "@/features/product/queries";
import type { ProductMedia } from "@/features/product/media-schema";

export type PublicCatalogItem = {
  id: string;
  title: string;
  priceMode: "fixed" | "request";
  priceAmount: number | null;
  availabilityStatus: "in_stock" | "out_of_stock";
  status: "published";
  media: ProductMedia[];
};

type PublicCatalogRow = {
  id: string;
  title: string;
  price_mode: "fixed" | "request";
  price_amount: number | null;
  availability_status: "in_stock" | "out_of_stock";
  status: "published";
};

export type PublicCatalogResult =
  | { status: "found"; items: PublicCatalogItem[] }
  | { status: "error" };

export type PublicProduct = PublicCatalogItem & {
  description: string;
};

type PublicProductRow = PublicCatalogRow & {
  description: string | null;
};

export type PublicProductResult =
  | { status: "found"; product: PublicProduct }
  | { status: "not_found" }
  | { status: "error" };

function mapPublicCatalogRow(
  row: PublicCatalogRow,
  media: ProductMedia[],
): PublicCatalogItem {
  return {
    id: row.id,
    title: row.title,
    priceMode: row.price_mode,
    priceAmount: row.price_amount,
    availabilityStatus: row.availability_status,
    status: "published",
    media,
  };
}

function mapPublicProductRow(
  row: PublicProductRow,
  media: ProductMedia[],
): PublicProduct {
  return {
    ...mapPublicCatalogRow(row, media),
    description: row.description ?? "",
  };
}

export async function getPublicCatalogItemsForStore(
  storeSlug: string,
): Promise<PublicCatalogResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .rpc("get_public_catalog_items_for_store", { store_slug: storeSlug })
      .returns<PublicCatalogRow[]>();

    if (error) {
      return { status: "error" };
    }

    const rows = Array.isArray(data) ? data : [];
    const mediaByProduct = await getPublishedProductMediaForCatalog(
      supabase,
      rows.map((row) => row.id),
    );

    return {
      status: "found",
      items: rows.map((row) =>
        mapPublicCatalogRow(row, mediaByProduct.get(row.id) ?? []),
      ),
    };
  } catch {
    return { status: "error" };
  }
}

export async function getPublishedPublicCatalogItemsForStore(
  storeSlug: string,
): Promise<PublicCatalogItem[]> {
  const catalogResult = await getPublicCatalogItemsForStore(storeSlug);

  if (catalogResult.status === "error") {
    throw new Error("Public catalog lookup failed.");
  }

  return catalogResult.items;
}

export async function getPublicProductForStore(
  storeSlug: string,
  productId: string,
): Promise<PublicProductResult> {
  if (!isProductId(productId)) return { status: "not_found" };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .rpc("get_public_product_for_store", {
        store_slug: storeSlug,
        target_product_id: productId,
      })
      .returns<PublicProductRow[]>();

    if (error) return { status: "error" };

    const row = Array.isArray(data) ? data[0] : undefined;
    if (!row) return { status: "not_found" };

    const mediaByProduct = await getPublishedProductMediaForCatalog(
      supabase,
      [row.id],
    );

    return {
      status: "found",
      product: mapPublicProductRow(row, mediaByProduct.get(row.id) ?? []),
    };
  } catch {
    return { status: "error" };
  }
}
