import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getSafeSellerRedirectPath,
  getSellerReturnPath,
  SELLER_SIGN_IN_PATH,
} from "../src/proxy-rules.mjs";
import {
  canRemoveProductMedia,
  normalizeProductMediaOrder,
  validateProductMediaFile,
  validateProductMediaSignature,
} from "../src/features/product/media-schema.ts";
import {
  PRODUCT_STATUS_DELETED,
  PRODUCT_STATUS_HIDDEN,
  PRODUCT_STATUS_PUBLISHED,
  canTransitionProductStatus,
  validateProductPublication,
} from "../src/features/product/lifecycle.ts";
import {
  getSellerProductCardState,
  matchesSellerProductListFilter,
  parseSellerProductListFilter,
} from "../src/features/product/product-list.ts";
import { validateTelegramUsername } from "../src/features/contact/telegram.ts";

const root = process.cwd();
const requiredPaths = [
  "src/app/page.tsx",
  "src/app/(public)/[storeSlug]/page.tsx",
  "src/app/(public)/[storeSlug]/products/[productId]/page.tsx",
  "src/app/(public)/[storeSlug]/not-found.tsx",
  "src/app/(public)/[storeSlug]/error.tsx",
  "src/app/(seller)/seller/(admin)/layout.tsx",
  "src/app/(seller)/seller/(admin)/page.tsx",
  "src/app/(seller)/seller/(admin)/products/page.tsx",
  "src/app/(seller)/seller/(admin)/products/new/page.tsx",
  "src/app/(seller)/seller/(admin)/products/[productId]/edit/page.tsx",
  "src/app/(seller)/seller/(admin)/analytics/page.tsx",
  "src/app/(seller)/seller/(admin)/store/page.tsx",
  "src/app/(seller)/seller/(admin)/store/preview/page.tsx",
  "src/app/(seller)/seller/sign-in/page.tsx",
  "src/app/auth/callback/route.ts",
  "src/components/ui/button.tsx",
  "src/components/design-system/surface.tsx",
  "src/features/seller-auth/actions.ts",
  "src/features/seller-auth/redirect.ts",
  "src/features/seller-auth/sign-in-form.tsx",
  "src/features/product/actions.ts",
  "src/features/product/form-state.ts",
  "src/features/product/product-form.tsx",
  "src/features/product/media-actions.ts",
  "src/features/product/media-queries.ts",
  "src/features/product/media-schema.ts",
  "src/features/product/media-upload-service.ts",
  "src/features/product/product-media-manager.tsx",
  "src/features/product/product-media-upload-queue.tsx",
  "src/features/product/lifecycle.ts",
  "src/features/product/product-lifecycle-context.tsx",
  "src/features/product/product-state-control.tsx",
  "src/features/product/queries.ts",
  "src/features/product/schema.ts",
  "src/features/product/product-list.ts",
  "src/features/product/product-cover.tsx",
  "src/features/store/actions.ts",
  "src/features/store/avatar.ts",
  "src/features/store/form-state.ts",
  "src/features/store/public-catalog.ts",
  "src/features/store/public-catalog-view.tsx",
  "src/features/store/public-contact-cta.tsx",
  "src/features/store/public-product-detail.tsx",
  "src/features/store/public-product-gallery.tsx",
  "src/features/store/public-storefront-image.tsx",
  "src/features/store/public-storefront-shell.tsx",
  "src/features/store/public-queries.ts",
  "src/features/store/queries.ts",
  "src/features/store/schema.ts",
  "src/features/store/store-profile-form.tsx",
  "src/features/contact/README.md",
  "src/features/contact/telegram.ts",
  "src/features/contact/handoff.ts",
  "src/features/analytics/cta-click.ts",
  "src/app/api/contact/telegram/route.ts",
  "src/lib/supabase/browser.ts",
  "src/lib/supabase/server.ts",
  "src/lib/supabase/proxy.ts",
  "src/lib/supabase/service-role.ts",
  "supabase/migrations/.gitkeep",
  ".env.example",
  "docs/environments.md",
  "src/proxy.ts",
  "src/proxy-rules.mjs",
];

const missing = requiredPaths.filter((path) => !existsSync(join(root, path)));

if (missing.length > 0) {
  console.error("Foundation smoke check failed. Missing paths:");
  for (const path of missing) console.error(`- ${path}`);
  process.exit(1);
}

const proxyRules = readFileSync(join(root, "src/proxy-rules.mjs"), "utf8");
if (!proxyRules.includes(SELLER_SIGN_IN_PATH)) {
  console.error("Foundation smoke check failed. Seller sign-in bypass missing.");
  process.exit(1);
}

const routeManifestPath = join(root, ".next/server/app-paths-manifest.json");
const functionsConfigManifestPath = join(
  root,
  ".next/server/functions-config-manifest.json",
);
const indexHtmlPath = join(root, ".next/server/app/index.html");

if (
  !existsSync(routeManifestPath) ||
  !existsSync(functionsConfigManifestPath) ||
  !existsSync(indexHtmlPath)
) {
  console.error(
    "Foundation smoke check failed. Build artifacts missing; run `npm run build` before smoke.",
  );
  process.exit(1);
}

const routeManifest = JSON.parse(readFileSync(routeManifestPath, "utf8"));
if (
  !routeManifest["/page"] ||
  !routeManifest["/(public)/[storeSlug]/page"] ||
  !routeManifest["/(public)/[storeSlug]/products/[productId]/page"] ||
  !routeManifest["/(seller)/seller/(admin)/page"] ||
  !routeManifest["/(seller)/seller/(admin)/products/page"] ||
  !routeManifest["/(seller)/seller/(admin)/products/new/page"] ||
  !routeManifest["/(seller)/seller/(admin)/products/[productId]/edit/page"] ||
  !routeManifest["/(seller)/seller/(admin)/store/page"] ||
  !routeManifest["/(seller)/seller/(admin)/store/preview/page"] ||
  !routeManifest["/(seller)/seller/sign-in/page"] ||
  !routeManifest["/auth/callback/route"]
) {
  console.error("Foundation smoke check failed. Public routes are not built.");
  process.exit(1);
}

if (
  parseSellerProductListFilter(undefined) !== "all" ||
  parseSellerProductListFilter("") !== "all" ||
  parseSellerProductListFilter("unknown") !== "all" ||
  parseSellerProductListFilter("draft") !== "draft" ||
  parseSellerProductListFilter("published") !== "published" ||
  parseSellerProductListFilter("hidden") !== "hidden" ||
  parseSellerProductListFilter("deleted") !== "deleted" ||
  parseSellerProductListFilter(["draft"]) !== "draft" ||
  parseSellerProductListFilter(["draft", "published"]) !== "all" ||
  !matchesSellerProductListFilter("draft", "all") ||
  !matchesSellerProductListFilter("deleted", "deleted") ||
  matchesSellerProductListFilter("deleted", "all") ||
  matchesSellerProductListFilter("published", "draft") ||
  !getSellerProductCardState("published", "signed-url").hasCover ||
  !getSellerProductCardState("published", "signed-url").canEdit ||
  getSellerProductCardState("published", null).hasCover ||
  getSellerProductCardState("deleted", "signed-url").canEdit ||
  !getSellerProductCardState("deleted", "signed-url").isArchived
) {
  console.error("Foundation smoke check failed. Seller product list filter contract is incomplete.");
  process.exit(1);
}

const indexHtml = readFileSync(indexHtmlPath, "utf8");
if (
  !indexHtml.includes("Товары — ясно. Связь — напрямую.") ||
  !indexHtml.includes("Открыть кабинет продавца") ||
  !indexHtml.includes('lang="ru"')
) {
  console.error("Foundation smoke check failed. Public route did not render expected HTML.");
  process.exit(1);
}

const functionsConfigManifest = JSON.parse(
  readFileSync(functionsConfigManifestPath, "utf8"),
);
const sellerProxyMatcher = Object.values(functionsConfigManifest?.functions ?? {})
  .flatMap((fn) => fn.matchers ?? [])
  .find((matcher) => matcher.originalSource === "/seller/:path*");
if (!sellerProxyMatcher?.regexp?.includes("\\/seller")) {
  console.error("Foundation smoke check failed. Seller proxy matcher was not built.");
  process.exit(1);
}

const proxySource = readFileSync(join(root, "src/proxy.ts"), "utf8");
if (proxySource.includes("seller_session=dev") || proxySource.includes("seller_session")) {
  console.error("Foundation smoke check failed. Seller proxy still contains dev-cookie bypass.");
  process.exit(1);
}

if (!proxySource.includes("createSupabaseProxyClient")) {
  console.error("Foundation smoke check failed. Seller proxy does not use Supabase session checks.");
  process.exit(1);
}

if (getSellerReturnPath("/seller", "?invite=abc") !== "/seller?invite=abc") {
  console.error("Foundation smoke check failed. Seller redirect return path drops query state.");
  process.exit(1);
}

if (
  getSafeSellerRedirectPath("/seller/store?tab=profile") !==
    "/seller/store?tab=profile" ||
  getSafeSellerRedirectPath("https://evil.example/seller") !== "/seller" ||
  getSafeSellerRedirectPath("//evil.example/seller") !== "/seller" ||
  getSafeSellerRedirectPath("/demo-store") !== "/seller" ||
  getSafeSellerRedirectPath("/seller/sign-in") !== "/seller" ||
  getSafeSellerRedirectPath("/seller/sign-in/help") !== "/seller"
) {
  console.error("Foundation smoke check failed. Seller redirect safety rules are incorrect.");
  process.exit(1);
}

if (
  !proxySource.includes("const auth = createSupabaseProxyClient(request)") ||
  proxySource.includes("const { supabase, response } = createSupabaseProxyClient") ||
  !proxySource.includes("return auth.response") ||
  !proxySource.includes("redirectResponse.cookies.set(cookie)")
) {
  console.error("Foundation smoke check failed. Seller proxy can drop refreshed auth cookies.");
  process.exit(1);
}

const sellerAuthActionSource = readFileSync(
  join(root, "src/features/seller-auth/actions.ts"),
  "utf8",
);
if (
  sellerAuthActionSource.indexOf("process.env.NEXT_PUBLIC_SITE_URL") >
  sellerAuthActionSource.indexOf('headerStore.get("origin")')
) {
  console.error("Foundation smoke check failed. Seller magic-link callback origin is not config-first.");
  process.exit(1);
}

const authCallbackSource = readFileSync(
  join(root, "src/app/auth/callback/route.ts"),
  "utf8",
);
if (
  !authCallbackSource.includes('new URL("/seller/sign-in", requestUrl.origin)') ||
  !authCallbackSource.includes("catch") ||
  authCallbackSource.includes("requestUrl.clone()")
) {
  console.error("Foundation smoke check failed. Auth callback error redirects are not sanitized.");
  process.exit(1);
}

const serviceRole = readFileSync(
  join(root, "src/lib/supabase/service-role.ts"),
  "utf8",
);
if (!serviceRole.includes('import "server-only"')) {
  console.error("Foundation smoke check failed. Service role module is not server-only.");
  process.exit(1);
}

const migrationDir = join(root, "supabase/migrations");
const storeMigrationName = readdirSync(migrationDir).find((fileName) =>
  fileName.endsWith("_create_stores.sql"),
);
if (!storeMigrationName) {
  console.error("Foundation smoke check failed. Store profile migration is missing.");
  process.exit(1);
}

const storeMigration = readFileSync(join(migrationDir, storeMigrationName), "utf8");
const requiredStoreMigrationSnippets = [
  "create table if not exists public.stores",
  "seller_id uuid not null references auth.users(id) on delete cascade",
  "constraint stores_seller_id_key unique (seller_id)",
  "constraint stores_avatar_path_owner_check check",
  "split_part(avatar_path, '/', 1) = seller_id::text",
  "timezone text not null default 'Europe/Moscow'",
  "alter table public.stores enable row level security",
  "to authenticated",
  "(select auth.uid()) = seller_id",
  "store-avatars",
  "storage.objects",
  "storage.foldername(name)",
];
if (
  requiredStoreMigrationSnippets.some(
    (snippet) => !storeMigration.includes(snippet),
  ) ||
  storeMigration.includes(" slug ")
) {
  console.error("Foundation smoke check failed. Store migration/RLS boundaries are incomplete.");
  process.exit(1);
}

const storeSlugMigrationName = readdirSync(migrationDir).find((fileName) =>
  fileName.endsWith("_add_store_slug.sql"),
);
if (!storeSlugMigrationName) {
  console.error("Foundation smoke check failed. Store slug migration is missing.");
  process.exit(1);
}

const storeSlugMigration = readFileSync(
  join(migrationDir, storeSlugMigrationName),
  "utf8",
);
const requiredStoreSlugMigrationSnippets = [
  "add column if not exists slug text",
  "stores_slug_format_check",
  "char_length(slug) between 3 and 32",
  "slug = lower(slug)",
  "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'",
  "stores_slug_reserved_check",
  "'admin', 'api', 'login', 'signup', 'support', 'help', 'seller'",
  "stores_slug_unique_idx",
  "where slug is not null",
  "is_store_slug_available",
  "candidate_slug",
  "get_public_store_by_slug",
  "grant execute on function public.get_public_store_by_slug(text) to anon, authenticated",
];
if (
  requiredStoreSlugMigrationSnippets.some(
    (snippet) => !storeSlugMigration.includes(snippet),
  ) ||
  /slug_(history|alias|redirect)/i.test(storeSlugMigration) ||
  /create\s+table[\s\S]*(slug_history|slug_alias|redirect)/i.test(storeSlugMigration)
) {
  console.error("Foundation smoke check failed. Store slug migration boundaries are incomplete.");
  process.exit(1);
}

const telegramMigrationName = readdirSync(migrationDir).find((fileName) =>
  fileName.endsWith("_add_store_telegram_contact.sql"),
);
if (!telegramMigrationName) {
  console.error("Foundation smoke check failed. Telegram contact migration is missing.");
  process.exit(1);
}

const telegramMigration = readFileSync(
  join(migrationDir, telegramMigrationName),
  "utf8",
);
const requiredTelegramMigrationSnippets = [
  "add column if not exists telegram_username text",
  "stores_telegram_username_format_check",
  "telegram_username is null",
  "char_length(telegram_username) between 5 and 32",
  "telegram_username ~ '^[A-Za-z][A-Za-z0-9_]{4,31}$'",
  "drop function if exists public.get_public_store_by_slug(text)",
  "telegram_username text",
  "security definer",
  "set search_path = public",
  "revoke all on function public.get_public_store_by_slug(text) from public",
  "grant execute on function public.get_public_store_by_slug(text) to anon, authenticated",
  "Rollback:",
];
if (
  requiredTelegramMigrationSnippets.some(
    (snippet) => !telegramMigration.includes(snippet),
  ) ||
  telegramMigration.includes("telegram api") ||
  telegramMigration.includes("service-role")
) {
  console.error("Foundation smoke check failed. Telegram contact migration boundaries are incomplete.");
  process.exit(1);
}

const analyticsMigrationName = readdirSync(migrationDir).find((fileName) =>
  fileName.endsWith("_create_analytics_events.sql"),
);
if (!analyticsMigrationName) {
  console.error("Foundation smoke check failed. Analytics event migration is missing.");
  process.exit(1);
}

const analyticsMigration = readFileSync(
  join(migrationDir, analyticsMigrationName),
  "utf8",
);
const requiredAnalyticsMigrationSnippets = [
  "create table if not exists public.analytics_events",
  "event_name in ('store_view', 'product_view', 'cta_click')",
  "source = lower(source)",
  "occurred_at timestamptz not null",
  "alter table public.analytics_events enable row level security",
  "revoke all on table public.analytics_events from anon, authenticated",
  "record_public_cta_click",
  "products.status = 'published'",
  "stores.telegram_username is not null",
  "Rollback:",
];
if (
  requiredAnalyticsMigrationSnippets.some(
    (snippet) => !analyticsMigration.includes(snippet),
  ) ||
  analyticsMigration.includes("createSupabaseServiceRoleClient") ||
  analyticsMigration.includes("telegram api")
) {
  console.error("Foundation smoke check failed. Analytics event boundaries are incomplete.");
  process.exit(1);
}

const publicStoreAvatarMigrationName = readdirSync(migrationDir).find((fileName) =>
  fileName.endsWith("_public_store_avatar.sql"),
);
if (!publicStoreAvatarMigrationName) {
  console.error("Foundation smoke check failed. Public store avatar migration is missing.");
  process.exit(1);
}

const publicStoreAvatarMigration = readFileSync(
  join(migrationDir, publicStoreAvatarMigrationName),
  "utf8",
);
const requiredPublicStoreAvatarMigrationSnippets = [
  "get_public_store_by_slug(store_slug text)",
  "drop function if exists public.get_public_store_by_slug(text)",
  "avatar_path text",
  "security definer",
  "set search_path = public",
  "is_public_store_avatar_path",
  "store_avatars_select_public",
  "bucket_id = 'store-avatars'",
  "to anon, authenticated",
  "stores.slug is not null",
  "stores.avatar_path = object_path",
  "revoke all on function public.is_public_store_avatar_path(text) from public",
];
if (
  requiredPublicStoreAvatarMigrationSnippets.some(
    (snippet) => !publicStoreAvatarMigration.includes(snippet),
  ) ||
  /product-media[\s\S]*public\s*=\s*true/i.test(publicStoreAvatarMigration)
) {
  console.error("Foundation smoke check failed. Public store avatar storage boundary is incomplete.");
  process.exit(1);
}

const productMigrationName = readdirSync(migrationDir).find((fileName) =>
  fileName.endsWith("_create_products.sql"),
);
if (!productMigrationName) {
  console.error("Foundation smoke check failed. Product migration is missing.");
  process.exit(1);
}

const productMigration = readFileSync(
  join(migrationDir, productMigrationName),
  "utf8",
);
const requiredProductMigrationSnippets = [
  "create table if not exists public.products",
  "store_id uuid not null references public.stores(id) on delete cascade",
  "status text not null default 'draft'",
  "products_status_check",
  "'draft', 'published', 'hidden', 'deleted'",
  "products_price_mode_check",
  "'fixed', 'request'",
  "products_price_amount_check",
  "alter table public.products enable row level security",
  "products_select_own",
  "products_insert_own",
  "products_update_own",
  "(select auth.uid())",
  "get_public_catalog_items_for_store",
  "and products.status = 'published'",
  "grant execute on function public.get_public_catalog_items_for_store(text) to anon, authenticated",
];
if (
  requiredProductMigrationSnippets.some(
    (snippet) => !productMigration.includes(snippet),
  )
) {
  console.error("Foundation smoke check failed. Product migration/RLS/public visibility boundaries are incomplete.");
  process.exit(1);
}

const storeFeatureFiles = [
  "src/features/store/actions.ts",
  "src/features/store/avatar.ts",
  "src/features/store/form-state.ts",
  "src/features/store/public-queries.ts",
  "src/features/store/queries.ts",
  "src/features/store/schema.ts",
  "src/features/store/store-profile-form.tsx",
];
const storeFeatureSource = storeFeatureFiles
  .map((filePath) => readFileSync(join(root, filePath), "utf8"))
  .join("\n");
if (
  storeFeatureSource.includes("createSupabaseServiceRoleClient") ||
  storeFeatureSource.includes("service-role")
) {
  console.error("Foundation smoke check failed. Store feature imports service-role code.");
  process.exit(1);
}

if (
  !storeFeatureSource.includes("STORE_DEFAULT_TIMEZONE = \"Europe/Moscow\"") ||
  !storeFeatureSource.includes("STORE_NAME_MAX_LENGTH = 80") ||
  !storeFeatureSource.includes("STORE_OPTIONAL_TEXT_MAX_LENGTH = 500") ||
  !storeFeatureSource.includes("STORE_SLUG_MIN_LENGTH = 3") ||
  !storeFeatureSource.includes("STORE_SLUG_MAX_LENGTH = 32") ||
  !storeFeatureSource.includes("STORE_RESERVED_SLUGS") ||
  !storeFeatureSource.includes("validateStoreSlug") ||
  !storeFeatureSource.includes("normalizeStoreSlug") ||
  !storeFeatureSource.includes("countStoreTextCharacters") ||
  !storeFeatureSource.includes("Array.from(value).length") ||
  !storeFeatureSource.includes("STORE_AVATAR_MAX_BYTES = 2 * 1024 * 1024") ||
  !storeFeatureSource.includes("\"image/jpeg\"") ||
  !storeFeatureSource.includes("\"image/png\"") ||
  !storeFeatureSource.includes("\"image/webp\"") ||
  !storeFeatureSource.includes("validateStoreAvatarSignature") ||
  !storeFeatureSource.includes("file.slice(0, 12).arrayBuffer()") ||
  !storeFeatureSource.includes("is_store_slug_available") ||
  !storeFeatureSource.includes("candidate_slug") ||
  !storeFeatureSource.includes("23505") ||
  !storeFeatureSource.includes("SLUG_TAKEN_MESSAGE") ||
  !storeFeatureSource.includes('name="slug"') ||
  !storeFeatureSource.includes("navigator.clipboard.writeText") ||
  !storeFeatureSource.includes("navigator.share") ||
  !storeFeatureSource.includes("seller_id: user.id") ||
  storeFeatureSource.includes('formData.get("seller_id")')
) {
  console.error("Foundation smoke check failed. Store profile validation or ownership boundaries are incomplete.");
  process.exit(1);
}

const contactFeatureSource = [
  readFileSync(join(root, "src/features/contact/README.md"), "utf8"),
  readFileSync(join(root, "src/features/contact/telegram.ts"), "utf8"),
  readFileSync(join(root, "src/features/contact/handoff.ts"), "utf8"),
  readFileSync(join(root, "src/features/analytics/cta-click.ts"), "utf8"),
].join("\n");
if (
  !contactFeatureSource.includes("telegram") ||
  !contactFeatureSource.includes("TELEGRAM_USERNAME_MIN_LENGTH") ||
  !contactFeatureSource.includes("TELEGRAM_USERNAME_MAX_LENGTH") ||
  !contactFeatureSource.includes("t.me") ||
  !contactFeatureSource.includes("telegram.me") ||
  !contactFeatureSource.includes("telegram.dog") ||
  !contactFeatureSource.includes("buildTelegramHandoff") ||
  !contactFeatureSource.includes("cta_click") ||
  contactFeatureSource.includes("WhatsApp") ||
  contactFeatureSource.includes("VK") ||
  contactFeatureSource.includes("phone") ||
  contactFeatureSource.includes("Telegram API")
) {
  console.error("Foundation smoke check failed. Contact adapter domain boundaries are incomplete.");
  process.exit(1);
}

const validTelegramInputs = [
  "seller_123",
  "@seller_123",
  "https://t.me/seller_123",
  "https://telegram.me/seller_123/",
  "https://telegram.dog/seller_123",
];
const invalidTelegramInputs = [
  "seller 123",
  "seller-123",
  "https://t.me/seller_123?text=hello",
  "https://t.me/seller_123#section",
  "https://t.me/seller_123/extra",
  "https://example.com/seller_123",
  "tg://resolve?domain=seller_123",
  "abcd",
  `a${"b".repeat(32)}`,
];
if (
  validTelegramInputs.some(
    (input) => validateTelegramUsername(input).username !== "seller_123",
  ) ||
  validateTelegramUsername("").username !== null ||
  invalidTelegramInputs.some((input) => validateTelegramUsername(input).isValid)
) {
  console.error("Foundation smoke check failed. Telegram input validation is incomplete.");
  process.exit(1);
}

const storeQueriesSource = readFileSync(
  join(root, "src/features/store/queries.ts"),
  "utf8",
);
if (
  !storeQueriesSource.includes('status: "error"') ||
  !storeQueriesSource.includes('status: "not_found"') ||
  !storeQueriesSource.includes('status: "found"') ||
  storeQueriesSource.includes("if (error || !data)") ||
  storeQueriesSource.includes("catch {\n    return null;")
) {
  console.error("Foundation smoke check failed. Store profile query errors can be mistaken for empty state.");
  process.exit(1);
}

const storeActionSource = readFileSync(
  join(root, "src/features/store/actions.ts"),
  "utf8",
);
if (
  !storeActionSource.includes("uploadedAvatarPath") ||
  !storeActionSource.includes("existingStoreError") ||
  !storeActionSource.includes("Выберите фото ещё раз после исправления полей.") ||
  !storeActionSource.includes("remove([uploadedAvatarPath])") ||
  !storeActionSource.includes("validateStoreAvatarSignature") ||
  !storeActionSource.includes("{ slug: SLUG_TAKEN_MESSAGE }") ||
  !storeActionSource.includes("getFieldErrorsWithAvatarReselect(")
) {
  console.error("Foundation smoke check failed. Store avatar lifecycle review guardrails are incomplete.");
  process.exit(1);
}

const productFeatureFiles = [
  "src/features/product/actions.ts",
  "src/features/product/form-state.ts",
  "src/features/product/lifecycle.ts",
  "src/features/product/product-lifecycle-context.tsx",
  "src/features/product/product-form.tsx",
  "src/features/product/product-state-control.tsx",
  "src/features/product/queries.ts",
  "src/features/product/schema.ts",
];
const productFeatureSource = productFeatureFiles
  .map((filePath) => readFileSync(join(root, filePath), "utf8"))
  .join("\n");
if (
  productFeatureSource.includes("createSupabaseServiceRoleClient") ||
  productFeatureSource.includes("service-role") ||
  productFeatureSource.includes('formData.get("seller_id")') ||
  productFeatureSource.includes('formData.get("store_id")') ||
  productFeatureSource.includes('formData.get("productId")') ||
  !productFeatureSource.includes("PRODUCT_TITLE_MAX_LENGTH = 120") ||
  !productFeatureSource.includes("PRODUCT_DESCRIPTION_MAX_LENGTH = 1000") ||
  !productFeatureSource.includes('PRODUCT_STATUS_DRAFT = "draft"') ||
  !productFeatureSource.includes('priceMode: "request"') ||
  !productFeatureSource.includes("createSupabaseServerClient") ||
  !productFeatureSource.includes("getCurrentSellerStoreForProducts") ||
  !productFeatureSource.includes("createProductDraft") ||
  !productFeatureSource.includes("updateProduct") ||
  !productFeatureSource.includes("publishProduct") ||
  !productFeatureSource.includes("hideProduct") ||
  !productFeatureSource.includes("deleteProduct") ||
  !productFeatureSource.includes("canTransitionProductStatus") ||
  !productFeatureSource.includes("validateProductPublication") ||
  !productFeatureSource.includes("useActionState") ||
  !productFeatureSource.includes('name="title"') ||
  !productFeatureSource.includes('name="priceMode"') ||
  !productFeatureSource.includes('name="availabilityStatus"')
) {
  console.error("Foundation smoke check failed. Product draft feature boundaries are incomplete.");
  process.exit(1);
}

const sellerProductsSource = readFileSync(
  join(root, "src/app/(seller)/seller/(admin)/products/page.tsx"),
  "utf8",
);
const sellerProductNewSource = readFileSync(
  join(root, "src/app/(seller)/seller/(admin)/products/new/page.tsx"),
  "utf8",
);
const sellerProductEditSource = readFileSync(
  join(root, "src/app/(seller)/seller/(admin)/products/[productId]/edit/page.tsx"),
  "utf8",
);
const productCoverSource = readFileSync(
  join(root, "src/features/product/product-cover.tsx"),
  "utf8",
);
if (
  !sellerProductsSource.includes("getSellerProducts") ||
  !sellerProductsSource.includes("getSellerProductCovers") ||
  !sellerProductsSource.includes("parseSellerProductListFilter") ||
  !sellerProductsSource.includes("searchParams: Promise") ||
  !sellerProductsSource.includes('aria-current={active ? "page" : undefined}') ||
  !sellerProductsSource.includes('`/seller/products?status=${filter}`') ||
  !sellerProductsSource.includes("PRODUCT_STATUS_DELETED") ||
  !sellerProductsSource.includes("ProductCover") ||
  !sellerProductsSource.includes("Архивный товар · редактор недоступен") ||
  !sellerProductsSource.includes('href="/seller/products/new"') ||
  !sellerProductsSource.includes('href={`/seller/products/${product.id}/edit`}') ||
  !sellerProductNewSource.includes("getCurrentSellerStoreProfile") ||
  !sellerProductNewSource.includes("getInitialProductWizardDraftFormState") ||
  !sellerProductNewSource.includes("ProductCreateWizard") ||
  !sellerProductNewSource.includes("searchParams: Promise") ||
  !sellerProductNewSource.includes("getSellerProductById") ||
  !sellerProductNewSource.includes("getSellerProductMedia") ||
  !sellerProductEditSource.includes("getSellerProductById") ||
  !sellerProductEditSource.includes("getInitialProductDraftFormState(productResult.product)") ||
  !sellerProductEditSource.includes("ProductForm") ||
  !sellerProductEditSource.includes("ProductStateControl") ||
  !sellerProductEditSource.includes("productId={productResult.product.id}") ||
  sellerProductsSource.includes("createSupabaseServiceRoleClient") ||
  sellerProductsSource.includes("service-role") ||
  sellerProductNewSource.includes("createSupabaseServiceRoleClient") ||
  sellerProductNewSource.includes("service-role") ||
  sellerProductEditSource.includes("createSupabaseServiceRoleClient") ||
  sellerProductEditSource.includes("service-role")
) {
  console.error("Foundation smoke check failed. Product draft routes are incomplete.");
  process.exit(1);
}
if (
  !productCoverSource.includes("onError") ||
  !productCoverSource.includes("hasError") ||
  !productCoverSource.includes("Нет фото")
) {
  console.error("Foundation smoke check failed. Product cover fallback is incomplete.");
  process.exit(1);
}

const sellerHomeSource = readFileSync(
  join(root, "src/app/(seller)/seller/(admin)/page.tsx"),
  "utf8",
);
if (!sellerHomeSource.includes('href="/seller/store"')) {
  console.error("Foundation smoke check failed. Seller home CTA does not open store setup.");
  process.exit(1);
}

const sellerStorePageSource = readFileSync(
  join(root, "src/app/(seller)/seller/(admin)/store/page.tsx"),
  "utf8",
);
if (
  !sellerStorePageSource.includes("getCurrentSellerStoreProfile") ||
  !sellerStorePageSource.includes("StoreProfileForm")
) {
  console.error("Foundation smoke check failed. Seller store page does not render the profile editor.");
  process.exit(1);
}

const publicStorePageSource = readFileSync(
  join(root, "src/app/(public)/[storeSlug]/page.tsx"),
  "utf8",
);
const previewStorePageSource = readFileSync(
  join(root, "src/app/(seller)/seller/(admin)/store/preview/page.tsx"),
  "utf8",
);
const publicStorefrontShellSource = readFileSync(
  join(root, "src/features/store/public-storefront-shell.tsx"),
  "utf8",
);
const publicCatalogSource = readFileSync(
  join(root, "src/features/store/public-catalog.ts"),
  "utf8",
);
const publicStoreQuerySource = readFileSync(
  join(root, "src/features/store/public-queries.ts"),
  "utf8",
);
const publicStoreNotFoundSource = readFileSync(
  join(root, "src/app/(public)/[storeSlug]/not-found.tsx"),
  "utf8",
);
const publicStoreErrorSource = readFileSync(
  join(root, "src/app/(public)/[storeSlug]/error.tsx"),
  "utf8",
);
const publicStorefrontImageSource = readFileSync(
  join(root, "src/features/store/public-storefront-image.tsx"),
  "utf8",
);
const publicCatalogViewSource = readFileSync(
  join(root, "src/features/store/public-catalog-view.tsx"),
  "utf8",
);
const publicProductPageSource = readFileSync(
  join(root, "src/app/(public)/[storeSlug]/products/[productId]/page.tsx"),
  "utf8",
);
const publicProductDetailSource = readFileSync(
  join(root, "src/features/store/public-product-detail.tsx"),
  "utf8",
);
const publicProductGallerySource = readFileSync(
  join(root, "src/features/store/public-product-gallery.tsx"),
  "utf8",
);
const publicContactCtaSource = readFileSync(
  join(root, "src/features/store/public-contact-cta.tsx"),
  "utf8",
);
const telegramRouteSource = readFileSync(
  join(root, "src/features/contact/telegram-route.ts"),
  "utf8",
);
if (
  !publicStorePageSource.includes("getPublicStoreBySlug") ||
  !publicStorePageSource.includes("getPublicCatalogItemsForStore") ||
  !publicStorePageSource.includes("PublicStorefrontShell") ||
  !publicStorePageSource.includes("notFound()") ||
  !publicStorePageSource.includes('storeResult.status === "error"') ||
  !publicStorePageSource.includes('throw new Error("Public store lookup failed.")') ||
  !publicStorePageSource.includes('dynamic = "force-dynamic"') ||
  publicStorePageSource.includes("Режим предпросмотра") ||
  publicStorePageSource.includes("@/features/store/queries") ||
  publicStorePageSource.includes("(seller)") ||
  publicStorePageSource.includes("Public storefront route") ||
  publicStorePageSource.includes("variant=\"telegram\"") ||
  publicStorePageSource.includes("createSupabaseServiceRoleClient") ||
  publicStorePageSource.includes("service-role") ||
  !publicStorePageSource.includes('catalogResult.status === "error"') ||
  !publicStoreQuerySource.includes("get_public_store_by_slug") ||
  !publicStoreQuerySource.includes("avatar_path") ||
  !publicStoreQuerySource.includes("avatarUrl") ||
  !publicStoreQuerySource.includes("contactConfigured") ||
  !publicStoreQuerySource.includes("telegramUsername") ||
  !publicStoreQuerySource.includes("createSignedUrl") ||
  !publicStoreQuerySource.includes('status: "found"') ||
  !publicStoreQuerySource.includes('status: "not_found"') ||
  !publicStoreQuerySource.includes('status: "error"') ||
  !publicStoreQuerySource.includes("normalizedSlug !== storeSlug") ||
  !publicStoreQuerySource.includes("validateStoreSlug(storeSlug, { allowEmpty: false })") ||
  !publicStoreQuerySource.includes("createSupabaseServerClient") ||
  publicStoreQuerySource.includes("return null") ||
  publicStoreQuerySource.includes("id: string") ||
  publicStoreQuerySource.includes("id:")
) {
  console.error("Foundation smoke check failed. Public store slug route can render invalid or old slugs.");
  process.exit(1);
}

if (
  !publicStoreNotFoundSource.includes("Витрина не найдена") ||
  publicStoreNotFoundSource.includes("seller") ||
  !publicStoreErrorSource.includes("Витрина временно недоступна") ||
  !publicStoreErrorSource.includes('"use client"') ||
  !publicStorefrontImageSource.includes('"use client"') ||
  !publicStorefrontImageSource.includes("onError") ||
  !publicStorefrontImageSource.includes("Нет фото")
) {
  console.error("Foundation smoke check failed. Public storefront fallback states are incomplete.");
  process.exit(1);
}

if (
  !previewStorePageSource.includes("getCurrentSellerStoreProfile") ||
  !previewStorePageSource.includes("getPublishedPublicCatalogItemsForStore") ||
  !previewStorePageSource.includes("buyerFacingStore") ||
  !previewStorePageSource.includes("avatarUrl") ||
  !previewStorePageSource.includes("contactConfigured") ||
  !previewStorePageSource.includes("PublicStorefrontShell") ||
  !previewStorePageSource.includes('href="/seller/store"') ||
  !previewStorePageSource.includes("Режим предпросмотра") ||
  previewStorePageSource.includes("seller_id") ||
  previewStorePageSource.includes("store_id") ||
  previewStorePageSource.includes("createSupabaseServiceRoleClient") ||
  previewStorePageSource.includes("service-role")
) {
  console.error("Foundation smoke check failed. Seller preview route guardrails are incomplete.");
  process.exit(1);
}

if (
  !publicStorefrontShellSource.includes("previewIndicator") ||
  !publicStorefrontShellSource.includes("catalogItems") ||
  !publicStorefrontShellSource.includes("avatarUrl") ||
  !publicStorefrontShellSource.includes("contactConfigured") ||
  !publicCatalogSource.includes('import "server-only"') ||
  !publicCatalogSource.includes("getPublishedPublicCatalogItemsForStore") ||
  !publicCatalogSource.includes("get_public_catalog_items_for_store") ||
  !publicCatalogSource.includes('status: "published"') ||
  !publicCatalogSource.includes("PublicCatalogResult") ||
  !publicCatalogSource.includes("status: \"published\"") ||
  publicCatalogSource.includes("createSupabaseServiceRoleClient") ||
  publicCatalogSource.includes("service-role") ||
  publicStorefrontShellSource.includes("status: \"draft\"") ||
  publicStorefrontShellSource.includes("status: \"hidden\"") ||
  publicCatalogSource.includes("status: \"draft\"") ||
  publicCatalogSource.includes("status: \"hidden\"") ||
  publicStorefrontShellSource.includes("recordAnalytics") ||
  publicStorefrontShellSource.includes("analytics.track") ||
  publicStorefrontShellSource.includes("navigator.sendBeacon") ||
  publicStorefrontShellSource.includes("fetch(\"/api/analytics") ||
  !publicStorefrontShellSource.includes("PublicCatalogView") ||
  !publicCatalogViewSource.includes("catalogItems.map") ||
  !publicCatalogViewSource.includes("<article") ||
  !publicCatalogViewSource.includes("availabilityStatus") ||
  !publicCatalogViewSource.includes("getProductPriceLabel") ||
  !publicCatalogViewSource.includes("Нет фото") ||
  publicStorefrontShellSource.includes("recordAnalytics") ||
  publicStorefrontShellSource.includes("navigator.sendBeacon")
) {
  console.error("Foundation smoke check failed. Preview/public storefront shell boundaries are incomplete.");
  process.exit(1);
}

if (
  !publicProductPageSource.includes("getPublicProductForStore") ||
  !publicProductPageSource.includes("getPublicStoreBySlug") ||
  !publicProductPageSource.includes("PublicProductDetail") ||
  !publicProductPageSource.includes('dynamic = "force-dynamic"') ||
  !publicProductPageSource.includes("params: Promise") ||
  !publicProductPageSource.includes("notFound()") ||
  !publicProductPageSource.includes('productResult.status === "not_found"') ||
  !publicProductPageSource.includes('productResult.status === "error"') ||
  publicProductPageSource.includes("createSupabaseServiceRoleClient") ||
  publicProductPageSource.includes("service-role") ||
  publicProductPageSource.includes("(seller)") ||
  !publicProductDetailSource.includes("PublicProductGallery") ||
  !publicProductDetailSource.includes("getProductPriceLabel") ||
  !publicProductDetailSource.includes("PublicProductContactCta") ||
  !publicProductDetailSource.includes("encodeURIComponent") ||
  !publicProductDetailSource.includes("availabilityStatus") ||
  !publicProductDetailSource.includes("description") ||
  !publicProductDetailSource.includes("productTitle={product.title}") ||
  !publicProductGallerySource.includes('"use client"') ||
  !publicProductGallerySource.includes("PublicStorefrontImage") ||
  !publicProductGallerySource.includes("onTouchStart") ||
  !publicProductGallerySource.includes("onTouchEnd") ||
  !publicProductGallerySource.includes("aria-live") ||
  !publicProductGallerySource.includes("aria-pressed") ||
  !publicProductGallerySource.includes("disabled={renderIndex") ||
  !publicProductGallerySource.includes("onTouchCancel") ||
  !publicProductGallerySource.includes("Math.abs(deltaX) <= Math.abs(deltaY)") ||
  !publicContactCtaSource.includes("data-contact-product-id") ||
  !publicContactCtaSource.includes("data-contact-store-slug") ||
  !publicContactCtaSource.includes("disabled={!contactConfigured || status === \"pending\"}") ||
  !publicContactCtaSource.includes("Связаться в Telegram") ||
  !publicContactCtaSource.includes("Связаться о") ||
  !publicContactCtaSource.includes("productTitle") ||
  !publicContactCtaSource.includes("onClick={handleContactClick}") ||
  !publicContactCtaSource.includes("/api/contact/telegram") ||
  !publicContactCtaSource.includes('window.open("about:blank", "_blank")') ||
  !publicContactCtaSource.includes("navigator.clipboard") ||
  !publicContactCtaSource.includes("Скопировать текст сообщения") ||
  !telegramRouteSource.includes("prepareTelegramHandoff") ||
  !telegramRouteSource.includes("normalizeAnalyticsSessionId") ||
  telegramRouteSource.includes("createSupabaseServiceRoleClient") ||
  publicProductPageSource.includes("createSupabaseServiceRoleClient") ||
  publicProductDetailSource.includes("recordAnalytics") ||
  publicProductGallerySource.includes("storage_path")
) {
  console.error("Foundation smoke check failed. Public product detail boundaries are incomplete.");
  process.exit(1);
}

const productMigrationSource = readFileSync(
  join(root, "supabase/migrations/20260801183000_create_products.sql"),
  "utf8",
);
if (
  !productMigrationSource.includes("products_title_length_check") ||
  !productMigrationSource.includes("products_description_length_check") ||
  !productMigrationSource.includes("products_price_mode_check") ||
  !productMigrationSource.includes("products_price_amount_check") ||
  !productMigrationSource.includes("products_availability_status_check") ||
  !productMigrationSource.includes("products_status_check") ||
  !productMigrationSource.includes("products_store_id_idx") ||
  !productMigrationSource.includes("products_store_status_idx") ||
  !productMigrationSource.includes("products.status = 'draft'") ||
  !productMigrationSource.includes("products.status = 'published'")
) {
  console.error("Foundation smoke check failed. Product migration boundaries are incomplete.");
  process.exit(1);
}

const productMediaMigrationName = readdirSync(migrationDir).find((fileName) =>
  fileName.endsWith("_create_product_media.sql"),
);
if (!productMediaMigrationName) {
  console.error("Foundation smoke check failed. Product media migration is missing.");
  process.exit(1);
}

const productMediaMigration = readFileSync(
  join(migrationDir, productMediaMigrationName),
  "utf8",
);
const nextConfigSource = readFileSync(join(root, "next.config.ts"), "utf8");
const requiredProductMediaMigrationSnippets = [
  "create table if not exists public.product_media",
  "product_id uuid not null references public.products(id) on delete cascade",
  "storage_path text not null",
  "mime_type text not null",
  "byte_size bigint not null",
  "sort_order smallint not null",
  "product_media_mime_type_check",
  "product_media_sort_order_check",
  "product_media_product_sort_order_key",
  "product-media",
  "file_size_limit",
  "allowed_mime_types",
  "product_media_owner",
  "product_media_published",
  "product_media_storage_owner",
  "product_media_identity_immutable",
  "get_published_product_media_for_catalog",
  "remove_product_media",
  "restore_product_media",
  "published_product_requires_media",
  "storage.objects",
];
if (
  requiredProductMediaMigrationSnippets.some(
    (snippet) => !productMediaMigration.includes(snippet),
  ) ||
  /public\s*=\s*true/i.test(productMediaMigration)
) {
  console.error("Foundation smoke check failed. Product media storage boundary is incomplete.");
  process.exit(1);
}
if (
  !nextConfigSource.includes('bodySizeLimit: "7mb"') ||
  productMediaMigration.includes('create policy "product_media_published_select"') ||
  productMediaMigration.includes('create policy "product_media_owner_update"')
) {
  console.error("Foundation smoke check failed. Product media request or database exposure limits are incomplete.");
  process.exit(1);
}

const lifecycleMigrationName = readdirSync(migrationDir).find((fileName) =>
  fileName.endsWith("_add_product_lifecycle_guards.sql"),
);
if (!lifecycleMigrationName) {
  console.error("Foundation smoke check failed. Product lifecycle migration is missing.");
  process.exit(1);
}

const lifecycleMigration = readFileSync(
  join(migrationDir, lifecycleMigrationName),
  "utf8",
);
const requiredLifecycleMigrationSnippets = [
  "enforce_product_lifecycle_transition",
  "app.product_lifecycle_transition",
  "set_config('app.product_lifecycle_transition', 'on', true)",
  "enforce_published_product_contract",
  "min_sort_order",
  "max_sort_order",
  "products_lifecycle_transition_guard",
  "products_publication_contract_guard",
  "products_update_own",
  "transition_product_lifecycle",
  "get_public_product_for_store",
  "product_media_storage_delete_owner",
  "status <> 'deleted'",
  "status = 'published'",
  "published_product_requires_media",
  "grant execute on function public.transition_product_lifecycle(uuid, text) to authenticated",
];
if (
  requiredLifecycleMigrationSnippets.some(
    (snippet) => !lifecycleMigration.includes(snippet),
  ) ||
  lifecycleMigration.includes("createSupabaseServiceRoleClient") ||
  lifecycleMigration.includes("delete from storage.objects")
) {
  console.error("Foundation smoke check failed. Product lifecycle migration boundaries are incomplete.");
  process.exit(1);
}

const mediaFeatureFiles = [
  "src/features/product/media-actions.ts",
  "src/features/product/media-queries.ts",
  "src/features/product/media-schema.ts",
  "src/features/product/media-upload-service.ts",
  "src/features/product/product-media-manager.tsx",
  "src/features/product/product-media-upload-queue.tsx",
];
const mediaFeatureSource = mediaFeatureFiles
  .map((filePath) => readFileSync(join(root, filePath), "utf8"))
  .join("\n");
if (
  mediaFeatureSource.includes("createSupabaseServiceRoleClient") ||
  mediaFeatureSource.includes("service-role") ||
  mediaFeatureSource.includes('formData.get("seller_id")') ||
  mediaFeatureSource.includes('formData.get("store_id")') ||
  mediaFeatureSource.includes('formData.get("storage_path")') ||
  !mediaFeatureSource.includes('"image/jpeg"') ||
  !mediaFeatureSource.includes('"image/png"') ||
  !mediaFeatureSource.includes('"image/webp"') ||
  !mediaFeatureSource.includes("PRODUCT_MEDIA_MAX_COUNT = 10") ||
  !mediaFeatureSource.includes("PRODUCT_MEDIA_MAX_BYTES = 6 * 1024 * 1024") ||
  !mediaFeatureSource.includes("validateProductMediaSignature") ||
  !mediaFeatureSource.includes("normalizeProductMediaOrder") ||
  !mediaFeatureSource.includes("canRemoveProductMedia") ||
  !mediaFeatureSource.includes("createSignedUrl") ||
  !mediaFeatureSource.includes("useTransition") ||
  !mediaFeatureSource.includes("XMLHttpRequest") ||
  !mediaFeatureSource.includes("aria-label")
) {
  console.error("Foundation smoke check failed. Product media validation or privilege boundaries are incomplete.");
  process.exit(1);
}

const productListSource = readFileSync(
  join(root, "src/features/product/product-list.ts"),
  "utf8",
);
const productQueriesSource = readFileSync(
  join(root, "src/features/product/queries.ts"),
  "utf8",
);
const productMediaQueriesSource = readFileSync(
  join(root, "src/features/product/media-queries.ts"),
  "utf8",
);
if (
  !productListSource.includes("parseSellerProductListFilter") ||
  !productListSource.includes("matchesSellerProductListFilter") ||
  !productQueriesSource.includes("filter: SellerProductListFilter") ||
  !productQueriesSource.includes('productQuery.neq("status", "deleted")') ||
  !productQueriesSource.includes('productQuery.eq("status", filter)') ||
  !productMediaQueriesSource.includes("getSellerProductCovers") ||
  !productMediaQueriesSource.includes('.eq("sort_order", 0)') ||
  !productMediaQueriesSource.includes("createSignedProductMediaUrl") ||
  !productMediaQueriesSource.includes('mapProductMediaRow(row, url ?? "")') ||
  productQueriesSource.includes("createSupabaseServiceRoleClient") ||
  productMediaQueriesSource.includes("createSupabaseServiceRoleClient")
) {
  console.error("Foundation smoke check failed. Seller product list query/media boundaries are incomplete.");
  process.exit(1);
}

const validJpeg = new File(
  [new Uint8Array([0xff, 0xd8, 0xff, 0x00])],
  "valid.jpg",
  { type: "image/jpeg" },
);
const invalidType = new File([new Uint8Array([0x00])], "invalid.gif", {
  type: "image/gif",
});
const oversizedImage = new File(
  [new Uint8Array(6 * 1024 * 1024 + 1)],
  "large.jpg",
  { type: "image/jpeg" },
);
const validFileResult = validateProductMediaFile(validJpeg);
const invalidTypeResult = validateProductMediaFile(invalidType);
const oversizedResult = validateProductMediaFile(oversizedImage);
const validSignatureResult = await validateProductMediaSignature(validJpeg, "image/jpeg");
const invalidSignatureResult = await validateProductMediaSignature(invalidType, "image/jpeg");
const normalizedOrder = normalizeProductMediaOrder(
  ["cover", "second", "third"],
  ["third", "cover", "second"],
);
if (
  !validFileResult.isValid ||
  invalidTypeResult.isValid ||
  oversizedResult.isValid ||
  !validSignatureResult.isValid ||
  invalidSignatureResult.isValid ||
  !normalizedOrder ||
  normalizedOrder[0]?.sortOrder !== 0 ||
  normalizedOrder[2]?.id !== "second" ||
  normalizeProductMediaOrder(["cover", "second"], ["cover", "cover"]) ||
  canRemoveProductMedia("published", 1) ||
  !canRemoveProductMedia("published", 2) ||
  !canRemoveProductMedia("draft", 0)
) {
  console.error("Foundation smoke check failed. Product media invariants are not executable.");
  process.exit(1);
}

const validPublicationValues = {
  title: "Товар для публикации",
  priceMode: "fixed",
  priceAmount: "2500",
  description: "Описание товара",
  availabilityStatus: "out_of_stock",
};
const validPublication = validateProductPublication(validPublicationValues, 1);
const missingMediaPublication = validateProductPublication(validPublicationValues, 0);
const invalidTitlePublication = validateProductPublication(
  { ...validPublicationValues, title: "" },
  1,
);
const invalidPricePublication = validateProductPublication(
  { ...validPublicationValues, priceAmount: "0" },
  1,
);
const invalidAvailabilityPublication = validateProductPublication(
  { ...validPublicationValues, availabilityStatus: "unknown" },
  1,
);
const lifecycleActionSource = readFileSync(
  join(root, "src/features/product/actions.ts"),
  "utf8",
);
const lifecycleEditorSource = readFileSync(
  join(root, "src/features/product/product-state-control.tsx"),
  "utf8",
);
const lifecycleContextSource = readFileSync(
  join(root, "src/features/product/product-lifecycle-context.tsx"),
  "utf8",
);
if (
  !validPublication.isValid ||
  validPublication.fieldErrors.media ||
  missingMediaPublication.isValid ||
  !missingMediaPublication.fieldErrors.media ||
  invalidTitlePublication.isValid ||
  !invalidTitlePublication.fieldErrors.title ||
  invalidPricePublication.isValid ||
  !invalidPricePublication.fieldErrors.priceAmount ||
  invalidAvailabilityPublication.isValid ||
  !invalidAvailabilityPublication.fieldErrors.availabilityStatus ||
  !canTransitionProductStatus("draft", PRODUCT_STATUS_PUBLISHED) ||
  !canTransitionProductStatus("hidden", PRODUCT_STATUS_PUBLISHED) ||
  !canTransitionProductStatus("published", PRODUCT_STATUS_HIDDEN) ||
  !canTransitionProductStatus("published", PRODUCT_STATUS_DELETED) ||
  canTransitionProductStatus("deleted", PRODUCT_STATUS_PUBLISHED) ||
  canTransitionProductStatus("published", "draft") ||
  !lifecycleActionSource.includes('formData.get("confirmDelete")') ||
  !lifecycleActionSource.includes("storage_cleanup_failed") ||
  !lifecycleActionSource.includes('productStatus: PRODUCT_STATUS_DELETED') ||
  !lifecycleEditorSource.includes("setLastAction") ||
  !lifecycleEditorSource.includes("useProductLifecycleStatus") ||
  !lifecycleContextSource.includes("ProductLifecycleProvider") ||
  !lifecycleContextSource.includes("setProductStatus")
) {
  console.error("Foundation smoke check failed. Product lifecycle invariants are not executable.");
  process.exit(1);
}

const publicCatalogMediaSource = readFileSync(
  join(root, "src/features/store/public-catalog.ts"),
  "utf8",
);
if (
  !publicCatalogMediaSource.includes("media") ||
  !publicCatalogMediaSource.includes("getPublishedProductMediaForCatalog") ||
  !publicCatalogMediaSource.includes("getPublicProductForStore") ||
  !publicCatalogMediaSource.includes("get_public_product_for_store") ||
  publicCatalogMediaSource.includes("storage_path") ||
  publicCatalogMediaSource.includes("createSupabaseServiceRoleClient")
) {
  console.error("Foundation smoke check failed. Public catalog media boundary is incomplete.");
  process.exit(1);
}

if (
  !publicCatalogViewSource.includes("PublicCatalogItem") ||
  !publicCatalogViewSource.includes("getProductPriceLabel") ||
  !publicCatalogViewSource.includes("ProductMedia") ||
  !publicCatalogViewSource.includes("PUBLIC_CATALOG_VIEW_STORAGE_KEY") ||
  !publicCatalogViewSource.includes('"grid"') ||
  !publicCatalogViewSource.includes('"list"') ||
  !publicCatalogViewSource.includes("readStoredCatalogView") ||
  !publicCatalogViewSource.includes("window.localStorage") ||
  !publicCatalogViewSource.includes("queueMicrotask") ||
  !publicCatalogViewSource.includes("aria-pressed") ||
  !publicCatalogViewSource.includes("grid-cols-2") ||
  !publicCatalogViewSource.includes("flex flex-col gap-5") ||
  !publicCatalogViewSource.includes('from "next/link"') ||
  !publicCatalogViewSource.includes("getPublicProductDetailHref") ||
  !publicCatalogViewSource.includes('from "./public-contact-cta"') ||
  !publicCatalogViewSource.includes("<PublicProductContactCta") ||
  !publicCatalogViewSource.includes("contactConfigured") ||
  !publicCatalogViewSource.includes("productId") ||
  !publicCatalogViewSource.includes("storeSlug") ||
  publicCatalogViewSource.includes("createSupabaseServiceRoleClient") ||
  publicCatalogViewSource.includes("service-role") ||
  publicCatalogViewSource.includes("navigator.sendBeacon") ||
  publicCatalogViewSource.includes("/api/analytics")
) {
  console.error("Foundation smoke check failed. Buyer catalog view model is incomplete.");
  process.exit(1);
}

console.log("Foundation smoke check passed.");
