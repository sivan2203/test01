import { existsSync, readFileSync } from "node:fs";
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

console.log("Foundation smoke check passed.");
