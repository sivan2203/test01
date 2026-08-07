import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  getStoreProfileSnapshot,
  getStoreProfileValuesFromSnapshot,
  isStoreProfileDirty,
} from "../src/features/store/form-state.ts";
import {
  normalizeStoreSlug,
  validateStoreSlug,
} from "../src/features/store/schema.ts";

const projectRoot = path.resolve(import.meta.dirname, "..");

const values = {
  name: "Студия 01",
  slug: "studio-01",
  telegramUsername: "studio_01",
  description: "Небольшая студия.",
  additionalInfo: "Москва",
};

test("slug formatting is shared by client helpers and server validation", () => {
  assert.equal(normalizeStoreSlug("  Studio-01  "), "studio-01");
  assert.deepEqual(validateStoreSlug("  Studio-01  ", { allowEmpty: false }), {
    isValid: true,
    slug: "studio-01",
  });
  assert.equal(validateStoreSlug("   ", { allowEmpty: false }).isValid, false);
});

test("controlled store snapshots are serializable, isolated, and dirty-aware", () => {
  const snapshot = getStoreProfileSnapshot({
    values,
    avatarUrl: "https://example.test/avatar.jpg",
  });

  assert.deepEqual(JSON.parse(JSON.stringify(snapshot)), snapshot);
  assert.notEqual(snapshot.values, values);
  assert.equal(isStoreProfileDirty(snapshot, values), false);
  assert.equal(
    isStoreProfileDirty(snapshot, { ...values, name: "Другая студия" }),
    true,
  );
  assert.equal(isStoreProfileDirty(snapshot, values, true), true);

  const restored = getStoreProfileValuesFromSnapshot(snapshot);
  restored.name = "Локальное изменение";
  assert.equal(snapshot.values.name, "Студия 01");

  const snapshotWithoutAvatar = getStoreProfileSnapshot({ values });
  assert.deepEqual(
    JSON.parse(JSON.stringify(snapshotWithoutAvatar)),
    snapshotWithoutAvatar,
  );
});

test("slug availability action authenticates, handles the owned store, and exposes only a generic result", () => {
  const action = fs.readFileSync(
    path.join(projectRoot, "src/features/store/actions.ts"),
    "utf8",
  );

  const actionStart = action.indexOf(
    "export async function checkStoreSlugAvailability",
  );
  const saveStart = action.indexOf("export async function saveStoreProfile");
  const availabilityAction = action.slice(actionStart, saveStart);

  assert.ok(actionStart >= 0);
  assert.ok(saveStart > actionStart);
  assert.match(availabilityAction, /validateStoreSlug\(candidateValue, \{ allowEmpty: false \}\)/);
  assert.match(availabilityAction, /supabase\.auth\.getUser\(\)/);
  assert.match(availabilityAction, /\.from\("stores"\)/);
  assert.match(availabilityAction, /\.select\("slug"\)/);
  assert.match(availabilityAction, /\.eq\("seller_id", user\.id\)/);
  assert.match(availabilityAction, /currentStore\?\.slug === validation\.slug/);
  assert.match(availabilityAction, /rpc\(\s*"is_store_slug_available"/);
  assert.match(availabilityAction, /candidate_slug: validation\.slug/);
  assert.doesNotMatch(availabilityAction, /select\("\*"\)|service.role|service_role/);
  assert.doesNotMatch(
    availabilityAction,
    /owner|seller name|store name|foreign|друг(?:ой|ого) продав/i,
  );
});

test("save remains the final uniqueness boundary", () => {
  const action = fs.readFileSync(
    path.join(projectRoot, "src/features/store/actions.ts"),
    "utf8",
  );
  const saveAction = action.slice(
    action.indexOf("export async function saveStoreProfile"),
  );

  assert.match(saveAction, /rpc\("is_store_slug_available"/);
  assert.match(saveAction, /isUniqueViolation\(saveError\)/);
  assert.match(saveAction, /\.upsert\(/);
});

test("store settings UI is controlled, sectioned, previewable, and recoverable", () => {
  const form = fs.readFileSync(
    path.join(projectRoot, "src/features/store/store-profile-form.tsx"),
    "utf8",
  );
  const navigation = fs.readFileSync(
    path.join(projectRoot, "src/features/store/store-settings-nav.tsx"),
    "utf8",
  );
  const preview = fs.readFileSync(
    path.join(projectRoot, "src/features/store/store-live-preview.tsx"),
    "utf8",
  );
  const dirtyBar = fs.readFileSync(
    path.join(projectRoot, "src/features/store/store-dirty-bar.tsx"),
    "utf8",
  );
  const page = fs.readFileSync(
    path.join(
      projectRoot,
      "src/app/(seller)/seller/(admin)/store/page.tsx",
    ),
    "utf8",
  );

  for (const field of [
    "values.name",
    "values.slug",
    "values.telegramUsername",
    "values.description",
    "values.additionalInfo",
  ]) {
    assert.match(form, new RegExp(`value=\\{${field.replace(".", "\\.")}\\}`));
  }
  assert.doesNotMatch(form, /defaultValue=/);
  assert.match(form, /URL\.createObjectURL\(file\)/);
  assert.match(form, /formData\.set\("avatar", avatarFile\)/);
  assert.match(form, /getStoreProfileValuesFromSnapshot\(snapshot\)/);
  assert.match(form, /checkStoreSlugAvailability\(candidateSlug\)/);
  assert.match(form, /SLUG_CHECK_DELAY_MS = 450/);
  assert.match(form, /data-dialog-initial-focus/);
  assert.match(form, /addEventListener\("beforeunload"/);
  assert.match(form, /addEventListener\("popstate"/);
  assert.match(form, /document\.addEventListener\("click"/);
  assert.match(form, /Уйти без сохранения\?/);
  assert.match(form, /Отменить изменения и уйти/);
  assert.doesNotMatch(form, /window\.(?:alert|confirm|prompt)/);
  assert.match(form, /onClick=\{\(\) => setMobilePreviewOpen\(false\)\}/);
  assert.match(form, /будет возвращать 404/);
  assert.match(form, /xl:grid-cols-\[11rem_minmax\(0,1fr\)_minmax\(17rem,22rem\)\]/);
  assert.doesNotMatch(form, /<h1/);

  for (const section of ["profile", "public-link", "contact", "about"]) {
    assert.match(navigation, new RegExp(`id: "${section}"`));
    assert.match(form, new RegExp(`id="store-settings-${section}"`));
  }
  assert.match(navigation, /aria-current=\{active \? "location"/);
  assert.match(preview, /Не сохранено/);
  assert.match(preview, /StatusBadge/);
  assert.match(preview, /values: StoreProfileValues/);
  assert.match(dirtyBar, /if \(!dirty\) return null/);
  assert.match(dirtyBar, /data-store-dirty-bar/);
  assert.match(page, /<h1/);
  assert.doesNotMatch(page, /GlassPanel/);
});
