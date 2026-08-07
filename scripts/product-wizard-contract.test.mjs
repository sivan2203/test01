import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { getInitialProductWizardDraftFormState } from "../src/features/product/form-state.ts";
import { validateProductDraftValues } from "../src/features/product/schema.ts";
import {
  PRODUCT_WIZARD_STEP_ID_BASICS,
  PRODUCT_WIZARD_STEP_ID_PHOTOS,
  PRODUCT_WIZARD_STEP_ID_REVIEW,
  PRODUCT_WIZARD_STEP_ID_SALE,
  PRODUCT_WIZARD_STEP_IDS,
  PRODUCT_WIZARD_STEPS,
  createProductWizardState,
  productWizardReducer,
  projectProductWizardStepErrors,
  projectProductWizardStepValues,
  validateProductWizardStep,
} from "../src/features/product/product-wizard-state.ts";

const projectRoot = path.resolve(import.meta.dirname, "..");
const actionsSource = fs.readFileSync(
  path.join(projectRoot, "src/features/product/actions.ts"),
  "utf8",
);
const wizardSource = fs.readFileSync(
  path.join(projectRoot, "src/features/product/product-create-wizard.tsx"),
  "utf8",
);
const stepperSource = fs.readFileSync(
  path.join(projectRoot, "src/features/product/product-wizard-stepper.tsx"),
  "utf8",
);
const fieldsSource = fs.readFileSync(
  path.join(projectRoot, "src/features/product/product-fields.tsx"),
  "utf8",
);
const reviewSource = fs.readFileSync(
  path.join(projectRoot, "src/features/product/product-review.tsx"),
  "utf8",
);
const newProductPageSource = fs.readFileSync(
  path.join(
    projectRoot,
    "src/app/(seller)/seller/(admin)/products/new/page.tsx",
  ),
  "utf8",
);
const editProductPageSource = fs.readFileSync(
  path.join(
    projectRoot,
    "src/app/(seller)/seller/(admin)/products/[productId]/edit/page.tsx",
  ),
  "utf8",
);

function sourceBetween(startMarker, endMarker) {
  const start = actionsSource.indexOf(startMarker);
  const end = actionsSource.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `missing source marker: ${endMarker}`);
  return actionsSource.slice(start, end);
}

const validValues = {
  title: "Лампа 01",
  description: "Компактная настольная лампа.",
  priceMode: "fixed",
  priceAmount: "2500",
  availabilityStatus: "in_stock",
};

test("wizard exposes stable ordered IDs and Russian step labels", () => {
  assert.deepEqual(PRODUCT_WIZARD_STEP_IDS, [
    "basics",
    "sale",
    "photos",
    "review",
  ]);
  assert.deepEqual(
    PRODUCT_WIZARD_STEPS.map(({ id, label }) => ({ id, label })),
    [
      { id: "basics", label: "Основное" },
      { id: "sale", label: "Продажа" },
      { id: "photos", label: "Фото" },
      { id: "review", label: "Проверка" },
    ],
  );
});

test("step validation projects the canonical full validator", () => {
  const invalidValues = {
    ...validValues,
    title: "",
    priceAmount: "не число",
    availabilityStatus: "unknown",
  };

  const basics = validateProductWizardStep(
    PRODUCT_WIZARD_STEP_ID_BASICS,
    invalidValues,
  );
  assert.equal(basics.isValid, false);
  assert.ok(basics.fieldErrors.title);
  assert.equal(basics.fieldErrors.priceAmount, undefined);
  assert.equal(basics.fieldErrors.availabilityStatus, undefined);

  const sale = validateProductWizardStep(
    PRODUCT_WIZARD_STEP_ID_SALE,
    invalidValues,
  );
  assert.equal(sale.isValid, false);
  assert.equal(sale.fieldErrors.title, undefined);
  assert.ok(sale.fieldErrors.priceAmount);
  assert.ok(sale.fieldErrors.availabilityStatus);

  const photos = validateProductWizardStep(
    PRODUCT_WIZARD_STEP_ID_PHOTOS,
    invalidValues,
  );
  assert.equal(photos.isValid, true);
  assert.deepEqual(photos.fieldErrors, {});
  assert.equal(validateProductDraftValues(invalidValues).isValid, false);

  const review = validateProductWizardStep(
    PRODUCT_WIZARD_STEP_ID_REVIEW,
    invalidValues,
  );
  assert.equal(review.isValid, false);
  assert.ok(review.fieldErrors.title);
  assert.ok(review.fieldErrors.priceAmount);
  assert.ok(review.fieldErrors.availabilityStatus);

  assert.deepEqual(
    projectProductWizardStepValues(PRODUCT_WIZARD_STEP_ID_BASICS, validValues),
    {
      title: validValues.title,
      description: validValues.description,
    },
  );
  assert.deepEqual(
    projectProductWizardStepErrors(PRODUCT_WIZARD_STEP_ID_PHOTOS, {
      title: "Введите название.",
      media: "Добавьте фотографию.",
    }),
    { media: "Добавьте фотографию." },
  );
});

test("wizard history preserves values and blocks Photos until draft exists", () => {
  let state = createProductWizardState(validValues);
  state = productWizardReducer(state, {
    type: "update-values",
    values: { title: "Лампа 02" },
  });
  assert.equal(state.isDirty, true);

  state = productWizardReducer(state, { type: "continue" });
  assert.equal(state.currentStepId, PRODUCT_WIZARD_STEP_ID_SALE);
  assert.equal(state.values.title, "Лампа 02");

  const withoutDraft = productWizardReducer(state, { type: "continue" });
  assert.equal(withoutDraft.currentStepId, PRODUCT_WIZARD_STEP_ID_SALE);
  assert.equal(withoutDraft.productId, null);
  assert.equal(
    productWizardReducer(state, {
      type: "edit-step",
      stepId: PRODUCT_WIZARD_STEP_ID_PHOTOS,
    }).currentStepId,
    PRODUCT_WIZARD_STEP_ID_SALE,
  );

  state = productWizardReducer(state, {
    type: "draft-saved",
    productId: "8c604585-6d5b-48fc-b1bd-290acda2090f",
    values: state.values,
  });
  state = productWizardReducer(state, { type: "continue" });
  assert.equal(state.currentStepId, PRODUCT_WIZARD_STEP_ID_PHOTOS);
  state = productWizardReducer(state, { type: "continue" });
  assert.equal(state.currentStepId, PRODUCT_WIZARD_STEP_ID_REVIEW);

  state = productWizardReducer(state, {
    type: "edit-step",
    stepId: PRODUCT_WIZARD_STEP_ID_BASICS,
  });
  assert.equal(state.currentStepId, PRODUCT_WIZARD_STEP_ID_BASICS);
  assert.equal(state.values.title, "Лампа 02");

  state = productWizardReducer(state, { type: "back" });
  assert.equal(state.currentStepId, PRODUCT_WIZARD_STEP_ID_REVIEW);
  assert.equal(state.values.title, "Лампа 02");
});

test("wizard action fully validates, returns productId, and never publishes", () => {
  const wizardAction = sourceBetween(
    "export async function saveProductWizardDraft",
    "export async function updateProduct",
  );
  const legacyCreateAction = sourceBetween(
    "export async function createProductDraft",
    "export async function saveProductWizardDraft",
  );

  assert.match(wizardAction, /validateProductDraftValues\(values\)/);
  assert.ok(
    wizardAction.indexOf("validateProductDraftValues(values)") <
      wizardAction.indexOf("getOrCreateProductWizardDraft"),
  );
  assert.match(wizardAction, /previousState\.productId/);
  assert.match(wizardAction, /updateOwnedProductWizardDraft/);
  assert.match(wizardAction, /productId,/);
  assert.doesNotMatch(wizardAction, /redirect\(/);
  assert.doesNotMatch(wizardAction, /transitionProduct|PRODUCT_STATUS_PUBLISHED/);

  assert.match(actionsSource, /status: PRODUCT_STATUS_DRAFT/);
  assert.match(actionsSource, /PRODUCT_WIZARD_DRAFT_REQUEST_TTL_MS/);
  assert.match(actionsSource, /productWizardDraftRequests/);
  assert.match(actionsSource, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(actionsSource, /insertProductDraft\(context, validation, productId\)/);
  assert.match(actionsSource, /durableReused/);
  assert.match(
    actionsSource,
    /\.eq\("status", PRODUCT_STATUS_DRAFT\)/,
  );

  assert.match(legacyCreateAction, /redirect\(`/);
  assert.match(actionsSource, /export async function publishProduct/);
});

test("wizard form state carries a stable request ID and an existing draft ID", () => {
  const emptyState = getInitialProductWizardDraftFormState(
    null,
    "wizard-request-123456",
  );
  assert.equal(emptyState.productId, null);
  assert.equal(emptyState.draftRequestId, "wizard-request-123456");
  assert.equal(emptyState.values.priceMode, "request");

  const existingState = getInitialProductWizardDraftFormState(
    {
      id: "8c604585-6d5b-48fc-b1bd-290acda2090f",
      storeId: "5d196e52-81dc-49e8-97c7-f33644e49e18",
      title: "Сохранённая лампа",
      description: "Описание",
      priceMode: "request",
      priceAmount: null,
      priceLabel: "по запросу",
      availabilityStatus: "in_stock",
      status: "draft",
      createdAt: "2026-08-07T00:00:00.000Z",
      updatedAt: "2026-08-07T00:00:00.000Z",
    },
    "wizard-request-654321",
  );
  assert.equal(
    existingState.productId,
    "8c604585-6d5b-48fc-b1bd-290acda2090f",
  );
  assert.equal(existingState.values.title, "Сохранённая лампа");
});

test("create route restores only an owned draft and keeps the regular editor separate", () => {
  assert.match(newProductPageSource, /searchParams: Promise/);
  assert.match(newProductPageSource, /resolvedSearchParams\.draft/);
  assert.match(newProductPageSource, /getSellerProductById\(requestedDraftId\)/);
  assert.match(newProductPageSource, /product\.status !== PRODUCT_STATUS_DRAFT/);
  assert.match(newProductPageSource, /getSellerProductMedia\(initialProduct\.id\)/);
  assert.match(newProductPageSource, /getInitialProductWizardDraftFormState/);
  assert.match(newProductPageSource, /<ProductCreateWizard/);
  assert.doesNotMatch(newProductPageSource, /GlassPanel|<main/);

  assert.match(editProductPageSource, /<ProductForm/);
  assert.doesNotMatch(editProductPageSource, /ProductCreateWizard/);
});

test("wizard UI has four informational steps, controlled fields, and recoverable history", () => {
  assert.match(stepperSource, /Шаг \{currentIndex \+ 1\} из/);
  assert.match(stepperSource, /aria-current=\{current \? "step"/);
  assert.match(stepperSource, /aria-live="polite"/);
  assert.match(stepperSource, /aria-atomic="true"/);
  assert.doesNotMatch(stepperSource, /<button|<a |<Link/);

  assert.match(fieldsSource, /value=\{values\.title\}/);
  assert.match(fieldsSource, /onChange=\{\(event\) => onChange/);
  assert.match(fieldsSource, /aria-invalid/);
  assert.match(fieldsSource, /aria-required="true"/);
  assert.match(fieldsSource, /aria-required=\{values\.priceMode === "fixed"\}/);
  assert.match(fieldsSource, /getFieldDescriptionId/);

  assert.match(wizardSource, /window\.history\.pushState/);
  assert.match(wizardSource, /window\.history\.replaceState/);
  assert.match(wizardSource, /addEventListener\("popstate"/);
  assert.match(wizardSource, /mediaBusyRef\.current/);
  assert.match(wizardSource, /function dispatchWizard\(action: ProductWizardAction\)/);
  assert.match(wizardSource, /productWizardReducer\(wizardStateRef\.current, action\)/);
  assert.match(wizardSource, /mediaBusyRef\.current = busy/);
  assert.match(wizardSource, /updateWizardUrl\(current\.currentStepId, current\.productId, "push"\)/);
  assert.match(
    wizardSource,
    /targetStepId === PRODUCT_WIZARD_STEP_ID_REVIEW[\s\S]*validateProductWizardStep[\s\S]*updateWizardUrl\(errorStep, current\.productId, "replace"\)/,
  );
  assert.match(wizardSource, /stepHeadingRef\.current\?\.focus/);
  assert.match(wizardSource, /skipStepHeadingFocusRef\.current = true/);
  assert.match(wizardSource, /PRODUCT_WIZARD_STEP_ID_PHOTOS/);
  assert.match(wizardSource, /PRODUCT_WIZARD_STEP_ID_REVIEW/);
  assert.match(wizardSource, /<ErrorSummary/);
});

test("wizard composes media snapshots, review edits, draft save, and explicit publish", () => {
  assert.match(wizardSource, /<ProductMediaManager/);
  assert.match(wizardSource, /onMediaChange=/);
  assert.match(
    wizardSource,
    /currentStepId !== PRODUCT_WIZARD_STEP_ID_PHOTOS[\s\S]*"hidden"/,
  );
  assert.match(wizardSource, /<ProductReview/);
  assert.match(wizardSource, /saveProductWizardDraft/);
  assert.match(wizardSource, /publishProduct/);
  assert.match(
    wizardSource,
    /onBusyChange=\{\(busy\) => \{[\s\S]*mediaBusyRef\.current = busy[\s\S]*setMediaBusy\(busy\)/,
  );
  assert.match(wizardSource, /!mediaBusy[\s\S]*publicationValidation\.isValid/);
  assert.match(
    wizardSource,
    /disabled=\{pending \|\| mediaBusy \|\| !canPublish\}/,
  );
  assert.match(wizardSource, /Сохранить черновик/);
  assert.match(wizardSource, /Опубликовать товар/);
  assert.ok(
    wizardSource.indexOf("await persistDraftSnapshot()") <
      wizardSource.indexOf("await publishProduct("),
  );

  assert.match(reviewSource, /onEdit\("basics"\)/);
  assert.match(reviewSource, /onEdit\("sale"\)/);
  assert.match(reviewSource, /onEdit\("photos"\)/);
  assert.match(reviewSource, /media\.map/);
});
