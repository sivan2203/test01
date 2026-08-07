import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  getProductAnalyticsUtcWindow,
  mapProductAnalyticsRows,
} from "../src/features/analytics/product-analytics-summary.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const productId = "22222222-2222-4222-8222-222222222222";
const secondProductId = "33333333-3333-4333-8333-333333333333";

function rpcRow(overrides = {}) {
  return {
    period: "today",
    timezone: "Europe/Moscow",
    period_start_utc: "2026-08-01T21:00:00.000Z",
    period_end_utc: "2026-08-02T21:00:00.000Z",
    product_id: productId,
    title: "Лампа",
    status: "published",
    product_views: "4",
    cta_clicks: 2,
    ...overrides,
  };
}

test("maps product analytics rows and keeps zero-valued products", () => {
  assert.deepEqual(
    mapProductAnalyticsRows(
      [
        rpcRow(),
        rpcRow({
          product_id: secondProductId,
          title: "Свеча",
          status: "draft",
          product_views: 0,
          cta_clicks: "0",
        }),
      ],
      "today",
    ),
    {
      status: "found",
      period: "today",
      timezone: "Europe/Moscow",
      periodStartUtc: "2026-08-01T21:00:00.000Z",
      periodEndUtc: "2026-08-02T21:00:00.000Z",
      products: [
        {
          productId,
          title: "Лампа",
          status: "published",
          productViews: 4,
          ctaClicks: 2,
        },
        {
          productId: secondProductId,
          title: "Свеча",
          status: "draft",
          productViews: 0,
          ctaClicks: 0,
        },
      ],
    },
  );
});

test("rejects malformed rows and unsupported periods instead of showing false zeros", () => {
  assert.equal(mapProductAnalyticsRows([rpcRow({ product_views: -1 })], "today"), null);
  assert.equal(mapProductAnalyticsRows([rpcRow({ product_id: "not-a-uuid" })], "today"), null);
  assert.equal(mapProductAnalyticsRows([rpcRow({ period: "last_30_days" })], "today"), null);
  assert.equal(mapProductAnalyticsRows([rpcRow({ title: "" })], "today"), null);
  assert.equal(mapProductAnalyticsRows([rpcRow({ status: "deleted" })], "today"), null);
  assert.equal(
    mapProductAnalyticsRows([rpcRow({ period_start_utc: "2026-08-02" })], "today"),
    null,
  );
  assert.equal(
    mapProductAnalyticsRows([rpcRow({ period_end_utc: "2026-08-02T21:00:00" })], "today"),
    null,
  );
  assert.equal(
    mapProductAnalyticsRows([rpcRow({ period_start_utc: "2026-02-30T21:00:00.000Z" })], "today"),
    null,
  );
  assert.equal(mapProductAnalyticsRows([null], "today"), null);
});

test("accepts the last-seven-days period and calculates local calendar windows", () => {
  assert.equal(
    mapProductAnalyticsRows(
      [
        rpcRow({
          period: "last_7_days",
          period_start_utc: "2026-07-26T21:00:00.000Z",
          period_end_utc: "2026-08-02T21:00:00.000Z",
        }),
      ],
      "last_7_days",
    ).period,
    "last_7_days",
  );
  assert.deepEqual(
    getProductAnalyticsUtcWindow(
      new Date("2026-08-02T20:59:59.000Z"),
      "last_7_days",
      "Europe/Moscow",
    ),
    {
      startUtc: "2026-07-26T21:00:00.000Z",
      endUtc: "2026-08-02T21:00:00.000Z",
    },
  );
  assert.deepEqual(
    getProductAnalyticsUtcWindow(
      new Date("2026-08-02T04:30:00.000Z"),
      "today",
      "Asia/Tokyo",
    ),
    {
      startUtc: "2026-08-01T15:00:00.000Z",
      endUtc: "2026-08-02T15:00:00.000Z",
    },
  );
  assert.deepEqual(
    getProductAnalyticsUtcWindow(
      new Date("2026-03-08T16:00:00.000Z"),
      "today",
      "America/New_York",
    ),
    {
      startUtc: "2026-03-08T05:00:00.000Z",
      endUtc: "2026-03-09T04:00:00.000Z",
    },
  );
  assert.deepEqual(
    getProductAnalyticsUtcWindow(
      new Date("2026-03-08T16:00:00.000Z"),
      "last_7_days",
      "America/New_York",
    ),
    {
      startUtc: "2026-03-02T05:00:00.000Z",
      endUtc: "2026-03-09T04:00:00.000Z",
    },
  );
});

test("product analytics migration is seller-scoped and aggregate-only", () => {
  const migration = fs.readFileSync(
    path.join(
      projectRoot,
      "supabase/migrations/20260802140000_product_analytics_summary.sql",
    ),
    "utf8",
  );

  assert.match(migration, /create or replace function public\.get_seller_product_analytics_summary/i);
  assert.match(migration, /auth\.uid\(\)/i);
  assert.match(migration, /stores\.seller_id\s*=\s*auth\.uid\(\)/i);
  assert.match(migration, /products\.status\s*<>\s*'deleted'/i);
  assert.match(migration, /product_id/i);
  assert.match(migration, /event_name\s+in\s*\('product_view',\s*'cta_click'\)/i);
  assert.match(migration, /excluded_reason\s+is\s+null/i);
  assert.match(migration, /period_start_utc\s+timestamptz/i);
  assert.match(migration, /period_end_utc\s+timestamptz/i);
  assert.match(migration, /set search_path\s*=\s*''/i);
  assert.match(migration, /grant execute .* authenticated/is);
  assert.doesNotMatch(migration, /grant execute .* anon/is);
  assert.match(
    migration,
    /join public\.products as products\s+on products\.store_id = store_window\.id\s+and products\.status <> 'deleted'/is,
  );
  assert.match(
    migration,
    /left join public\.analytics_events as analytics_events\s+on analytics_events\.store_id = store_window\.id\s+and analytics_events\.product_id = products\.id\s+and analytics_events\.event_name in \('product_view', 'cta_click'\)\s+and analytics_events\.excluded_reason is null/is,
  );
});

test("seller product analytics query stays on the SSR user boundary", () => {
  const query = fs.readFileSync(
    path.join(projectRoot, "src/features/analytics/product-analytics.ts"),
    "utf8",
  );

  assert.match(query, /createSupabaseServerClient/);
  assert.match(query, /get_seller_product_analytics_summary/);
  assert.match(query, /getCurrentSellerStoreProfile/);
  assert.match(query, /if \(!Array\.isArray\(data\)\)/);
  assert.doesNotMatch(query, /data \?\? \[\]/);
  assert.doesNotMatch(query, /service-role/);
});

test("analytics detail route keeps periods explicit and excludes public/raw analytics", () => {
  const page = fs.readFileSync(
    path.join(projectRoot, "src/app/(seller)/seller/(admin)/analytics/page.tsx"),
    "utf8",
  );
  const view = fs.readFileSync(
    path.join(projectRoot, "src/features/analytics/product-analytics-view.tsx"),
    "utf8",
  );

  assert.match(page, /searchParams: Promise/);
  assert.match(page, /getSellerProductAnalyticsSummary/);
  assert.match(page, /redirect\("\/seller\/sign-in/);
  assert.doesNotMatch(page, /api\/analytics/);
  assert.match(view, /Последние 7 дней/);
  assert.match(view, /Сегодня/);
  assert.match(view, /productViews/);
  assert.match(view, /ctaClicks/);
  assert.match(view, /activePeriod/);
  assert.match(view, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(view, /Сводка за период: \$\{periodLabel\}/);
  assert.match(view, /Период: \$\{periodLabel\}/);
  assert.match(view, /break-words/);
  assert.match(view, /min-h-11/);
  assert.doesNotMatch(view, /30 дней/);
});

test("product analytics surface preserves zero, empty, retry, and aggregate-only states", () => {
  const view = fs.readFileSync(
    path.join(projectRoot, "src/features/analytics/product-analytics-view.tsx"),
    "utf8",
  );

  assert.match(view, /<Alert[^>]*tone="danger"/);
  assert.match(view, /Обновить/);
  assert.match(view, /<EmptyState/);
  assert.match(view, /totalViews/);
  assert.match(view, /aria-label/);
  assert.match(view, /Последние 7 дней/);
  assert.doesNotMatch(view, /occurred_at|referrer|buyer_identity|session_id/);
});

test("product analytics does not alter public ingestion or home summary boundaries", () => {
  const packageJson = fs.readFileSync(path.join(projectRoot, "package.json"), "utf8");
  const publicRoute = fs.readFileSync(
    path.join(projectRoot, "src/app/api/analytics/route.ts"),
    "utf8",
  );
  const homeQuery = fs.readFileSync(
    path.join(projectRoot, "src/features/analytics/seller-home-analytics.ts"),
    "utf8",
  );

  assert.match(packageJson, /product-analytics-contract\.test\.mjs/);
  assert.match(publicRoute, /recordPublicAnalyticsEvent/);
  assert.match(homeQuery, /get_seller_home_analytics_summary/);
});
