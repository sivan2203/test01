import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  ANALYTICS_EVENT_NAMES,
  buildAnalyticsEvent,
  classifyAnalyticsUserAgent,
  isCanonicalUtcTimestamp,
  normalizeAnalyticsSource,
  normalizeAnalyticsSessionId,
} from "../src/features/analytics/event-contract.ts";
import { prepareTelegramHandoffWithDependencies } from "../src/features/contact/handoff-service.ts";
import {
  parsePublicAnalyticsPayload,
  recordPublicAnalyticsEventWithDependencies,
} from "../src/features/analytics/public-ingestion.ts";

const storeId = "11111111-1111-4111-8111-111111111111";
const productId = "22222222-2222-4222-8222-222222222222";
const sessionId = "33333333-3333-4333-8333-333333333333";

test("defines the canonical event catalog and normalizes safe metadata", () => {
  assert.deepEqual(ANALYTICS_EVENT_NAMES, ["store_view", "product_view", "cta_click"]);
  assert.equal(normalizeAnalyticsSource(" Telegram "), "telegram");
  assert.equal(normalizeAnalyticsSource("https://buyer.example"), "unknown");
  assert.equal(normalizeAnalyticsSessionId(sessionId), sessionId);
  assert.equal(normalizeAnalyticsSessionId("not-a-uuid"), null);
  assert.equal(isCanonicalUtcTimestamp("2026-08-02T12:00:00.000Z"), true);
  assert.equal(isCanonicalUtcTimestamp("2026-08-02T15:00:00+03:00"), false);
});

test("accepts only valid event/context combinations", () => {
  assert.equal(
    buildAnalyticsEvent({
      eventName: "store_view",
      storeId,
      storeSlug: "lamp-shop",
      occurredAt: "2026-08-02T12:00:00.000Z",
    }).productId,
    null,
  );
  assert.equal(
    buildAnalyticsEvent({
      eventName: "product_view",
      storeId,
      storeSlug: "lamp-shop",
      productId,
      occurredAt: "2026-08-02T12:00:00.000Z",
    }).productId,
    productId,
  );
  assert.throws(
    () =>
      buildAnalyticsEvent({
        eventName: "store_view",
        storeId,
        storeSlug: "lamp-shop",
        productId,
      }),
    /store_view/i,
  );
  assert.throws(
    () =>
      buildAnalyticsEvent({
        eventName: "cta_click",
        storeId,
        storeSlug: "lamp-shop",
        productId,
      }),
    /telegram/i,
  );
});

test("classifies crawler observations for inspectable exclusion", () => {
  assert.equal(classifyAnalyticsUserAgent("Mozilla/5.0 Chrome/123"), "browser");
  assert.equal(classifyAnalyticsUserAgent("Googlebot/2.1 (+http://google.com/bot.html)"), "crawler");
  assert.equal(classifyAnalyticsUserAgent("Google-InspectionTool/1.0"), "crawler");
  assert.equal(classifyAnalyticsUserAgent(""), "unknown");
});

test("rejects unsupported runtime event names", () => {
  assert.throws(
    () =>
      buildAnalyticsEvent({
        eventName: "unknown_event",
        storeId,
        storeSlug: "lamp-shop",
      }),
    /supported event name/i,
  );
});

test("parses only the public view payload and ignores preview opt-out fields", () => {
  assert.deepEqual(
    parsePublicAnalyticsPayload({
      eventName: "product_view",
      storeSlug: "lamp-shop",
      productId,
      isPreview: true,
    }),
    { eventName: "product_view", storeSlug: "lamp-shop", productId, source: null },
  );
  assert.equal(parsePublicAnalyticsPayload(null), null);
  assert.equal(parsePublicAnalyticsPayload([]), null);
  assert.equal(parsePublicAnalyticsPayload({ eventName: "cta_click", storeSlug: "lamp-shop" }), null);
  assert.equal(parsePublicAnalyticsPayload({ eventName: "store_view", storeSlug: "api" }), null);
  assert.equal(
    parsePublicAnalyticsPayload({ eventName: "product_view", storeSlug: "lamp-shop" }),
    null,
  );
});

test("maps views to server-owned RPCs and makes boundary failures observable", async () => {
  const calls = [];
  const recorded = await recordPublicAnalyticsEventWithDependencies(
    {
      eventName: "product_view",
      storeSlug: "lamp-shop",
      productId,
      source: "telegram",
      sessionId,
      userAgentType: "browser",
    },
    {
      rpc: async (name, args) => {
        calls.push([name, args]);
        return { data: { event_id: "event-1", deduplicated: false }, error: null };
      },
    },
  );

  assert.deepEqual(recorded, { status: "recorded", eventId: "event-1" });
  assert.deepEqual(calls, [[
    "record_public_product_view",
    {
      store_slug: "lamp-shop",
      target_product_id: productId,
      event_source: "telegram",
      event_session_id: sessionId,
      event_user_agent_type: "browser",
    },
  ]]);

  const rejected = await recordPublicAnalyticsEventWithDependencies(
    {
      eventName: "product_view",
      storeSlug: "lamp-shop",
      productId,
      source: "unknown",
      sessionId: null,
      userAgentType: "browser",
    },
    { rpc: async () => ({ data: null, error: new Error("cross-store or hidden product") }) },
  );
  assert.deepEqual(rejected, { status: "rejected" });

  const deduplicated = await recordPublicAnalyticsEventWithDependencies(
    {
      eventName: "store_view",
      storeSlug: "lamp-shop",
      productId: null,
      source: null,
      sessionId,
      userAgentType: "browser",
    },
    {
      rpc: async (name, args) => {
        assert.equal(name, "record_public_store_view");
        assert.equal(args.event_user_agent_type, "browser");
        return { data: { event_id: "event-1", deduplicated: true }, error: null };
      },
    },
  );
  assert.deepEqual(deduplicated, { status: "deduplicated", eventId: "event-1" });
});

test("keeps the public route and migration inside the intended security boundary", () => {
  const route = readFileSync("src/app/api/analytics/route.ts", "utf8");
  const migration = readFileSync(
    "supabase/migrations/20260802120000_complete_analytics_ingestion.sql",
    "utf8",
  );

  assert.match(route, /await cookies\(\)/);
  assert.match(route, /buyer_session_id/);
  assert.match(route, /crypto\.randomUUID/);
  assert.doesNotMatch(route, /isPreview/);
  assert.match(migration, /alter table public\.analytics_events enable row level security/);
  assert.match(migration, /revoke all on table public\.analytics_events from anon, authenticated/);
  assert.match(migration, /store_view/);
  assert.match(migration, /product_view/);
  assert.match(migration, /cta_click/);
  assert.match(migration, /user_agent_type/);
  assert.match(migration, /messenger_type/);
  assert.match(migration, /interval '30 seconds'/);
  assert.match(migration, /interval '3 seconds'/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /excluded_reason is null/);
  assert.match(migration, /set messenger_type = 'telegram'/);
  assert.match(migration, /grant execute on function public\.record_public_store_view[^\n]*\n[^\n]*to service_role/);
  assert.match(migration, /grant execute on function public\.record_public_product_view[^\n]*\n[^\n]*to service_role/);
  assert.match(migration, /grant execute on function public\.record_public_cta_click[^\n]*\n[^\n]*to service_role/);
  assert.doesNotMatch(migration, /grant execute on function public\.record_public_(?:store_view|product_view|cta_click)[\s\S]*?to anon, authenticated/);
  assert.match(migration, /current_setting\('request\.jwt\.claim\.role'/);
  assert.match(migration, /products\.status = 'published'/);
  assert.match(migration, /stores\.telegram_username is not null/);
  assert.match(migration, /excluded_reason/);
  assert.doesNotMatch(migration, /update public\.analytics_events\s+set\s+count/i);
});

test("mounts one beacon only on successful public buyer boundaries", () => {
  const storePage = readFileSync("src/app/(public)/[storeSlug]/page.tsx", "utf8");
  const productPage = readFileSync(
    "src/app/(public)/[storeSlug]/products/[productId]/page.tsx",
    "utf8",
  );
  const previewPage = readFileSync(
    "src/app/(seller)/seller/(admin)/store/preview/page.tsx",
    "utf8",
  );
  const beacon = readFileSync("src/features/analytics/public-analytics-beacon.tsx", "utf8");
  const cta = readFileSync("src/features/store/public-contact-cta.tsx", "utf8");

  assert.equal((storePage.match(/<PublicAnalyticsBeacon/g) ?? []).length, 1);
  assert.equal((productPage.match(/<PublicAnalyticsBeacon/g) ?? []).length, 1);
  assert.match(productPage, /authorizedPreview \? null/);
  assert.doesNotMatch(previewPage, /PublicAnalyticsBeacon|\/api\/analytics/);
  assert.match(beacon, /useRef\(false\)/);
  assert.match(beacon, /fetch\("\/api\/analytics"/);
  assert.match(beacon, /\.catch\(\(\) =>/);
  assert.doesNotMatch(beacon, /createSupabaseServiceRoleClient|service-role/);
  assert.match(cta, /disabled=\{!contactConfigured/);
});

test("keeps Telegram handoff usable when CTA analytics rejects", async () => {
  const result = await prepareTelegramHandoffWithDependencies(
    {
      storeSlug: "lamp-shop",
      productId,
      origin: "https://buyer.example",
    },
    {
      getStore: async () => ({
        status: "found",
        store: {
          slug: "lamp-shop",
          contactConfigured: true,
          telegramUsername: "seller_name",
        },
      }),
      getProduct: async () => ({
        status: "found",
        product: {
          id: productId,
          title: "Lamp",
          priceMode: "request",
          priceAmount: null,
        },
      }),
      recordCtaClick: async () => {
        throw new Error("analytics unavailable");
      },
      buildHandoff: () => ({
        message: "hello",
        productUrl: "https://buyer.example/lamp-shop/products/product",
        url: "https://t.me/seller_name",
      }),
    },
  );

  assert.equal(result.status, "ready");
});
