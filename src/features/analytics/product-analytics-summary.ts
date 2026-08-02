import { isAnalyticsUuid } from "./event-contract.ts";
import {
  DEFAULT_STORE_TIMEZONE,
  getStoreLocalDateParts,
  getStoreLocalMidnightUtc,
  shiftStoreLocalDate,
} from "./seller-home-summary.ts";

export const PRODUCT_ANALYTICS_PERIODS = ["today", "last_7_days"] as const;
export type ProductAnalyticsPeriod = (typeof PRODUCT_ANALYTICS_PERIODS)[number];

export type ProductAnalyticsSummary = {
  productId: string;
  title: string;
  status: "draft" | "published" | "hidden";
  productViews: number;
  ctaClicks: number;
};

export type SellerProductAnalyticsSummary = {
  status: "found";
  period: ProductAnalyticsPeriod;
  timezone: string;
  periodStartUtc: string;
  periodEndUtc: string;
  products: ProductAnalyticsSummary[];
};

export type ProductAnalyticsRpcRow = {
  period?: unknown;
  timezone?: unknown;
  period_start_utc?: unknown;
  period_end_utc?: unknown;
  product_id?: unknown;
  title?: unknown;
  status?: unknown;
  product_views?: unknown;
  cta_clicks?: unknown;
};

type ProductAnalyticsWindow = {
  timezone: string;
  periodStartUtc: string;
  periodEndUtc: string;
};

const PRODUCT_ANALYTICS_STATUS_VALUES = [
  "draft",
  "published",
  "hidden",
] as const;

function isProductAnalyticsPeriod(value: unknown): value is ProductAnalyticsPeriod {
  return PRODUCT_ANALYTICS_PERIODS.includes(value as ProductAnalyticsPeriod);
}

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
  if (
    typeof value !== "string" ||
    !/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d{1,3})?(?:Z|\+00:00)$/.test(value)
  ) {
    return null;
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;

  const normalized = new Date(parsed).toISOString();
  return normalized.slice(0, 19) === value.slice(0, 19) ? normalized : null;
}

function normalizeProductStatus(value: unknown): ProductAnalyticsSummary["status"] | null {
  return PRODUCT_ANALYTICS_STATUS_VALUES.includes(
    value as ProductAnalyticsSummary["status"],
  )
    ? (value as ProductAnalyticsSummary["status"])
    : null;
}

export function getProductAnalyticsUtcWindow(
  now: Date,
  period: ProductAnalyticsPeriod,
  timeZone = DEFAULT_STORE_TIMEZONE,
) {
  const today = getStoreLocalDateParts(now, timeZone);
  const startDate = shiftStoreLocalDate(
    today,
    period === "last_7_days" ? -6 : 0,
  );
  const endDate = shiftStoreLocalDate(today, 1);

  return {
    startUtc: getStoreLocalMidnightUtc(startDate, timeZone).toISOString(),
    endUtc: getStoreLocalMidnightUtc(endDate, timeZone).toISOString(),
  };
}

export function mapProductAnalyticsRows(
  rows: ReadonlyArray<ProductAnalyticsRpcRow>,
  period: ProductAnalyticsPeriod,
  emptyStateWindow?: ProductAnalyticsWindow,
): SellerProductAnalyticsSummary | null {
  if (!isProductAnalyticsPeriod(period)) return null;

  if (rows.length === 0) {
    if (!emptyStateWindow) return null;

    const periodStartUtc = normalizeUtcTimestamp(emptyStateWindow.periodStartUtc);
    const periodEndUtc = normalizeUtcTimestamp(emptyStateWindow.periodEndUtc);
    if (!periodStartUtc || !periodEndUtc || periodStartUtc >= periodEndUtc) {
      return null;
    }

    return {
      status: "found",
      period,
      timezone: normalizeTimezone(emptyStateWindow.timezone),
      periodStartUtc,
      periodEndUtc,
      products: [],
    };
  }

  const firstRow = rows[0];
  if (
    !firstRow ||
    typeof firstRow !== "object" ||
    firstRow.period !== period ||
    typeof firstRow.timezone !== "string" ||
    !firstRow.timezone.trim()
  ) {
    return null;
  }

  const timezone = normalizeTimezone(firstRow.timezone);
  const periodStartUtc = normalizeUtcTimestamp(firstRow.period_start_utc);
  const periodEndUtc = normalizeUtcTimestamp(firstRow.period_end_utc);
  if (!periodStartUtc || !periodEndUtc || periodStartUtc >= periodEndUtc) {
    return null;
  }

  const productIds = new Set<string>();
  const products: ProductAnalyticsSummary[] = [];

  for (const row of rows) {
    if (!row || typeof row !== "object") return null;

    const productStatus = normalizeProductStatus(row.status);
    const productViews = normalizeNonNegativeInteger(row.product_views);
    const ctaClicks = normalizeNonNegativeInteger(row.cta_clicks);
    const rowStartUtc = normalizeUtcTimestamp(row.period_start_utc);
    const rowEndUtc = normalizeUtcTimestamp(row.period_end_utc);

    if (
      row.period !== period ||
      row.timezone !== firstRow.timezone ||
      rowStartUtc !== periodStartUtc ||
      rowEndUtc !== periodEndUtc ||
      typeof row.product_id !== "string" ||
      !isAnalyticsUuid(row.product_id) ||
      productIds.has(row.product_id) ||
      typeof row.title !== "string" ||
      !row.title.trim() ||
      productStatus === null ||
      productViews === null ||
      ctaClicks === null
    ) {
      return null;
    }

    productIds.add(row.product_id);
    products.push({
      productId: row.product_id,
      title: row.title.trim(),
      status: productStatus,
      productViews,
      ctaClicks,
    });
  }

  return {
    status: "found",
    period,
    timezone,
    periodStartUtc,
    periodEndUtc,
    products,
  };
}
