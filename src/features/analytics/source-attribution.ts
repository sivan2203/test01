export const UNKNOWN_SOURCE = "unknown" as const;
export const SOURCE_ATTRIBUTION_COOKIE = "buyer_source" as const;
export const MAX_SOURCE_HINT_LENGTH = 64;
export const MAX_REFERRER_HINT_LENGTH = 2048;
export const MAX_ATTRIBUTION_REQUEST_BYTES = 16 * 1024;

export const SOURCE_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const REFERRER_HOSTS = new Map<string, string>([
  ["instagram.com", "instagram"],
  ["l.instagram.com", "instagram"],
  ["telegram.me", "telegram"],
  ["telegram.org", "telegram"],
  ["t.me", "telegram"],
  ["vk.com", "vk"],
  ["m.vk.com", "vk"],
]);

export type SourceAttributionReason =
  | "explicit"
  | "utm"
  | "stored"
  | "referrer"
  | "unknown";

export type SourceAttributionResolution = {
  source: string;
  reason: SourceAttributionReason;
};

export type SourcePersistenceStatus =
  | "recorded"
  | "deduplicated"
  | "rejected"
  | "unavailable";

export type SourceAttributionInput = {
  source?: unknown;
  utmSource?: unknown;
  storedSource?: unknown;
  referrer?: string | null;
  siteOrigin?: string | null;
};

export type PublicAttributionHints = {
  source?: string;
  utmSource?: string;
  referrer?: string;
};

export function normalizeSourceKey(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  return SOURCE_KEY_PATTERN.test(normalized) ? normalized : null;
}

function getOrigin(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

function getReferrerSource(
  referrer: string | null | undefined,
  siteOrigin: string | null | undefined,
) {
  if (!referrer) return null;

  try {
    const url = new URL(referrer);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    const trustedOrigin = getOrigin(siteOrigin);
    if (trustedOrigin && url.origin === trustedOrigin) return null;

    const hostname = url.hostname.toLowerCase();
    for (const [host, source] of REFERRER_HOSTS) {
      if (hostname === host || hostname.endsWith(`.${host}`)) return source;
    }
  } catch {
    return null;
  }

  return null;
}

function firstSafeSource(...values: unknown[]) {
  for (const value of values) {
    const normalized = normalizeSourceKey(value);
    if (normalized && normalized !== UNKNOWN_SOURCE) return normalized;
  }

  return null;
}

export function resolveSourceAttribution(
  input: SourceAttributionInput,
): SourceAttributionResolution {
  const explicitSource = firstSafeSource(input.source);
  if (explicitSource) return { source: explicitSource, reason: "explicit" };

  const utmSource = firstSafeSource(input.utmSource);
  if (utmSource) return { source: utmSource, reason: "utm" };

  const storedSource = firstSafeSource(input.storedSource);
  if (storedSource) return { source: storedSource, reason: "stored" };

  const referrerSource = getReferrerSource(input.referrer, input.siteOrigin);
  if (referrerSource) return { source: referrerSource, reason: "referrer" };

  return { source: UNKNOWN_SOURCE, reason: "unknown" };
}

export function selectReferrerHint(
  clientReferrer: unknown,
  requestReferrer: string | null,
  siteOrigin: string | null,
) {
  const bodyReferrer =
    typeof clientReferrer === "string" &&
    clientReferrer.length <= MAX_REFERRER_HINT_LENGTH
      ? clientReferrer
      : null;
  const bodyResolution = resolveSourceAttribution({
    referrer: bodyReferrer,
    siteOrigin,
  });

  return bodyResolution.reason === "referrer" ? bodyReferrer : requestReferrer;
}

export function shouldPersistResolvedSource(input: {
  source: string;
  userAgentType: "browser" | "crawler" | "unknown";
  status: SourcePersistenceStatus;
  isPreview?: boolean;
}) {
  return (
    !input.isPreview &&
    input.status !== "rejected" &&
    input.source !== UNKNOWN_SOURCE &&
    input.userAgentType !== "crawler"
  );
}

export function getPublicAttributionHints(
  currentUrl: URL,
  referrer: string | null | undefined,
): PublicAttributionHints {
  const source = currentUrl.searchParams.get("source") ?? undefined;
  const utmSource = currentUrl.searchParams.get("utm_source") ?? undefined;
  const hints: PublicAttributionHints = {};

  if (source !== undefined && source.length <= MAX_SOURCE_HINT_LENGTH) {
    hints.source = source;
  }
  if (
    utmSource !== undefined &&
    utmSource.length <= MAX_SOURCE_HINT_LENGTH
  ) {
    hints.utmSource = utmSource;
  }
  if (referrer && referrer.length <= MAX_REFERRER_HINT_LENGTH) {
    hints.referrer = referrer;
  }

  return hints;
}

export function sourceLabel(source: string | null | undefined) {
  switch (normalizeSourceKey(source) ?? UNKNOWN_SOURCE) {
    case "instagram":
      return "Instagram";
    case "telegram":
      return "Telegram";
    case "vk":
      return "VK";
    case "direct":
      return "Прямой переход";
    case UNKNOWN_SOURCE:
      return "Неизвестный источник";
    default: {
      const normalized = normalizeSourceKey(source) ?? UNKNOWN_SOURCE;
      return normalized
        .replace(/[_-]+/g, " ")
        .replace(/^./, (character) => character.toUpperCase());
    }
  }
}
