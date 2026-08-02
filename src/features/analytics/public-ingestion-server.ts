import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  recordPublicAnalyticsEventWithDependencies,
  type PublicAnalyticsIngestionInput,
} from "./public-ingestion";

export async function recordPublicAnalyticsEvent(
  input: PublicAnalyticsIngestionInput,
) {
  try {
    const supabase = createSupabaseServiceRoleClient();
    return recordPublicAnalyticsEventWithDependencies(input, {
      rpc: async (name, args) => {
        const { data, error } = await supabase
          .rpc(name, args)
          .maybeSingle<{ event_id?: string; deduplicated?: boolean }>();
        return { data, error };
      },
    });
  } catch {
    return { status: "unavailable" as const };
  }
}

export type PublicCtaAnalyticsInput = {
  storeSlug: string;
  productId: string;
  source: string | null;
  sessionId: string | null;
  userAgentType: "browser" | "crawler" | "unknown";
};

export async function recordPublicCtaClick(
  input: PublicCtaAnalyticsInput,
) {
  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .rpc("record_public_cta_click", {
        store_slug: input.storeSlug,
        target_product_id: input.productId,
        event_source: input.source ?? "unknown",
        event_session_id: input.sessionId,
        event_user_agent_type: input.userAgentType,
      })
      .maybeSingle<{ event_id?: string; deduplicated?: boolean }>();

    if (error || !data) throw new Error("Unable to record CTA click.");
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Unable to record CTA click.");
  }
}
