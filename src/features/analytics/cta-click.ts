import {
  buildAnalyticsEvent,
} from "./event-contract.ts";

export const CTA_CLICK_EVENT_NAME = "cta_click" as const;
export {
  normalizeAnalyticsSessionId,
  normalizeAnalyticsSource,
  UNKNOWN_ANALYTICS_SOURCE,
} from "./event-contract.ts";

export type CtaClickInput = {
  storeId: string;
  productId: string;
  source?: string | null;
  sessionId?: string | null;
  occurredAt?: string;
  isPreview?: boolean;
};

export type CtaClickEvent = {
  eventName: typeof CTA_CLICK_EVENT_NAME;
  storeId: string;
  productId: string;
  source: string;
  sessionId: string | null;
  occurredAt: string;
  excludedReason: null;
};

export function buildCtaClickEvent(
  input: CtaClickInput,
): CtaClickEvent | null {
  if (input.isPreview) return null;

  const event = buildAnalyticsEvent({
    eventName: CTA_CLICK_EVENT_NAME,
    storeId: input.storeId,
    storeSlug: "public",
    productId: input.productId,
    messengerType: "telegram",
    source: input.source,
    sessionId: input.sessionId,
    occurredAt: input.occurredAt,
  });

  return {
    eventName: CTA_CLICK_EVENT_NAME,
    storeId: event.storeId,
    productId: event.productId as string,
    source: event.source,
    sessionId: event.sessionId,
    occurredAt: event.occurredAt,
    excludedReason: null,
  };
}
