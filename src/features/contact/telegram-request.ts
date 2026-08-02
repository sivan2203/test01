import {
  MAX_REFERRER_HINT_LENGTH,
  MAX_SOURCE_HINT_LENGTH,
} from "../analytics/source-attribution.ts";

export type TelegramHandoffRequestBody = {
  storeSlug: string;
  productId: string;
  source?: string;
  utmSource?: string;
  referrer?: string;
};

export function parseTelegramHandoffRequestBody(
  value: unknown,
): TelegramHandoffRequestBody | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record.storeSlug !== "string" ||
    typeof record.productId !== "string" ||
    record.storeSlug.length === 0 ||
    record.productId.length === 0
  ) {
    return null;
  }

  const source =
    typeof record.source === "string" &&
    record.source.length <= MAX_SOURCE_HINT_LENGTH
      ? record.source
      : undefined;
  const utmSource =
    typeof record.utmSource === "string" &&
    record.utmSource.length <= MAX_SOURCE_HINT_LENGTH
      ? record.utmSource
      : undefined;
  const referrer =
    typeof record.referrer === "string" &&
    record.referrer.length <= MAX_REFERRER_HINT_LENGTH
      ? record.referrer
      : undefined;

  const hints = {
    ...(source !== undefined ? { source } : {}),
    ...(utmSource !== undefined ? { utmSource } : {}),
    ...(referrer !== undefined ? { referrer } : {}),
  };

  return {
    storeSlug: record.storeSlug,
    productId: record.productId,
    ...hints,
  };
}
