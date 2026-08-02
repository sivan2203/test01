import {
  ANALYTICS_SOURCE_PATTERN,
  type AnalyticsUserAgentType,
  normalizeAnalyticsSource,
  normalizeAnalyticsSessionId,
} from "./event-contract.ts";

const PUBLIC_VIEW_EVENT_NAMES = ["store_view", "product_view"] as const;
type PublicViewEventName = (typeof PUBLIC_VIEW_EVENT_NAMES)[number];

const STORE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RESERVED_STORE_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "signup",
  "support",
  "help",
  "seller",
]);

export type PublicAnalyticsPayload = {
  eventName: PublicViewEventName;
  storeSlug: string;
  productId: string | null;
  source: string | null;
};

export type PublicAnalyticsIngestionInput = PublicAnalyticsPayload & {
  sessionId: string | null;
  userAgentType: AnalyticsUserAgentType;
};

export type AnalyticsRpcResult = {
  event_id?: string;
  deduplicated?: boolean;
};

export type PublicAnalyticsRpcDependencies = {
  rpc: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: AnalyticsRpcResult | null; error: unknown } | { data: null; error: unknown }>;
};

export type PublicAnalyticsIngestionResult =
  | { status: "recorded"; eventId?: string }
  | { status: "deduplicated"; eventId?: string }
  | { status: "rejected" }
  | { status: "unavailable" };

function isStoreSlug(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 3 &&
    value.length <= 32 &&
    STORE_SLUG_PATTERN.test(value) &&
    !RESERVED_STORE_SLUGS.has(value)
  );
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function parsePublicAnalyticsPayload(
  raw: unknown,
): PublicAnalyticsPayload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const body = raw as Record<string, unknown>;
  const eventName = body.eventName;
  const storeSlug = body.storeSlug;
  const productId = body.productId;
  const source = body.source;

  if (
    !PUBLIC_VIEW_EVENT_NAMES.includes(eventName as PublicViewEventName) ||
    !isStoreSlug(storeSlug)
  ) {
    return null;
  }
  const parsedEventName = eventName as PublicViewEventName;
  if (source !== undefined && source !== null && typeof source !== "string") {
    return null;
  }

  if (parsedEventName === "store_view") {
    if (productId !== undefined && productId !== null) return null;
    return {
      eventName: parsedEventName,
      storeSlug,
      productId: null,
      source: source === undefined ? null : source,
    };
  }

  if (!isUuid(productId)) return null;
  return {
    eventName: parsedEventName,
    storeSlug,
    productId,
    source: source === undefined ? null : source,
  };
}

function getRpcRequest(input: PublicAnalyticsIngestionInput) {
  const common = {
    store_slug: input.storeSlug,
    event_source: normalizeAnalyticsSource(input.source),
    event_session_id: normalizeAnalyticsSessionId(input.sessionId),
    event_user_agent_type: input.userAgentType,
  };

  if (input.eventName === "store_view") {
    return {
      name: "record_public_store_view",
      args: common,
    };
  }

  return {
    name: "record_public_product_view",
    args: {
      ...common,
      target_product_id: input.productId,
    },
  };
}

export async function recordPublicAnalyticsEventWithDependencies(
  input: PublicAnalyticsIngestionInput,
  dependencies: PublicAnalyticsRpcDependencies,
): Promise<PublicAnalyticsIngestionResult> {
  const request = getRpcRequest(input);

  try {
    const result = await dependencies.rpc(request.name, request.args);
    if (result.error || !result.data) return { status: "rejected" };
    if (result.data.deduplicated) {
      return { status: "deduplicated", eventId: result.data.event_id };
    }
    return { status: "recorded", eventId: result.data.event_id };
  } catch {
    return { status: "unavailable" };
  }
}

export const analyticsSourcePattern = ANALYTICS_SOURCE_PATTERN;
export const analyticsPublicEventNames = PUBLIC_VIEW_EVENT_NAMES;
