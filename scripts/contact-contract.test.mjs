import assert from "node:assert/strict";
import test from "node:test";

import { validateTelegramUsername } from "../src/features/contact/telegram.ts";

test("normalizes supported Telegram inputs to one canonical username", () => {
  for (const input of [
    "seller_123",
    "@seller_123",
    "https://t.me/seller_123",
    "https://t.me/seller_123/",
    "https://telegram.me/seller_123",
    "https://telegram.dog/seller_123/",
  ]) {
    assert.deepEqual(validateTelegramUsername(input), {
      isValid: true,
      username: "seller_123",
    });
  }
});

test("accepts the maximum canonical username through a profile URL", () => {
  const username = `a${"b".repeat(31)}`;
  assert.deepEqual(validateTelegramUsername(`https://telegram.dog/${username}`), {
    isValid: true,
    username,
  });
});

test("allows an explicitly empty value to clear contact", () => {
  assert.deepEqual(validateTelegramUsername(""), {
    isValid: true,
    username: null,
  });
});

test("rejects unsafe Telegram input without returning a canonical value", () => {
  for (const input of [
    " seller_123",
    "seller 123",
    "seller-123",
    "@seller_123@other",
    "https://t.me/seller_123?text=hello",
    "https://t.me/seller_123#section",
    "https://t.me/seller_123?",
    "https://t.me/seller_123#",
    "https://t.me/seller_123/.",
    "https://t.me/seller_123/extra",
    "https://t.me\\seller_123",
    "https://t.me:8443/seller_123",
    "https://example.com/seller_123",
    "tg://resolve?domain=seller_123",
    "кириллица",
    "abcd",
    `a${"b".repeat(32)}`,
  ]) {
    const result = validateTelegramUsername(input);
    assert.equal(result.isValid, false, input);
    assert.equal(result.username, null, input);
    assert.equal(typeof result.error, "string", input);
  }
});
