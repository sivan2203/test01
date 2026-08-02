import assert from "node:assert/strict";
import test from "node:test";

import { prepareTelegramHandoffWithDependencies } from "../src/features/contact/handoff-service.ts";

test("re-queries the public boundary and forwards analytics metadata", async () => {
  const calls = [];
  const result = await prepareTelegramHandoffWithDependencies(
    {
      storeSlug: "lamp-shop",
      productId: "product-1",
      origin: "https://store.example",
      source: "telegram",
      sessionId: "session-1",
    },
    {
      getStore: async (slug) => {
        calls.push(["store", slug]);
        return {
          status: "found",
          store: {
            slug,
            contactConfigured: true,
            telegramUsername: "seller_123",
          },
        };
      },
      getProduct: async (slug, productId) => {
        calls.push(["product", slug, productId]);
        return {
          status: "found",
          product: {
            id: productId,
            title: "Lamp",
            priceMode: "request",
            priceAmount: null,
          },
        };
      },
      recordCtaClick: async (input) => calls.push(["analytics", input]),
      buildHandoff: (context) => {
        calls.push(["handoff", context.title]);
        return {
          message: "message",
          productUrl: "https://store.example/lamp-shop/products/product-1",
          url: "https://t.me/seller_123",
        };
      },
    },
  );

  assert.equal(result.status, "ready");
  assert.deepEqual(calls, [
    ["store", "lamp-shop"],
    ["product", "lamp-shop", "product-1"],
    [
      "analytics",
      {
        storeSlug: "lamp-shop",
        productId: "product-1",
        source: "telegram",
        sessionId: "session-1",
      },
    ],
    ["handoff", "Lamp"],
  ]);
});

test("does not append a public event for an authorized preview", async () => {
  let analyticsCalls = 0;
  const result = await prepareTelegramHandoffWithDependencies(
    {
      storeSlug: "lamp-shop",
      productId: "product-1",
      origin: "https://store.example",
      isPreview: true,
    },
    {
      getStore: async () => ({
        status: "found",
        store: {
          slug: "lamp-shop",
          contactConfigured: true,
          telegramUsername: "seller_123",
        },
      }),
      getProduct: async () => ({
        status: "found",
        product: {
          id: "product-1",
          title: "Lamp",
          priceMode: "fixed",
          priceAmount: 100,
        },
      }),
      recordCtaClick: async () => {
        analyticsCalls += 1;
      },
      buildHandoff: () => ({
        message: "message",
        productUrl: "https://store.example/lamp-shop/products/product-1",
        url: "https://t.me/seller_123",
      }),
    },
  );

  assert.equal(result.status, "ready");
  assert.equal(analyticsCalls, 0);
});
