import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  getTodayUtcWindow,
  mapSellerHomeAnalyticsRow,
  rankTopSource,
} from "../src/features/analytics/seller-home-summary.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

test("maps one seller home aggregate row into the typed summary", () => {
  assert.deepEqual(
    mapSellerHomeAnalyticsRow({
      timezone: "Europe/Moscow",
      day_start_utc: "2026-08-01T21:00:00.000Z",
      day_end_utc: "2026-08-02T21:00:00.000Z",
      store_views: 42,
      product_views: "17",
      cta_clicks: 3,
      top_source: "Telegram",
    }),
    {
      status: "found",
      timezone: "Europe/Moscow",
      dayStartUtc: "2026-08-01T21:00:00.000Z",
      dayEndUtc: "2026-08-02T21:00:00.000Z",
      storeViews: 42,
      productViews: 17,
      ctaClicks: 3,
      topSource: "telegram",
    },
  );
});

test("normalizes valid RPC timestamp variants", () => {
  assert.deepEqual(
    mapSellerHomeAnalyticsRow({
      timezone: "Europe/Moscow",
      day_start_utc: "2026-08-01T21:00:00+00:00",
      day_end_utc: "2026-08-02T21:00:00+00:00",
      store_views: "42",
      product_views: "17",
      cta_clicks: "3",
      top_source: "telegram",
    }),
    {
      status: "found",
      timezone: "Europe/Moscow",
      dayStartUtc: "2026-08-01T21:00:00.000Z",
      dayEndUtc: "2026-08-02T21:00:00.000Z",
      storeViews: 42,
      productViews: 17,
      ctaClicks: 3,
      topSource: "telegram",
    },
  );
});

test("keeps a valid zero summary and rejects malformed aggregate rows", () => {
  assert.deepEqual(
    mapSellerHomeAnalyticsRow({
      timezone: "",
      day_start_utc: "2026-08-01T21:00:00.000Z",
      day_end_utc: "2026-08-02T21:00:00.000Z",
      store_views: 0,
      product_views: 0,
      cta_clicks: 0,
      top_source: null,
    }),
    {
      status: "found",
      timezone: "Europe/Moscow",
      dayStartUtc: "2026-08-01T21:00:00.000Z",
      dayEndUtc: "2026-08-02T21:00:00.000Z",
      storeViews: 0,
      productViews: 0,
      ctaClicks: 0,
      topSource: null,
    },
  );

  assert.equal(
    mapSellerHomeAnalyticsRow({
      timezone: "Europe/Moscow",
      day_start_utc: "2026-08-01T21:00:00.000Z",
      day_end_utc: "2026-08-02T21:00:00.000Z",
      store_views: -1,
      product_views: 0,
      cta_clicks: 0,
      top_source: null,
    }),
    null,
  );
});

test("ranks top source by store-view count with a stable source-key tie break", () => {
  assert.equal(
    rankTopSource([
      { source: "telegram", count: 4 },
      { source: "instagram", count: 4 },
      { source: "unknown", count: 1 },
    ]),
    "instagram",
  );
  assert.equal(rankTopSource([]), null);
});

test("calculates UTC boundaries from the store local calendar day", () => {
  assert.deepEqual(
    getTodayUtcWindow(new Date("2026-08-02T20:59:59.000Z"), "Europe/Moscow"),
    {
      startUtc: "2026-08-01T21:00:00.000Z",
      endUtc: "2026-08-02T21:00:00.000Z",
    },
  );
  assert.deepEqual(
    getTodayUtcWindow(new Date("2026-08-02T04:30:00.000Z"), "Asia/Tokyo"),
    {
      startUtc: "2026-08-01T15:00:00.000Z",
      endUtc: "2026-08-02T15:00:00.000Z",
    },
  );
  assert.deepEqual(
    getTodayUtcWindow(new Date("2026-03-08T16:00:00.000Z"), "America/New_York"),
    {
      startUtc: "2026-03-08T05:00:00.000Z",
      endUtc: "2026-03-09T04:00:00.000Z",
    },
  );
});

test("seller summary RPC is ownership-scoped and derives from eligible ledger rows", () => {
  const migration = fs.readFileSync(
    path.join(
      projectRoot,
      "supabase/migrations/20260802130000_seller_home_analytics.sql",
    ),
    "utf8",
  );

  assert.match(migration, /create or replace function public\.get_seller_home_analytics_summary/i);
  assert.match(migration, /auth\.uid\(\)/i);
  assert.match(migration, /stores\.seller_id\s*=\s*auth\.uid\(\)/i);
  assert.match(migration, /source_events\.store_id\s*=\s*store_window\.id/i);
  assert.match(migration, /analytics_events\.store_id\s*=\s*store_window\.id/i);
  assert.match(migration, /day_start_utc\s+timestamptz/i);
  assert.match(migration, /excluded_reason is null/i);
  assert.match(migration, /event_name = 'store_view'/i);
  assert.match(migration, /event_name = 'product_view'/i);
  assert.match(migration, /event_name = 'cta_click'/i);
  assert.match(migration, /order by count\(\*\) desc, (?:source_events\.)?source asc/i);
  assert.match(migration, /set search_path = ''/i);
  assert.match(migration, /grant execute .* authenticated/is);
  assert.doesNotMatch(migration, /grant execute .* anon/is);
});

test("seller summary query stays on the SSR user boundary", () => {
  const query = fs.readFileSync(
    path.join(projectRoot, "src/features/analytics/seller-home-analytics.ts"),
    "utf8",
  );

  assert.match(query, /createSupabaseServerClient/);
  assert.match(query, /get_seller_home_analytics_summary/);
  assert.doesNotMatch(query, /service-role/);
});

test("analytics summary widget exposes primary, secondary, zero and accessible states", () => {
  const widget = fs.readFileSync(
    path.join(
      projectRoot,
      "src/features/analytics/analytics-summary-widget.tsx",
    ),
    "utf8",
  );

  assert.match(widget, /Просмотры магазина сегодня/);
  assert.match(widget, /Просмотры товаров/);
  assert.match(widget, /Переходы в Telegram/);
  assert.match(widget, /Лучший источник/);
  assert.match(widget, /aria-label|aria-labelledby/);
  assert.match(widget, /router\.refresh/);
  assert.match(widget, /break-words/);
  assert.match(widget, /Поделитесь ссылкой|Поделиться ссылкой/);
  assert.doesNotMatch(widget, /7 дней|30 дней|график|chart/i);
});

test("seller home wires authenticated store and summary states without exposing a public endpoint", () => {
  const page = fs.readFileSync(
    path.join(
      projectRoot,
      "src/app/(seller)/seller/(admin)/page.tsx",
    ),
    "utf8",
  );

  assert.match(page, /getCurrentSellerStoreProfile/);
  assert.match(page, /getSellerHomeAnalyticsSummary/);
  assert.match(page, /AnalyticsSummaryWidget/);
  assert.match(page, /AnalyticsSummaryError/);
  assert.match(page, /StoreProfileError/);
  assert.match(page, /shareLabel/);
  assert.match(page, /break-words/);
  assert.match(page, /redirect\("\/seller\/sign-in/);
  assert.doesNotMatch(page, /api\/analytics/);
});
