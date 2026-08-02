import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");

test("import action revalidates rows and persists the complete result on the seller SSR boundary", () => {
  const action = fs.readFileSync(
    path.join(projectRoot, "src/features/import/actions.ts"),
    "utf8",
  );

  assert.match(action, /use server/);
  assert.match(action, /createSupabaseServerClient/);
  assert.match(action, /getCurrentSellerStoreForProducts/);
  assert.match(action, /normalizeImportRows/);
  assert.match(action, /rpc\("import_product_drafts"/);
  assert.match(action, /IMPORT_MAX_SUBMISSION_CHARS/);
  assert.match(action, /IMPORT_MAX_SOURCE_ROWS/);
  assert.match(action, /p_store_id: storeResult\.storeId/);
  assert.match(action, /p_rows: normalizedRows\.map/);
  assert.match(action, /revalidatePath\("\/seller\/products"\)/);
  assert.doesNotMatch(action, /service-role/);
  assert.doesNotMatch(action, /storeId.*formData\.get|formData\.get\(["']storeId/i);
  assert.doesNotMatch(action, /status.*formData\.get|formData\.get\(["']status/i);
  assert.doesNotMatch(action, /from\("products"/);
});
