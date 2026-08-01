import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getSellerReturnPath,
  isDevSellerSessionCookie,
  SELLER_SIGN_IN_PATH,
} from "../src/proxy-rules.mjs";

const root = process.cwd();
const requiredPaths = [
  "src/app/page.tsx",
  "src/app/(public)/[storeSlug]/page.tsx",
  "src/app/(seller)/seller/page.tsx",
  "src/app/(seller)/seller/sign-in/page.tsx",
  "src/components/ui/button.tsx",
  "src/components/design-system/surface.tsx",
  "src/lib/supabase/browser.ts",
  "src/lib/supabase/server.ts",
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
if (!routeManifest["/page"] || !routeManifest["/(public)/[storeSlug]/page"]) {
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

if (
  !isDevSellerSessionCookie("dev", "development") ||
  isDevSellerSessionCookie("dev", "production")
) {
  console.error("Foundation smoke check failed. Dev seller bypass is not environment-gated.");
  process.exit(1);
}

if (getSellerReturnPath("/seller", "?invite=abc") !== "/seller?invite=abc") {
  console.error("Foundation smoke check failed. Seller redirect return path drops query state.");
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
