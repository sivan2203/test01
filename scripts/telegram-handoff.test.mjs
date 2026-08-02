import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTelegramHandoff,
  formatProductContactMessage,
} from "../src/features/contact/telegram.ts";

const product = {
  storeSlug: "lamp-shop",
  productId: "11111111-1111-4111-8111-111111111111",
  telegramUsername: "seller_123",
  title: "Лампа «Север» & свет",
  priceMode: "fixed",
  priceAmount: 2500,
  origin: "https://store.example",
};

test("formats product context with fixed price and stable product URL", () => {
  const result = formatProductContactMessage(product);

  assert.equal(
    result,
    "Здравствуйте! Пишу по товару «Лампа «Север» & свет». Цена: 2\u00a0500 ₽. Ссылка на товар: https://store.example/lamp-shop/products/11111111-1111-4111-8111-111111111111",
  );
});

test("builds an encoded HTTPS Telegram handoff for request price", () => {
  const result = buildTelegramHandoff({
    ...product,
    priceMode: "request",
    priceAmount: null,
  });

  assert.equal(result.productUrl, "https://store.example/lamp-shop/products/11111111-1111-4111-8111-111111111111");
  assert.match(result.url, /^https:\/\/t\.me\/seller_123\?text=/);
  assert.equal(
    new URL(result.url).searchParams.get("text"),
    "Здравствуйте! Пишу по товару «Лампа «Север» & свет». Цена: по запросу. Ссылка на товар: https://store.example/lamp-shop/products/11111111-1111-4111-8111-111111111111",
  );
});

test("rejects missing or invalid contact and product identity", () => {
  assert.throws(
    () => buildTelegramHandoff({ ...product, telegramUsername: "" }),
    /Telegram contact/i,
  );
  assert.throws(
    () => buildTelegramHandoff({ ...product, productId: "not-a-uuid" }),
    /product/i,
  );
});
