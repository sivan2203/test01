import assert from "node:assert/strict";
import test from "node:test";

import { isAuthorizedPreviewStore } from "../src/features/contact/preview.ts";

test("authorizes preview only for the authenticated seller store", () => {
  const sellerStore = {
    status: "found",
    store: { slug: "lamp-shop" },
  };

  assert.equal(isAuthorizedPreviewStore(sellerStore, "lamp-shop"), true);
  assert.equal(isAuthorizedPreviewStore(sellerStore, "other-shop"), false);
  assert.equal(
    isAuthorizedPreviewStore({ status: "unauthenticated" }, "lamp-shop"),
    false,
  );
});
