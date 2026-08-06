import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");

test("analytics ingestion accepts current PostgREST JSON role claims", () => {
  const migration = fs.readFileSync(
    path.join(
      projectRoot,
      "supabase/migrations/20260806222049_fix_analytics_service_role_claim.sql",
    ),
    "utf8",
  );

  assert.match(migration, /current_setting\('request\.jwt\.claims', true\)/i);
  assert.match(migration, /request_claims\s*->>\s*'role'/i);
  assert.match(migration, /when invalid_text_representation/i);
  assert.match(migration, /request_role\s*<>\s*'service_role'/i);
  assert.match(
    migration,
    /current_setting\('request\.jwt\.claim\.role', true\)/i,
  );
  assert.ok(
    migration.indexOf("request_claims ->> 'role'") <
      migration.indexOf("current_setting('request.jwt.claim.role', true)"),
  );
  assert.match(migration, /security definer/i);
});
