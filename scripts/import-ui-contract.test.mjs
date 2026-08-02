import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");

test("import UI remains seller-only, mobile-friendly, and draft-first", () => {
  const productsPage = fs.readFileSync(
    path.join(projectRoot, "src/app/(seller)/seller/(admin)/products/page.tsx"),
    "utf8",
  );
  const page = fs.readFileSync(
    path.join(projectRoot, "src/app/(seller)/seller/(admin)/products/import/page.tsx"),
    "utf8",
  );
  const flow = fs.readFileSync(
    path.join(projectRoot, "src/features/import/import-product-flow.tsx"),
    "utf8",
  );

  assert.match(productsPage, /seller\/products\/import/);
  assert.match(page, /getCurrentSellerStoreProfile/);
  assert.match(page, /redirect\("\/seller\/sign-in/);
  assert.match(flow, /"use client"/);
  assert.match(flow, /\.csv.*\.xls.*\.xlsx/);
  assert.match(flow, /только черновики/);
  assert.match(flow, /первый из максимум/);
  assert.match(flow, /min-h-11/);
  assert.match(flow, /focus-visible:ring/);
  assert.match(flow, /role="alert"/);
  assert.match(flow, /role="status"/);
  assert.match(flow, /importProductDrafts/);
  assert.match(flow, /idempotencyKey/);
  assert.match(flow, /selectionVersion/);
  assert.match(flow, /Не импортируется/);
  assert.doesNotMatch(flow, /service-role|raw_file|file_bytes|storage\.from/);
  assert.doesNotMatch(page, /api\/analytics|public\/|service-role/);
});
