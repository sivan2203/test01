import "server-only";

import { getPublicProductForStore } from "@/features/store/public-catalog";
import { getPublicStoreBySlug } from "@/features/store/public-queries";
import { recordPublicCtaClick } from "@/features/analytics/public-ingestion-server";
import { buildTelegramHandoff } from "./telegram";
import {
  prepareTelegramHandoffWithDependencies,
  type CtaClickRecordInput,
  type PrepareTelegramHandoffInput,
  type PrepareTelegramHandoffResult,
} from "./handoff-service";

export type { PrepareTelegramHandoffInput, PrepareTelegramHandoffResult };

async function recordCtaClick(input: CtaClickRecordInput) {
  await recordPublicCtaClick({
    storeSlug: input.storeSlug,
    productId: input.productId,
    source: input.source,
    sessionId: input.sessionId,
    userAgentType: input.userAgentType ?? "unknown",
  });
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
