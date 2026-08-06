import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");

test("seller product and media Data API access preserves guarded invariants", () => {
  const mediaMigration = fs.readFileSync(
    path.join(
      projectRoot,
      "supabase/migrations/20260806214436_grant_product_media_api_access.sql",
    ),
    "utf8",
  );
  const updateMigration = fs.readFileSync(
    path.join(
      projectRoot,
      "supabase/migrations/20260806215652_grant_product_update_api_access.sql",
    ),
    "utf8",
  );
  const hardeningMigration = fs.readFileSync(
    path.join(
      projectRoot,
      "supabase/migrations/20260806224520_harden_seller_data_api_access.sql",
    ),
    "utf8",
  );
  const mediaActions = fs.readFileSync(
    path.join(projectRoot, "src/features/product/media-actions.ts"),
    "utf8",
  );

  assert.match(
    mediaMigration,
    /grant select on table public\.product_media to authenticated/i,
  );
  assert.doesNotMatch(mediaMigration, /grant\s+(?:insert|delete)/i);
  assert.match(
    hardeningMigration,
    /revoke insert, update, delete on table public\.product_media from authenticated/i,
  );
  assert.match(
    hardeningMigration,
    /create or replace function public\.insert_product_media/i,
  );
  assert.match(
    hardeningMigration,
    /from storage\.objects[\s\S]*bucket_id = 'product-media'/i,
  );
  assert.match(
    hardeningMigration,
    /target_sort_order <> current_count::smallint/i,
  );
  assert.match(
    hardeningMigration,
    /revoke execute on function public\.product_media_published\(text\) from anon, authenticated/i,
  );
  assert.match(
    updateMigration,
    /grant update \([\s\S]*title,[\s\S]*availability_status[\s\S]*\) on table public\.products to authenticated/i,
  );
  assert.doesNotMatch(updateMigration, /grant update on table public\.products/i);
  assert.match(mediaActions, /\.rpc\(\s*"insert_product_media"/);
  assert.doesNotMatch(mediaActions, /\.from\("product_media"\)\.insert/);
  assert.doesNotMatch(mediaActions, /\.from\("product_media"\)\.delete/);
  assert.doesNotMatch(mediaMigration, /to service_role/i);
  assert.doesNotMatch(updateMigration, /to service_role/i);
  assert.doesNotMatch(hardeningMigration, /to service_role/i);
});
