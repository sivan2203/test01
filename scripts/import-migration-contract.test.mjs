import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");
const migrationPath = path.join(
  projectRoot,
  "supabase/migrations/20260802150000_product_import.sql",
);

test("import migration owns batch and row provenance behind seller RLS", () => {
  const migration = fs.readFileSync(migrationPath, "utf8");

  assert.match(migration, /create table if not exists public\.import_batches/i);
  assert.match(migration, /create table if not exists public\.import_rows/i);
  assert.match(migration, /store_id uuid not null references public\.stores/i);
  assert.match(migration, /source_format.*csv.*xls.*xlsx/is);
  assert.match(migration, /idempotency_key uuid not null/i);
  assert.match(migration, /create unique index.*idempotency/is);
  assert.match(migration, /import_batches_update_own/i);
  assert.match(migration, /row_number integer not null/i);
  assert.match(migration, /field_errors jsonb/i);
  assert.match(migration, /alter table public\.products.*import_batch_id/is);
  assert.match(migration, /alter table public\.products.*import_row_id/is);
  assert.match(migration, /products_import_row_id_key/i);
  assert.match(migration, /validate_import_row_product_link/i);
  assert.match(migration, /create or replace function public\.import_product_drafts/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /import_batches.*auth\.uid\(\)/is);
  assert.match(migration, /import_rows.*auth\.uid\(\)/is);
  assert.match(migration, /rollback/i);
  assert.doesNotMatch(migration, /raw_file|file_bytes|uploaded_file/i);
});
