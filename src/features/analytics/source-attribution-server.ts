import "server-only";

import {
  MAX_SOURCE_HINT_LENGTH,
  SOURCE_ATTRIBUTION_COOKIE,
  UNKNOWN_SOURCE,
  normalizeSourceKey,
  resolveSourceAttribution,
  selectReferrerHint,
  type SourceAttributionResolution,
} from "./source-attribution.ts";

const SOURCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type ReadableCookieStore = {
  get: (name: string) => { value: string } | undefined;
};

export type WritableCookieStore = ReadableCookieStore & {
  set: (
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      maxAge: number;
      path: "/";
      sameSite: "lax";
      secure: boolean;
    },
  ) => void;
};

export type SourceAttributionHints = {
  source?: unknown;
  utmSource?: unknown;
  referrer?: string | null;
};

function getSourceHint(value: unknown) {
  return typeof value === "string" && value.length <= MAX_SOURCE_HINT_LENGTH
    ? value
    : undefined;
}

export function readStoredSource(cookieStore: ReadableCookieStore) {
  const value = normalizeSourceKey(
    cookieStore.get(SOURCE_ATTRIBUTION_COOKIE)?.value,
  );
  return value && value !== UNKNOWN_SOURCE ? value : null;
}

export function getRequestSiteOrigin(request: Request) {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredOrigin) {
    try {
      const url = new URL(configuredOrigin);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.origin;
      }
    } catch {
      // Fall back to the origin supplied by the current request.
    }
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return null;
  }
}

export function resolveRequestSource(
  request: Request,
  cookieStore: ReadableCookieStore,
  hints: SourceAttributionHints = {},
): SourceAttributionResolution {
  const siteOrigin = getRequestSiteOrigin(request);
  return resolveSourceAttribution({
    source: getSourceHint(hints.source),
    utmSource: getSourceHint(hints.utmSource),
    storedSource: readStoredSource(cookieStore),
    referrer: selectReferrerHint(
      hints.referrer,
      request.headers.get("referer"),
      siteOrigin,
    ),
    siteOrigin,
  });
}

export function persistSourceAttribution(
  cookieStore: WritableCookieStore,
  source: string,
) {
  const normalized = normalizeSourceKey(source);
  if (!normalized || normalized === UNKNOWN_SOURCE) return false;

  cookieStore.set(SOURCE_ATTRIBUTION_COOKIE, normalized, {
    httpOnly: true,
    maxAge: SOURCE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return true;
}

export function clearSourceAttribution(cookieStore: WritableCookieStore) {
  cookieStore.set(SOURCE_ATTRIBUTION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
