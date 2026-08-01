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
  "src/app/(seller)/seller/(admin)/analytics/page.tsx",
  "src/app/(seller)/seller/(admin)/store/page.tsx",
  "src/app/(seller)/seller/sign-in/page.tsx",
  "src/app/auth/callback/route.ts",
  "src/components/ui/button.tsx",
  "src/components/design-system/surface.tsx",
  "src/features/seller-auth/actions.ts",
  "src/features/seller-auth/redirect.ts",
  "src/features/seller-auth/sign-in-form.tsx",
  "src/features/store/actions.ts",
  "src/features/store/avatar.ts",
  "src/features/store/form-state.ts",
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
  !routeManifest["/(seller)/seller/(admin)/store/page"] ||
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

const storeFeatureFiles = [
  "src/features/store/actions.ts",
  "src/features/store/avatar.ts",
  "src/features/store/form-state.ts",
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
  !storeFeatureSource.includes("countStoreTextCharacters") ||
  !storeFeatureSource.includes("Array.from(value).length") ||
  !storeFeatureSource.includes("STORE_AVATAR_MAX_BYTES = 2 * 1024 * 1024") ||
  !storeFeatureSource.includes("\"image/jpeg\"") ||
  !storeFeatureSource.includes("\"image/png\"") ||
  !storeFeatureSource.includes("\"image/webp\"") ||
  !storeFeatureSource.includes("validateStoreAvatarSignature") ||
  !storeFeatureSource.includes("file.slice(0, 12).arrayBuffer()") ||
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
  !storeActionSource.includes("validateStoreAvatarSignature")
) {
  console.error("Foundation smoke check failed. Store avatar lifecycle review guardrails are incomplete.");
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

console.log("Foundation smoke check passed.");
