import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  PRODUCT_MEDIA_MAX_BYTES,
  PRODUCT_MEDIA_MAX_COUNT,
  validateProductMediaFile,
  validateProductMediaSignature,
} from "../src/features/product/media-schema.ts";

const projectRoot = path.resolve(import.meta.dirname, "..");
const serviceSource = fs.readFileSync(
  path.join(projectRoot, "src/features/product/media-upload-service.ts"),
  "utf8",
);
const routeSource = fs.readFileSync(
  path.join(
    projectRoot,
    "src/app/api/seller/products/[productId]/media/route.ts",
  ),
  "utf8",
);
const legacyActionSource = fs.readFileSync(
  path.join(projectRoot, "src/features/product/media-actions.ts"),
  "utf8",
);
const queueSource = fs.readFileSync(
  path.join(
    projectRoot,
    "src/features/product/product-media-upload-queue.tsx",
  ),
  "utf8",
);
const managerSource = fs.readFileSync(
  path.join(projectRoot, "src/features/product/product-media-manager.tsx"),
  "utf8",
);
const lifecycleControlSource = fs.readFileSync(
  path.join(projectRoot, "src/features/product/product-state-control.tsx"),
  "utf8",
);

const signatures = {
  "image/jpeg": [0xff, 0xd8, 0xff, 0x00],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/webp": [
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ],
};

test("accepts only valid JPG, PNG and WebP signatures within 6 MiB", async () => {
  for (const [mimeType, bytes] of Object.entries(signatures)) {
    const file = new File([Uint8Array.from(bytes)], `photo.${mimeType.split("/")[1]}`, {
      type: mimeType,
    });
    const validation = validateProductMediaFile(file);
    assert.equal(validation.isValid, true, mimeType);
    assert.equal(
      (await validateProductMediaSignature(file, mimeType)).isValid,
      true,
      mimeType,
    );
  }

  const mismatched = new File([Uint8Array.from(signatures["image/png"])], "fake.jpg", {
    type: "image/jpeg",
  });
  assert.equal(
    (await validateProductMediaSignature(mismatched, "image/jpeg")).isValid,
    false,
  );

  const oversized = new File([new Uint8Array(PRODUCT_MEDIA_MAX_BYTES + 1)], "large.png", {
    type: "image/png",
  });
  assert.equal(validateProductMediaFile(oversized).isValid, false);
});

test("exposes one same-origin file per POST with a typed JSON boundary", () => {
  assert.match(routeSource, /export async function POST/);
  assert.match(routeSource, /RouteContext<"\/api\/seller\/products\/\[productId\]\/media">/);
  assert.match(routeSource, /new URL\(origin\)\.origin === new URL\(request\.url\)\.origin/);
  assert.match(routeSource, /PRODUCT_MEDIA_MAX_REQUEST_BYTES/);
  assert.match(routeSource, /!Number\.isFinite\(contentLength\) \|\| contentLength <= 0/);
  assert.match(routeSource, /await request\.formData\(\)/);
  assert.match(routeSource, /formData\.getAll\("file"\)/);
  assert.match(routeSource, /formData\.get\("uploadId"\)/);
  assert.match(routeSource, /isProductId\(uploadId\)/);
  assert.match(routeSource, /fileEntries\.length !== 1/);
  assert.match(routeSource, /files\.length !== 1/);
  assert.match(routeSource, /ProductMediaUploadResponse/);
  assert.match(routeSource, /status: "success"/);
  assert.match(routeSource, /status: "error"/);
  assert.match(routeSource, /media: null/);
});

test("keeps auth, ownership, capacity and server validation in the upload service", () => {
  assert.equal(PRODUCT_MEDIA_MAX_COUNT, 10);
  assert.match(serviceSource, /supabase\.auth\.getUser\(\)/);
  assert.match(serviceSource, /\.eq\("store_id", storeResult\.storeId\)/);
  assert.match(serviceSource, /\.neq\("status", "deleted"\)/);
  assert.match(serviceSource, /currentCount >= PRODUCT_MEDIA_MAX_COUNT/);
  assert.match(serviceSource, /getExistingProductMediaUpload/);
  assert.match(serviceSource, /mediaId: requestedMediaId/);
  assert.match(serviceSource, /validateProductMediaFile\(file\)/);
  assert.match(serviceSource, /validateProductMediaSignature\(file, validation\.mimeType\)/);
  assert.match(serviceSource, /\.upload\(storagePath, file,/);
  assert.match(serviceSource, /\.rpc\(\s*"insert_product_media"/);
  assert.doesNotMatch(serviceSource, /createSupabaseServiceRoleClient|service-role/);
  assert.doesNotMatch(serviceSource, /seller_id|formData\.get\("store_id"\)/);
});

test("cleans Storage when metadata persistence fails and keeps legacy upload compatible", () => {
  assert.match(
    serviceSource,
    /if \(insertError\) \{[\s\S]*removeUploadedObject\(supabase, storagePath\)/,
  );
  assert.match(serviceSource, /code: "cleanup"/);
  assert.match(serviceSource, /upsert: false/);
  assert.match(legacyActionSource, /persistValidatedProductMediaFile/);
  assert.match(legacyActionSource, /\.rpc\("insert_product_media", arguments_\)/);
  assert.match(legacyActionSource, /uploadedPaths\.push\(persisted\.upload\.storagePath\)/);
  assert.match(legacyActionSource, /insertedIds\.push\(persisted\.upload\.mediaId\)/);
  assert.doesNotMatch(legacyActionSource, /\.from\("product_media"\)\.insert/);
});

test("keeps a sequential client queue with real XHR progress and recoverable files", () => {
  assert.match(queueSource, /URL\.createObjectURL\(file\)/);
  assert.match(queueSource, /URL\.revokeObjectURL/);
  assert.match(queueSource, /activeUploadIdRef/);
  assert.match(queueSource, /new XMLHttpRequest\(\)/);
  assert.match(queueSource, /request\.upload\.addEventListener\("progress"/);
  assert.match(queueSource, /event\.lengthComputable/);
  assert.match(queueSource, /request\.upload\.addEventListener\("load"/);
  assert.match(queueSource, /status: "processing"/);
  assert.match(queueSource, /formData\.set\("file", nextItem\.file\)/);
  assert.match(queueSource, /formData\.set\("uploadId", nextItem\.id\)/);
  assert.match(queueSource, /retryItem\(item\.id\)/);
  assert.match(queueSource, /Повторить загрузку \$\{item\.file\.name\}/);
  assert.match(queueSource, /runSignaturePreflight\(itemId, item\.file\)/);
  assert.match(queueSource, /list-disc space-y-1 break-words/);
  assert.match(managerSource, /removalDialogOpenRef\.current/);
  assert.match(lifecycleControlSource, /confirmationDialogOpenRef\.current/);
  assert.doesNotMatch(queueSource, /setInterval|Math\.random\(\)\s*\*\s*100/);
});

test("syncs persisted media and uses shared native dialogs for destructive actions", () => {
  assert.match(managerSource, /onMediaChange\?: \(media: ProductMedia\[\]\) => void/);
  assert.match(managerSource, /onMediaChangeRef\.current\?\.\(normalized\)/);
  assert.match(managerSource, /Сделать обложкой/);
  assert.match(managerSource, />\s*Выше\s*</);
  assert.match(managerSource, />\s*Ниже\s*</);
  assert.match(managerSource, /<Dialog/);
  assert.match(managerSource, /data-dialog-initial-focus/);
  assert.match(lifecycleControlSource, /<Dialog/);
  assert.match(lifecycleControlSource, /setConfirmation\("hide"\)/);
  assert.match(lifecycleControlSource, /setConfirmation\("delete"\)/);
  assert.match(lifecycleControlSource, /data-dialog-initial-focus/);
  assert.doesNotMatch(
    `${managerSource}\n${lifecycleControlSource}`,
    /aria-modal="false"|window\.(?:alert|confirm|prompt)/,
  );
});
