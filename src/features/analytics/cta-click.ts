export const CTA_CLICK_EVENT_NAME = "cta_click" as const;
export const UNKNOWN_ANALYTICS_SOURCE = "unknown" as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SOURCE_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

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

export function normalizeAnalyticsSource(source?: string | null) {
  const normalized = source?.trim().toLowerCase() ?? "";
  return SOURCE_PATTERN.test(normalized)
    ? normalized
    : UNKNOWN_ANALYTICS_SOURCE;
}

export function normalizeAnalyticsSessionId(sessionId?: string | null) {
  if (!sessionId) return null;
  return UUID_PATTERN.test(sessionId) ? sessionId : null;
}

export function buildCtaClickEvent(
  input: CtaClickInput,
): CtaClickEvent | null {
  if (input.isPreview) return null;
  if (!UUID_PATTERN.test(input.storeId) || !UUID_PATTERN.test(input.productId)) {
    throw new Error("CTA click requires valid store and product IDs.");
  }

  const occurredAt = input.occurredAt ?? new Date().toISOString();
  if (Number.isNaN(Date.parse(occurredAt))) {
    throw new Error("CTA click requires a valid UTC timestamp.");
  }

  return {
    eventName: CTA_CLICK_EVENT_NAME,
    storeId: input.storeId,
    productId: input.productId,
    source: normalizeAnalyticsSource(input.source),
    sessionId: normalizeAnalyticsSessionId(input.sessionId),
    occurredAt,
    excludedReason: null,
  };
}
