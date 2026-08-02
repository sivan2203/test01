import assert from "node:assert/strict";
import test from "node:test";

import {
  getPublicAttributionHints,
  resolveSourceAttribution,
  selectReferrerHint,
  shouldPersistResolvedSource,
  sourceLabel,
} from "../src/features/analytics/source-attribution.ts";
import { parsePublicAnalyticsPayload } from "../src/features/analytics/public-ingestion.ts";
import { parseTelegramHandoffRequestBody } from "../src/features/contact/telegram-request.ts";
import { getPublicProductDetailHref } from "../src/features/store/public-attribution-links.ts";

test("uses explicit source before utm_source and stored attribution", () => {
  assert.equal(
    resolveSourceAttribution({
      source: "Instagram",
      utmSource: "telegram",
      storedSource: "vk",
    }).source,
    "instagram",
  );
  assert.equal(
    resolveSourceAttribution({ source: " ", utmSource: "Telegram" }).source,
    "telegram",
  );
  assert.equal(
    resolveSourceAttribution({ storedSource: "Instagram" }).source,
    "instagram",
  );
});

test("keeps safe keys only and falls through unusable values", () => {
  assert.equal(
    resolveSourceAttribution({
      source: "https://instagram.com/campaign?buyer=1",
      utmSource: "bad value",
      storedSource: "too-long-".repeat(10),
      referrer: "https://www.instagram.com/p/123",
    }).source,
    "instagram",
  );
  assert.equal(resolveSourceAttribution({ source: "direct" }).source, "direct");
  assert.equal(resolveSourceAttribution({ source: "" }).source, "unknown");
});

test("maps allowlisted referrers and rejects unknown or same-origin hosts", () => {
  assert.equal(
    resolveSourceAttribution({
      referrer: "https://www.instagram.com/p/123?utm_source=private",
      siteOrigin: "https://shop.example",
    }).source,
    "instagram",
  );
  assert.equal(
    resolveSourceAttribution({
      referrer: "https://t.me/seller",
      siteOrigin: "https://shop.example",
    }).source,
    "telegram",
  );
  assert.equal(
    resolveSourceAttribution({
      referrer: "https://vk.com/example",
      siteOrigin: "https://shop.example",
    }).source,
    "vk",
  );
  assert.equal(
    resolveSourceAttribution({
      referrer: "https://evil.example/?source=telegram",
      siteOrigin: "https://shop.example",
    }).source,
    "unknown",
  );
  assert.equal(
    resolveSourceAttribution({
      referrer: "https://shop.example/lamp-shop",
      siteOrigin: "https://shop.example",
    }).source,
    "unknown",
  );
  assert.equal(resolveSourceAttribution({ referrer: "not a URL" }).source, "unknown");
});

test("does not let unknown stored attribution block a recognized referrer", () => {
  const result = resolveSourceAttribution({
    storedSource: "unknown",
    referrer: "https://telegram.org/seller",
    siteOrigin: "https://shop.example",
  });

  assert.deepEqual(result, { source: "telegram", reason: "referrer" });
});

test("exposes seller labels separately from persisted source keys", () => {
  assert.equal(sourceLabel("instagram"), "Instagram");
  assert.equal(sourceLabel("direct"), "Прямой переход");
  assert.equal(sourceLabel("unknown"), "Неизвестный источник");
  assert.equal(sourceLabel("custom_campaign"), "Custom campaign");
});

test("collects only transient URL and referrer hints", () => {
  assert.deepEqual(
    getPublicAttributionHints(
      new URL("https://shop.example/lamp-shop?source=Instagram&utm_source=telegram"),
      "https://t.me/seller?start=private",
    ),
    {
      source: "Instagram",
      utmSource: "telegram",
      referrer: "https://t.me/seller?start=private",
    },
  );
});

test("falls back from unusable client referrer to the request referrer", () => {
  assert.equal(
    selectReferrerHint(
      "not a URL",
      "https://t.me/seller",
      "https://shop.example",
    ),
    "https://t.me/seller",
  );
  assert.equal(
    selectReferrerHint(
      "https://www.instagram.com/p/123",
      "https://t.me/seller",
      "https://shop.example",
    ),
    "https://www.instagram.com/p/123",
  );
});

test("persists attribution only for accepted non-preview browser events", () => {
  assert.equal(
    shouldPersistResolvedSource({
      source: "instagram",
      status: "recorded",
      userAgentType: "browser",
    }),
    true,
  );
  assert.equal(
    shouldPersistResolvedSource({
      source: "instagram",
      status: "unavailable",
      userAgentType: "unknown",
    }),
    true,
  );
  assert.equal(
    shouldPersistResolvedSource({
      source: "instagram",
      status: "rejected",
      userAgentType: "browser",
    }),
    false,
  );
  assert.equal(
    shouldPersistResolvedSource({
      source: "instagram",
      isPreview: true,
      status: "recorded",
      userAgentType: "browser",
    }),
    false,
  );
});

test("bounds transient attribution hints without rejecting the event", () => {
  const parsed = parsePublicAnalyticsPayload({
    eventName: "store_view",
    referrer: "https://t.me/" + "a".repeat(3000),
    source: "s".repeat(100),
    storeSlug: "lamp-shop",
    utmSource: "u".repeat(100),
  });

  assert.deepEqual(parsed, {
    eventName: "store_view",
    productId: null,
    referrer: null,
    source: null,
    storeSlug: "lamp-shop",
    utmSource: null,
  });

  assert.deepEqual(
    parseTelegramHandoffRequestBody({
      productId: "00000000-0000-0000-0000-000000000000",
      referrer: "https://t.me/" + "a".repeat(3000),
      source: "s".repeat(100),
      storeSlug: "lamp-shop",
      utmSource: "u".repeat(100),
    }),
    {
      productId: "00000000-0000-0000-0000-000000000000",
      storeSlug: "lamp-shop",
    },
  );
});

test("preserves attribution when navigating from storefront to product detail", () => {
  assert.equal(
    getPublicProductDetailHref("lamp-shop", "product-1", false, {
      source: "Instagram",
      utmSource: "telegram",
    }),
    "/lamp-shop/products/product-1?source=Instagram&utm_source=telegram",
  );
  assert.equal(
    getPublicProductDetailHref("lamp-shop", "product-1", true, {
      source: "Instagram",
    }),
    "/lamp-shop/products/product-1?preview=1",
  );
});
