export const ANALYTICS_EVENT_NAMES = [
  "store_view",
  "product_view",
  "cta_click",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];
export type AnalyticsUserAgentType = "browser" | "crawler" | "unknown";
export type AnalyticsMessengerType = "telegram";
export type AnalyticsExclusionReason =
  | "crawler"
  | "preview"
  | "invalid_context"
  | "disabled_contact"
  | "rate_limited";

export const UNKNOWN_ANALYTICS_SOURCE = "unknown" as const;
export const ANALYTICS_SOURCE_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CRAWLER_PATTERN =
  /bot|crawler|spider|slurp|bingpreview|headless|facebookexternalhit|curl|wget|google-inspectiontool|google-read-aloud|googleother|mediapartners-google/i;

export type AnalyticsEventInput = {
  eventName: AnalyticsEventName;
  storeId: string;
  storeSlug: string;
  productId?: string | null;
  messengerType?: AnalyticsMessengerType | null;
  source?: string | null;
  sessionId?: string | null;
  userAgentType?: AnalyticsUserAgentType;
  occurredAt?: string;
  excludedReason?: AnalyticsExclusionReason | null;
};

export type AnalyticsEvent = {
  eventName: AnalyticsEventName;
  storeId: string;
  storeSlug: string;
  productId: string | null;
  messengerType: AnalyticsMessengerType | null;
  source: string;
  sessionId: string | null;
  userAgentType: AnalyticsUserAgentType;
  occurredAt: string;
  excludedReason: AnalyticsExclusionReason | null;
};

export function isAnalyticsUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function normalizeAnalyticsSource(source?: string | null) {
  const normalized = source?.trim().toLowerCase() ?? "";
  return ANALYTICS_SOURCE_PATTERN.test(normalized)
    ? normalized
    : UNKNOWN_ANALYTICS_SOURCE;
}

export function normalizeAnalyticsSessionId(sessionId?: string | null) {
  if (!sessionId) return null;
  return isAnalyticsUuid(sessionId) ? sessionId : null;
}

export function isCanonicalUtcTimestamp(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

export function normalizeAnalyticsOccurredAt(occurredAt?: string) {
  const value = occurredAt ?? new Date().toISOString();
  if (!isCanonicalUtcTimestamp(value)) {
    throw new Error("Analytics timestamps must be canonical UTC values.");
  }
  return value;
}

export function classifyAnalyticsUserAgent(
  userAgent: string | null | undefined,
): AnalyticsUserAgentType {
  if (!userAgent?.trim()) return "unknown";
  return CRAWLER_PATTERN.test(userAgent) ? "crawler" : "browser";
}

export function buildAnalyticsEvent(input: AnalyticsEventInput): AnalyticsEvent {
  if (!ANALYTICS_EVENT_NAMES.includes(input.eventName)) {
    throw new Error("Analytics events require a supported event name.");
  }
  if (!isAnalyticsUuid(input.storeId)) {
    throw new Error("Analytics events require a valid store ID.");
  }
  if (!input.storeSlug || input.storeSlug !== input.storeSlug.trim()) {
    throw new Error("Analytics events require a valid store slug.");
  }

  const productId = input.productId ?? null;
  const messengerType = input.messengerType ?? null;
  if (productId && !isAnalyticsUuid(productId)) {
    throw new Error("Analytics product events require a valid product ID.");
  }

  if (input.eventName === "store_view" && (productId || messengerType)) {
    throw new Error("store_view cannot contain product or messenger context.");
  }
  if (input.eventName === "product_view" && !productId) {
    throw new Error("product_view requires a product context.");
  }
  if (
    input.eventName === "cta_click" &&
    (!productId || messengerType !== "telegram")
  ) {
    throw new Error("cta_click requires a Telegram product context.");
  }
  if (input.eventName !== "cta_click" && messengerType) {
    throw new Error("Only cta_click can contain messenger context.");
  }

  const excludedReason = input.excludedReason ?? null;
  const userAgentType = input.userAgentType ?? "unknown";
  if (excludedReason === "crawler" && userAgentType !== "crawler") {
    throw new Error("Crawler exclusions require crawler user-agent type.");
  }

  return {
    eventName: input.eventName,
    storeId: input.storeId,
    storeSlug: input.storeSlug,
    productId,
    messengerType,
    source: normalizeAnalyticsSource(input.source),
    sessionId: normalizeAnalyticsSessionId(input.sessionId),
    userAgentType,
    occurredAt: normalizeAnalyticsOccurredAt(input.occurredAt),
    excludedReason,
  };
}
