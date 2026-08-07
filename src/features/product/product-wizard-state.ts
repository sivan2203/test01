import {
  type ProductDraftFieldErrors,
  type ProductDraftValidationResult,
  type ProductDraftValues,
  validateProductDraftValues,
} from "./schema.ts";

export const PRODUCT_WIZARD_STEP_ID_BASICS = "basics";
export const PRODUCT_WIZARD_STEP_ID_SALE = "sale";
export const PRODUCT_WIZARD_STEP_ID_PHOTOS = "photos";
export const PRODUCT_WIZARD_STEP_ID_REVIEW = "review";

export const PRODUCT_WIZARD_STEP_IDS = [
  PRODUCT_WIZARD_STEP_ID_BASICS,
  PRODUCT_WIZARD_STEP_ID_SALE,
  PRODUCT_WIZARD_STEP_ID_PHOTOS,
  PRODUCT_WIZARD_STEP_ID_REVIEW,
] as const;

export type ProductWizardStepId = (typeof PRODUCT_WIZARD_STEP_IDS)[number];

export const PRODUCT_WIZARD_STEPS = [
  { id: PRODUCT_WIZARD_STEP_ID_BASICS, label: "Основное" },
  { id: PRODUCT_WIZARD_STEP_ID_SALE, label: "Продажа" },
  { id: PRODUCT_WIZARD_STEP_ID_PHOTOS, label: "Фото" },
  { id: PRODUCT_WIZARD_STEP_ID_REVIEW, label: "Проверка" },
] as const satisfies ReadonlyArray<{
  id: ProductWizardStepId;
  label: string;
}>;

type ProductDraftValueField = keyof ProductDraftValues;
type ProductDraftErrorField = keyof ProductDraftFieldErrors;

const PRODUCT_WIZARD_STEP_VALUE_FIELDS = {
  basics: ["title", "description"],
  sale: ["priceMode", "priceAmount", "availabilityStatus"],
  photos: [],
  review: [
    "title",
    "description",
    "priceMode",
    "priceAmount",
    "availabilityStatus",
  ],
} as const satisfies Record<
  ProductWizardStepId,
  ReadonlyArray<ProductDraftValueField>
>;

const PRODUCT_WIZARD_STEP_ERROR_FIELDS = {
  basics: ["title", "description"],
  sale: ["priceMode", "priceAmount", "availabilityStatus"],
  photos: ["media"],
  review: [
    "title",
    "description",
    "priceMode",
    "priceAmount",
    "availabilityStatus",
    "media",
  ],
} as const satisfies Record<
  ProductWizardStepId,
  ReadonlyArray<ProductDraftErrorField>
>;

export function projectProductWizardStepValues(
  stepId: ProductWizardStepId,
  values: ProductDraftValues,
): Partial<ProductDraftValues> {
  return Object.fromEntries(
    PRODUCT_WIZARD_STEP_VALUE_FIELDS[stepId].map((field) => [
      field,
      values[field],
    ]),
  ) as Partial<ProductDraftValues>;
}

export function projectProductWizardStepErrors(
  stepId: ProductWizardStepId,
  fieldErrors: ProductDraftFieldErrors,
): ProductDraftFieldErrors {
  return Object.fromEntries(
    PRODUCT_WIZARD_STEP_ERROR_FIELDS[stepId]
      .filter((field) => fieldErrors[field] !== undefined)
      .map((field) => [field, fieldErrors[field]]),
  ) as ProductDraftFieldErrors;
}

/**
 * Runs the canonical full draft validator and only projects errors owned by the
 * current step. The persistence action must still use validateProductDraftValues
 * directly before writing a draft.
 */
export function validateProductWizardStep(
  stepId: ProductWizardStepId,
  values: ProductDraftValues,
): ProductDraftValidationResult {
  const fullValidation = validateProductDraftValues(values);
  const fieldErrors = projectProductWizardStepErrors(
    stepId,
    fullValidation.fieldErrors,
  );

  return {
    ...fullValidation,
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
}

export type ProductWizardState = {
  currentStepId: ProductWizardStepId;
  history: ProductWizardStepId[];
  values: ProductDraftValues;
  productId: string | null;
  isDirty: boolean;
};

export type ProductWizardAction =
  | { type: "update-values"; values: Partial<ProductDraftValues> }
  | {
      type: "draft-saved";
      productId: string;
      values: ProductDraftValues;
    }
  | { type: "continue" }
  | { type: "back" }
  | { type: "edit-step"; stepId: ProductWizardStepId };

type ProductWizardInitialOptions = {
  currentStepId?: ProductWizardStepId;
  history?: ProductWizardStepId[];
  productId?: string | null;
};

export function createProductWizardState(
  values: ProductDraftValues,
  options: ProductWizardInitialOptions = {},
): ProductWizardState {
  return {
    currentStepId: options.currentStepId ?? PRODUCT_WIZARD_STEP_ID_BASICS,
    history: options.history ? [...options.history] : [],
    values: { ...values },
    productId: options.productId ?? null,
    isDirty: false,
  };
}

function getProductWizardStepIndex(stepId: ProductWizardStepId) {
  return PRODUCT_WIZARD_STEP_IDS.indexOf(stepId);
}

export function productWizardReducer(
  state: ProductWizardState,
  action: ProductWizardAction,
): ProductWizardState {
  if (action.type === "update-values") {
    return {
      ...state,
      values: { ...state.values, ...action.values },
      isDirty: true,
    };
  }

  if (action.type === "draft-saved") {
    return {
      ...state,
      productId: action.productId,
      values: { ...action.values },
      isDirty: false,
    };
  }

  if (action.type === "edit-step") {
    if (action.stepId === state.currentStepId) return state;
    if (
      !state.productId &&
      (action.stepId === PRODUCT_WIZARD_STEP_ID_PHOTOS ||
        action.stepId === PRODUCT_WIZARD_STEP_ID_REVIEW)
    ) {
      return state;
    }
    return {
      ...state,
      currentStepId: action.stepId,
      history: [...state.history, state.currentStepId],
    };
  }

  if (action.type === "back") {
    const previousFromHistory = state.history.at(-1);
    if (previousFromHistory) {
      return {
        ...state,
        currentStepId: previousFromHistory,
        history: state.history.slice(0, -1),
      };
    }

    const currentIndex = getProductWizardStepIndex(state.currentStepId);
    if (currentIndex <= 0) return state;
    return {
      ...state,
      currentStepId: PRODUCT_WIZARD_STEP_IDS[currentIndex - 1],
    };
  }

  const currentIndex = getProductWizardStepIndex(state.currentStepId);
  const nextStepId = PRODUCT_WIZARD_STEP_IDS[currentIndex + 1];
  if (!nextStepId) return state;

  // A persisted draft is a hard precondition for media paths and records.
  if (nextStepId === PRODUCT_WIZARD_STEP_ID_PHOTOS && !state.productId) {
    return state;
  }

  return {
    ...state,
    currentStepId: nextStepId,
    history: [...state.history, state.currentStepId],
  };
}
