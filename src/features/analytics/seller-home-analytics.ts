import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  mapSellerHomeAnalyticsRow,
  type SellerHomeAnalyticsRpcRow,
  type SellerHomeAnalyticsSummary,
} from "./seller-home-summary";

export type SellerHomeAnalyticsResult =
  | { status: "found"; summary: SellerHomeAnalyticsSummary }
  | { status: "not_found" }
  | { status: "unauthenticated" }
  | { status: "error" };

export async function getSellerHomeAnalyticsSummary(): Promise<SellerHomeAnalyticsResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { status: "unauthenticated" };
    }

    const { data, error } = await supabase
      .rpc("get_seller_home_analytics_summary")
      .maybeSingle<SellerHomeAnalyticsRpcRow>();

    if (error) {
      return { status: "error" };
    }

    if (!data) {
      return { status: "not_found" };
    }

    const summary = mapSellerHomeAnalyticsRow(data);
    return summary ? { status: "found", summary } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}
