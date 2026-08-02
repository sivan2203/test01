import { normalizeSourceKey } from "./source-attribution.ts";

export const DEFAULT_STORE_TIMEZONE = "Europe/Moscow";

export type SellerHomeAnalyticsSummary = {
  status: "found";
  timezone: string;
  dayStartUtc: string;
  dayEndUtc: string;
  storeViews: number;
  productViews: number;
  ctaClicks: number;
  topSource: string | null;
};

export type SellerHomeAnalyticsRpcRow = {
  timezone?: unknown;
  day_start_utc?: unknown;
  day_end_utc?: unknown;
  store_views?: unknown;
  product_views?: unknown;
  cta_clicks?: unknown;
  top_source?: unknown;
};

function normalizeTimezone(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return DEFAULT_STORE_TIMEZONE;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return value;
  } catch {
    return DEFAULT_STORE_TIMEZONE;
  }
}

function normalizeNonNegativeInteger(value: unknown) {
  const normalized =
    typeof value === "number" && Number.isInteger(value)
      ? value
      : typeof value === "string" && /^\d+$/.test(value.trim())
        ? Number(value)
        : NaN;

  return Number.isSafeInteger(normalized) && normalized >= 0
    ? normalized
    : null;
}

function normalizeUtcTimestamp(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

export function mapSellerHomeAnalyticsRow(
  row: SellerHomeAnalyticsRpcRow | null | undefined,
): SellerHomeAnalyticsSummary | null {
  if (!row) return null;

  const storeViews = normalizeNonNegativeInteger(row.store_views);
  const productViews = normalizeNonNegativeInteger(row.product_views);
  const ctaClicks = normalizeNonNegativeInteger(row.cta_clicks);
  const dayStartUtc = normalizeUtcTimestamp(row.day_start_utc);
  const dayEndUtc = normalizeUtcTimestamp(row.day_end_utc);
  if (
    storeViews === null ||
    productViews === null ||
    ctaClicks === null ||
    dayStartUtc === null ||
    dayEndUtc === null
  ) {
    return null;
  }

  const topSource =
    row.top_source === null || row.top_source === undefined
      ? null
      : normalizeSourceKey(row.top_source);
  if (row.top_source !== null && row.top_source !== undefined && !topSource) {
    return null;
  }

  return {
    status: "found",
    timezone: normalizeTimezone(row.timezone),
    dayStartUtc,
    dayEndUtc,
    storeViews,
    productViews,
    ctaClicks,
    topSource,
  };
}

export function rankTopSource(
  rows: ReadonlyArray<{ source: unknown; count: unknown }>,
) {
  const ranked = rows
    .map((row) => ({
      source: normalizeSourceKey(row.source),
      count: normalizeNonNegativeInteger(row.count),
    }))
    .filter(
      (row): row is { source: string; count: number } =>
        row.source !== null && row.count !== null && row.count > 0,
    )
    .sort(
      (left, right) =>
        right.count - left.count || left.source.localeCompare(right.source),
    );

  return ranked[0]?.source ?? null;
}

export type StoreLocalDate = {
  year: number;
  month: number;
  day: number;
};

export function getStoreLocalDateParts(
  date: Date,
  timeZone = DEFAULT_STORE_TIMEZONE,
): StoreLocalDate {
  const safeTimeZone = normalizeTimezone(timeZone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
  };
}

function getTimezoneOffsetMs(utcMilliseconds: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(utcMilliseconds));
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  const localAsUtc = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
    values.second,
  );

  return localAsUtc - Math.floor(utcMilliseconds / 1000) * 1000;
}

export function shiftStoreLocalDate(dateParts: StoreLocalDate, days: number): StoreLocalDate {
  const shifted = new Date(
    Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day),
  );
  shifted.setUTCDate(shifted.getUTCDate() + days);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

export function getStoreLocalMidnightUtc(
  dateParts: StoreLocalDate,
  timeZone = DEFAULT_STORE_TIMEZONE,
) {
  const safeTimeZone = normalizeTimezone(timeZone);
  const localAsUtc = Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
  );
  let utcMilliseconds = localAsUtc;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    utcMilliseconds =
      localAsUtc - getTimezoneOffsetMs(utcMilliseconds, safeTimeZone);
  }

  return new Date(utcMilliseconds);
}

export function getTodayUtcWindow(now: Date, timeZone = DEFAULT_STORE_TIMEZONE) {
  const today = getStoreLocalDateParts(now, timeZone);
  const start = getStoreLocalMidnightUtc(today, timeZone);
  const end = getStoreLocalMidnightUtc(shiftStoreLocalDate(today, 1), timeZone);

  return {
    startUtc: start.toISOString(),
    endUtc: end.toISOString(),
  };
}
