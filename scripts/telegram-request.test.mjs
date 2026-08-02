import assert from "node:assert/strict";
import test from "node:test";

import { parseTelegramHandoffRequestBody } from "../src/features/contact/telegram-request.ts";

test("rejects null, arrays, and incomplete handoff payloads", () => {
  assert.equal(parseTelegramHandoffRequestBody(null), null);
  assert.equal(parseTelegramHandoffRequestBody([]), null);
  assert.equal(parseTelegramHandoffRequestBody({ storeSlug: "shop" }), null);
  assert.equal(
    parseTelegramHandoffRequestBody({ storeSlug: "", productId: "product" }),
    null,
  );
});

test("parses only server-relevant handoff fields", () => {
  assert.deepEqual(
    parseTelegramHandoffRequestBody({
      storeSlug: "lamp-shop",
      productId: "11111111-1111-4111-8111-111111111111",
      source: "Telegram",
      title: "client data must be ignored",
      price: 1,
    }),
    {
      storeSlug: "lamp-shop",
      productId: "11111111-1111-4111-8111-111111111111",
      source: "Telegram",
    },
  );
});
