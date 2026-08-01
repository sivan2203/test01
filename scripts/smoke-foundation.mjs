import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getSafeSellerRedirectPath,
  getSellerReturnPath,
  SELLER_SIGN_IN_PATH,
} from "../src/proxy-rules.mjs";

const root = process.cwd();
const requiredPaths = [
  "src/app/page.tsx",
  "src/app/(public)/[storeSlug]/page.tsx",
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
  "src/features/product/queries.ts",
  "src/features/product/schema.ts",
  "src/features/store/actions.ts",
  "src/features/store/avatar.ts",
  "src/features/store/form-state.ts",
  "src/features/store/public-catalog.ts",
  "src/features/store/public-storefront-shell.tsx",
  "src/features/store/public-queries.ts",
  "src/features/store/queries.ts",
  "src/features/store/schema.ts",
  "src/features/store/store-profile-form.tsx",
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

const indexHtml = readFileSync(indexHtmlPath, "utf8");
if (!indexHtml.includes("Story 1.0 foundation smoke route")) {
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
  "src/features/product/product-form.tsx",
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
  !productFeatureSource.includes("updateProductDraft") ||
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
if (
  !sellerProductsSource.includes("getSellerProducts") ||
  !sellerProductsSource.includes('href="/seller/products/new"') ||
  !sellerProductsSource.includes('href={`/seller/products/${product.id}/edit`}') ||
  !sellerProductNewSource.includes("getCurrentSellerStoreProfile") ||
  !sellerProductNewSource.includes("getInitialProductDraftFormState(null)") ||
  !sellerProductNewSource.includes("ProductForm") ||
  !sellerProductEditSource.includes("getSellerProductDraftById") ||
  !sellerProductEditSource.includes("getInitialProductDraftFormState(productResult.product)") ||
  !sellerProductEditSource.includes("ProductForm") ||
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
if (
  !publicStorePageSource.includes("getPublicStoreBySlug") ||
  !publicStorePageSource.includes("getPublishedPublicCatalogItemsForStore") ||
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
  !publicStoreQuerySource.includes("get_public_store_by_slug") ||
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
  !previewStorePageSource.includes("getCurrentSellerStoreProfile") ||
  !previewStorePageSource.includes("getPublishedPublicCatalogItemsForStore") ||
  !previewStorePageSource.includes("buyerFacingStore") ||
  previewStorePageSource.includes("avatarUrl") ||
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
  publicStorefrontShellSource.includes("avatarUrl") ||
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
  publicStorefrontShellSource.includes("catalogItems.map") ||
  publicStorefrontShellSource.includes("<article")
) {
  console.error("Foundation smoke check failed. Preview/public storefront shell boundaries are incomplete.");
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

console.log("Foundation smoke check passed.");
