import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublicCatalogItem = {
  id: string;
  title: string;
  priceMode: "fixed" | "request";
  priceAmount: number | null;
  availabilityStatus: "in_stock" | "out_of_stock";
  status: "published";
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

function mapPublicCatalogRow(row: PublicCatalogRow): PublicCatalogItem {
  return {
    id: row.id,
    title: row.title,
    priceMode: row.price_mode,
    priceAmount: row.price_amount,
    availabilityStatus: row.availability_status,
    status: "published",
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

    return {
      status: "found",
      items: rows.map(mapPublicCatalogRow),
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
