import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCtaClickEvent,
  normalizeAnalyticsSource,
} from "../src/features/analytics/cta-click.ts";

test("normalizes stable source labels and uses unknown for absent input", () => {
  assert.equal(normalizeAnalyticsSource(" Telegram " ), "telegram");
  assert.equal(normalizeAnalyticsSource("utm_campaign"), "utm_campaign");
  assert.equal(normalizeAnalyticsSource(""), "unknown");
  assert.equal(normalizeAnalyticsSource(undefined), "unknown");
  assert.equal(normalizeAnalyticsSource("Телеграм"), "unknown");
});

test("builds an observed cta_click event with UTC timestamp and optional metadata", () => {
  assert.deepEqual(
    buildCtaClickEvent({
      storeId: "11111111-1111-4111-8111-111111111111",
      productId: "22222222-2222-4222-8222-222222222222",
      source: "Telegram",
      sessionId: "33333333-3333-4333-8333-333333333333",
      occurredAt: "2026-08-02T12:00:00.000Z",
    }),
    {
      eventName: "cta_click",
      storeId: "11111111-1111-4111-8111-111111111111",
      productId: "22222222-2222-4222-8222-222222222222",
      source: "telegram",
      sessionId: "33333333-3333-4333-8333-333333333333",
      occurredAt: "2026-08-02T12:00:00.000Z",
      excludedReason: null,
    },
  );
});

test("does not count seller preview as a public buyer event", () => {
  assert.equal(
    buildCtaClickEvent({
      storeId: "11111111-1111-4111-8111-111111111111",
      productId: "22222222-2222-4222-8222-222222222222",
      isPreview: true,
    }),
    null,
  );
});
