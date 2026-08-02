import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicProductForStore } from "@/features/store/public-catalog";
import { getPublicStoreBySlug } from "@/features/store/public-queries";
import { buildTelegramHandoff } from "./telegram";
import {
  prepareTelegramHandoffWithDependencies,
  type CtaClickRecordInput,
  type PrepareTelegramHandoffInput,
  type PrepareTelegramHandoffResult,
} from "./handoff-service";

type CtaClickRpcRow = {
  event_id: string;
  store_id: string;
  product_id: string;
  occurred_at: string;
};

export type { PrepareTelegramHandoffInput, PrepareTelegramHandoffResult };

async function recordCtaClick(input: CtaClickRecordInput) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .rpc("record_public_cta_click", {
      store_slug: input.storeSlug,
      target_product_id: input.productId,
      event_source: input.source ?? "unknown",
      event_session_id: input.sessionId ?? null,
    })
    .maybeSingle<CtaClickRpcRow>();

  if (error || !data) {
    throw new Error("Unable to record CTA click.");
  }
}

export async function prepareTelegramHandoff(
  input: PrepareTelegramHandoffInput,
): Promise<PrepareTelegramHandoffResult> {
  return prepareTelegramHandoffWithDependencies(input, {
    getStore: getPublicStoreBySlug,
    getProduct: getPublicProductForStore,
    recordCtaClick,
    buildHandoff: buildTelegramHandoff,
  });
}
