import "server-only";

import { getCurrentSellerStoreProfile } from "@/features/store/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getProductAnalyticsUtcWindow,
  mapProductAnalyticsRows,
  PRODUCT_ANALYTICS_PERIODS,
  type ProductAnalyticsPeriod,
  type ProductAnalyticsRpcRow,
  type SellerProductAnalyticsSummary,
} from "./product-analytics-summary.ts";

export type SellerProductAnalyticsResult =
  | { status: "found"; summary: SellerProductAnalyticsSummary }
  | { status: "store_not_found" }
  | { status: "unauthenticated" }
  | { status: "error" };

export function parseProductAnalyticsPeriod(value: unknown): ProductAnalyticsPeriod {
  return PRODUCT_ANALYTICS_PERIODS.includes(value as ProductAnalyticsPeriod)
    ? (value as ProductAnalyticsPeriod)
    : "today";
}

export async function getSellerProductAnalyticsSummary(
  period: ProductAnalyticsPeriod,
): Promise<SellerProductAnalyticsResult> {
  try {
    const storeResult = await getCurrentSellerStoreProfile();
    if (storeResult.status === "unauthenticated") {
      return { status: "unauthenticated" };
    }
    if (storeResult.status === "not_found") {
      return { status: "store_not_found" };
    }
    if (storeResult.status === "error") {
      return { status: "error" };
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .rpc("get_seller_product_analytics_summary", { target_period: period })
      .returns<ProductAnalyticsRpcRow[]>();

    if (error) {
      return { status: "error" };
    }

    const window = getProductAnalyticsUtcWindow(
      new Date(),
      period,
      storeResult.store.timezone,
    );
    if (!Array.isArray(data)) {
      return { status: "error" };
    }

    const summary = mapProductAnalyticsRows(
      data as ProductAnalyticsRpcRow[],
      period,
      {
        timezone: storeResult.store.timezone,
        periodStartUtc: window.startUtc,
        periodEndUtc: window.endUtc,
      },
    );

    return summary ? { status: "found", summary } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}
