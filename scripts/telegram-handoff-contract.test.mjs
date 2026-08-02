import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (path) => readFileSync(`${root}/${path}`, "utf8");

test("server handoff re-queries public product data and records CTA before response", () => {
  const route = read("src/app/api/contact/telegram/route.ts");
  const telegramRoute = read("src/features/contact/telegram-route.ts");
  const handoff = read("src/features/contact/handoff.ts");
  const handoffService = read("src/features/contact/handoff-service.ts");
  const ingestionServer = read("src/features/analytics/public-ingestion-server.ts");
  const migration = read(
    "supabase/migrations/20260802120000_complete_analytics_ingestion.sql",
  );

  assert.match(route, /handleTelegramHandoffRequest/);
  assert.match(route, /isPreview: false/);
  assert.match(telegramRoute, /normalizeAnalyticsSessionId/);
  assert.match(handoff, /getPublicStoreBySlug/);
  assert.match(handoff, /getPublicProductForStore/);
  assert.match(ingestionServer, /record_public_cta_click/);
  assert.match(ingestionServer, /createSupabaseServiceRoleClient/);
  assert.match(handoff, /prepareTelegramHandoffWithDependencies/);
  assert.ok(
    handoffService.indexOf("recordCtaClick") <
      handoffService.indexOf("const handoff = buildHandoff()"),
  );
  assert.match(migration, /p_event_name not in \('store_view', 'product_view', 'cta_click'\)/);
  assert.match(migration, /grant execute on function public\.record_public_cta_click/);
  assert.match(migration, /to service_role/);
  assert.doesNotMatch(migration, /to anon, authenticated/);
  assert.match(migration, /products\.status = 'published'/);
  assert.match(migration, /stores\.telegram_username is not null/);
  assert.match(migration, /CTA click rate limit exceeded/);
});

test("catalog and detail share the interactive Telegram CTA with accessible fallback", () => {
  const cta = read("src/features/store/public-contact-cta.tsx");
  const catalog = read("src/features/store/public-catalog-view.tsx");
  const detail = read("src/features/store/public-product-detail.tsx");
  const preview = read("src/app/(seller)/seller/(admin)/store/preview/page.tsx");

  assert.match(cta, /\/api\/contact\/telegram\/preview/);
  assert.match(cta, /\/api\/contact\/telegram/);
  assert.match(cta, /window\.open\("about:blank", "_blank"\)/);
  assert.match(cta, /navigator\.clipboard/);
  assert.match(cta, /Скопировать текст сообщения/);
  assert.match(cta, /aria-live="polite"/);
  assert.match(catalog, /PublicProductContactCta/);
  assert.match(detail, /PublicProductContactCta/);
  assert.match(preview, /isPreview/);
  assert.doesNotMatch(cta, /createSupabaseServiceRoleClient|service-role/);
});
