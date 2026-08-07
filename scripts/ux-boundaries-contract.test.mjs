import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("the create-product route is a recoverable four-step wizard", () => {
  const page = read("src/app/(seller)/seller/(admin)/products/new/page.tsx");
  const wizard = read("src/features/product/product-create-wizard.tsx");
  const stepper = read("src/features/product/product-wizard-stepper.tsx");

  assert.match(page, /ProductCreateWizard/);
  assert.match(page, /searchParams: Promise/);
  assert.match(page, /draft/);
  assert.match(page, /getSellerProductById/);
  assert.match(page, /getSellerProductMedia/);
  assert.match(wizard, /saveProductWizardDraft/);
  assert.match(wizard, /ProductMediaManager/);
  assert.match(wizard, /ProductReview/);
  assert.match(wizard, /ErrorSummary/);
  assert.match(wizard, /window\.history\.pushState/);
  assert.match(wizard, /window\.history\.replaceState/);
  assert.match(stepper, /Основное|PRODUCT_WIZARD_STEPS/);
  assert.match(stepper, /aria-current/);
});

test("photo uploads use one-file same-origin XHR with real progress and retained retry files", () => {
  const queue = read("src/features/product/product-media-upload-queue.tsx");
  const route = read("src/app/api/seller/products/[productId]/media/route.ts");
  const service = read("src/features/product/media-upload-service.ts");

  assert.match(queue, /new XMLHttpRequest\(\)/);
  assert.match(queue, /request\.upload\.addEventListener\("progress"/);
  assert.match(queue, /status: "processing"/);
  assert.match(queue, /activeUploadIdRef/);
  assert.match(queue, /retryItem/);
  assert.match(queue, /file: File/);
  assert.match(queue, /formData\.set\("file", nextItem\.file\)/);
  assert.match(queue, /validateProductMediaSignature/);
  assert.doesNotMatch(queue, /Promise\.all/);

  assert.match(route, /isSameOriginRequest/);
  assert.match(route, /fileEntries\.length !== 1/);
  assert.match(route, /PRODUCT_MEDIA_MAX_REQUEST_BYTES/);
  assert.match(route, /uploadSingleProductMedia/);
  assert.match(service, /supabase\.auth\.getUser\(\)/);
  assert.match(service, /validateProductMediaSignature/);
  assert.match(service, /PRODUCT_MEDIA_MAX_COUNT/);
  assert.doesNotMatch(route + service, /service-role|service_role/);
});

test("destructive confirmations share a native modal with cancel-first focus and restoration", () => {
  const dialog = read("src/components/ui/dialog.tsx");
  const productState = read("src/features/product/product-state-control.tsx");
  const mediaManager = read("src/features/product/product-media-manager.tsx");

  assert.match(dialog, /<dialog/);
  assert.match(dialog, /showModal\(\)/);
  assert.match(dialog, /onCancel/);
  assert.match(dialog, /data-dialog-initial-focus/);
  assert.match(dialog, /restoreTarget\?\.isConnected/);
  assert.match(dialog, /focusWasMoved/);
  assert.match(dialog, /fallbackFocusId/);
  assert.match(dialog, /querySelector<HTMLElement>\("#main-content"\)/);
  assert.match(dialog, /focusTarget\?\.focus\(\)/);
  assert.match(productState, /<Dialog/);
  assert.match(mediaManager, /<Dialog/);
  assert.doesNotMatch(productState + mediaManager, /window\.(?:alert|confirm|prompt)/);
});

test("store settings preserve controlled dirty state, safe slug checks, and responsive preview", () => {
  const form = read("src/features/store/store-profile-form.tsx");
  const dirtyBar = read("src/features/store/store-dirty-bar.tsx");
  const preview = read("src/features/store/store-live-preview.tsx");
  const action = read("src/features/store/actions.ts");

  assert.match(form, /value=\{values\.name\}/);
  assert.match(form, /isStoreProfileDirty/);
  assert.match(form, /checkStoreSlugAvailability/);
  assert.match(form, /setTimeout/);
  assert.match(form, /StoreSettingsNav/);
  assert.match(form, /StoreLivePreview/);
  assert.match(form, /<Dialog/);
  assert.match(dirtyBar, /Есть несохранённые изменения/);
  assert.match(dirtyBar, /onDiscard/);
  assert.match(dirtyBar, /type="submit"/);
  assert.match(preview, /ВИД ПОКУПАТЕЛЯ/);
  assert.match(action, /is_store_slug_available/);
  assert.match(action, /supabase\.auth\.getUser\(\)/);
});

test("public contact stays product-bound and never auto-sends a message", () => {
  const catalog = read("src/features/store/public-catalog-view.tsx");
  const detail = read("src/features/store/public-product-detail.tsx");
  const cta = read("src/features/store/public-contact-cta.tsx");
  const route = read("src/app/api/contact/telegram/route.ts");
  const routeService = read("src/features/contact/telegram-route.ts");

  assert.match(catalog, /productTitle/);
  assert.match(detail, /productTitle=\{product\.title\}/);
  assert.match(cta, /productTitle\?/);
  assert.match(cta, /\/api\/contact\/telegram/);
  assert.match(cta, /navigator\.clipboard/);
  assert.match(route, /handleTelegramHandoffRequest/);
  assert.match(routeService, /prepareTelegramHandoff/);
  assert.doesNotMatch(cta + route + routeService, /sendMessage|messages\.send|bot\.send/i);
  assert.doesNotMatch(catalog, /view === "grid" \? "block" : "contents"/);
  assert.match(catalog, /col-span-2 grid grid-cols-/);
});

test("entity routes expose dedicated loading, error, and not-found boundaries", () => {
  const required = [
    "src/app/(seller)/seller/(admin)/loading.tsx",
    "src/app/(seller)/seller/(admin)/error.tsx",
    "src/app/(seller)/seller/(admin)/not-found.tsx",
    "src/app/(public)/[storeSlug]/loading.tsx",
    "src/app/(public)/[storeSlug]/error.tsx",
    "src/app/(public)/[storeSlug]/not-found.tsx",
    "src/app/(public)/[storeSlug]/products/[productId]/loading.tsx",
    "src/app/(public)/[storeSlug]/products/[productId]/error.tsx",
    "src/app/(public)/[storeSlug]/products/[productId]/not-found.tsx",
  ];

  for (const relativePath of required) {
    assert.ok(fs.existsSync(path.join(projectRoot, relativePath)), relativePath);
  }

  const publicStore = read("src/app/(public)/[storeSlug]/page.tsx");
  const publicProduct = read(
    "src/app/(public)/[storeSlug]/products/[productId]/page.tsx",
  );
  const sellerProduct = read(
    "src/app/(seller)/seller/(admin)/products/[productId]/edit/page.tsx",
  );
  const sellerStore = read(
    "src/app/(seller)/seller/(admin)/store/page.tsx",
  );
  assert.match(publicStore, /export async function generateMetadata/);
  assert.match(publicStore, /getCachedPublicStoreBySlug/);
  assert.match(publicProduct, /export async function generateMetadata/);
  assert.match(publicProduct, /getCachedPublicProductForStore/);
  assert.match(sellerProduct, /export async function generateMetadata/);
  assert.match(sellerProduct, /getCachedSellerProductById/);
  assert.match(sellerStore, /title: "Настройки магазина"/);
});

test("reviewed form feedback stays programmatically associated and recoverable", () => {
  const status = read("src/components/ui/status-message.tsx");
  const store = read("src/features/store/store-profile-form.tsx");
  const productForm = read("src/features/product/product-form.tsx");
  const signIn = read("src/features/seller-auth/sign-in-form.tsx");
  const lifecycle = read("src/features/product/product-state-control.tsx");
  const mediaManager = read("src/features/product/product-media-manager.tsx");

  assert.match(status, /\.\.\.props/);
  assert.match(store, /aria-invalid=\{Boolean\(slugError \|\| slugCheckHasProblem\)\}/);
  assert.match(store, /error=\{slugCheckHasProblem\}/);
  assert.match(productForm, /product-price-error/);
  assert.match(productForm, /aria-describedby=/);
  assert.match(signIn, /aria-invalid=\{emailHasError\}/);
  assert.match(signIn, /seller-email-help seller-email-status/);
  assert.match(lifecycle, /try \{[\s\S]*await handler/);
  assert.match(mediaManager, /try \{[\s\S]*await manageProductMedia/);
});

test("accessibility review fixes remain explicit at dynamic boundaries", () => {
  const alert = read("src/components/ui/alert.tsx");
  const cta = read("src/features/store/public-contact-cta.tsx");
  const gallery = read("src/features/store/public-product-gallery.tsx");
  const queue = read("src/features/product/product-media-upload-queue.tsx");
  const importFlow = read("src/features/import/import-product-flow.tsx");

  assert.match(alert, /titleAs: Title = "p"/);
  assert.match(cta, /visibleButtonLabel/);
  assert.match(cta, /Связаться о товаре «\$\{productTitle\}» в Telegram/);
  assert.match(cta, /h-auto min-h-11 whitespace-normal break-words/);
  assert.match(cta, /disabled:opacity-100/);
  assert.match(cta, /statusAnnouncement/);
  assert.match(cta, /role="status"/);
  assert.match(gallery, /aria-pressed=\{renderIndex === index\}/);
  assert.match(gallery, />\s*✓\s*<\/span>/);
  assert.match(queue, /const rejectedMessages: string\[\] = \[\]/);
  assert.match(queue, /rejectedMessages\.push\(`/);
  assert.match(queue, /setSelectionErrors\(visibleRejections\)/);
  assert.match(queue, /key=\{announcement\.sequence\}/);
  assert.match(queue, /id="media-upload-constraints"/);
  assert.match(queue, /aria-describedby="media-upload-constraints"/);
  assert.match(queue, /Некоторые файлы не добавлены/);
  assert.match(importFlow, /Файл <strong[\s\S]*прочитан/);
  assert.match(importFlow, /role="status"/);
});
