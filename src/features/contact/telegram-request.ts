export type TelegramHandoffRequestBody = {
  storeSlug: string;
  productId: string;
  source?: string;
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

  return {
    storeSlug: record.storeSlug,
    productId: record.productId,
    source: typeof record.source === "string" ? record.source : undefined,
  };
}
