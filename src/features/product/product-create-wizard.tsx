"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorSummary } from "@/components/ui/error-summary";
import { StatusMessage } from "@/components/ui/status-message";
import { cn } from "@/lib/utils";
import { publishProduct, saveProductWizardDraft } from "./actions";
import type { ProductWizardDraftFormState } from "./form-state";
import {
  getInitialProductLifecycleActionState,
  validateProductPublication,
} from "./lifecycle";
import { ProductFields, PRODUCT_WIZARD_FIELD_IDS } from "./product-fields";
import { ProductMediaManager } from "./product-media-manager";
import type { ProductMedia } from "./media-schema";
import { ProductReview } from "./product-review";
import type {
  ProductDraftFieldErrors,
  ProductDraftValues,
} from "./schema";
import {
  PRODUCT_WIZARD_STEP_ID_BASICS,
  PRODUCT_WIZARD_STEP_ID_PHOTOS,
  PRODUCT_WIZARD_STEP_ID_REVIEW,
  PRODUCT_WIZARD_STEP_ID_SALE,
  PRODUCT_WIZARD_STEP_IDS,
  createProductWizardState,
  productWizardReducer,
  projectProductWizardStepErrors,
  validateProductWizardStep,
  type ProductWizardAction,
  type ProductWizardStepId,
} from "./product-wizard-state";
import { ProductWizardStepper } from "./product-wizard-stepper";

type ProductCreateWizardProps = {
  initialDraftState: ProductWizardDraftFormState;
  initialMedia: ProductMedia[];
  initialMediaError?: string;
  initialStepId?: ProductWizardStepId;
};

const ERROR_FIELD_IDS: Record<keyof ProductDraftFieldErrors, string> = {
  title: PRODUCT_WIZARD_FIELD_IDS.title,
  description: PRODUCT_WIZARD_FIELD_IDS.description,
  priceMode: PRODUCT_WIZARD_FIELD_IDS.priceMode,
  priceAmount: PRODUCT_WIZARD_FIELD_IDS.priceAmount,
  availabilityStatus: PRODUCT_WIZARD_FIELD_IDS.availabilityStatus,
  media: "product-media-heading",
};

function isProductWizardStepId(value: string | null): value is ProductWizardStepId {
  return PRODUCT_WIZARD_STEP_IDS.includes(value as ProductWizardStepId);
}

function buildProductFormData(values: ProductDraftValues) {
  const formData = new FormData();
  formData.set("title", values.title);
  formData.set("description", values.description);
  formData.set("priceMode", values.priceMode);
  formData.set("priceAmount", values.priceAmount);
  formData.set("availabilityStatus", values.availabilityStatus);
  return formData;
}

function getFirstProductErrorStep(fieldErrors: ProductDraftFieldErrors) {
  if (fieldErrors.title || fieldErrors.description) {
    return PRODUCT_WIZARD_STEP_ID_BASICS;
  }
  if (
    fieldErrors.priceMode ||
    fieldErrors.priceAmount ||
    fieldErrors.availabilityStatus
  ) {
    return PRODUCT_WIZARD_STEP_ID_SALE;
  }
  if (fieldErrors.media) return PRODUCT_WIZARD_STEP_ID_PHOTOS;
  return null;
}

function updateWizardUrl(
  stepId: ProductWizardStepId,
  productId: string | null,
  mode: "push" | "replace",
) {
  const url = new URL(window.location.href);
  url.searchParams.set("step", stepId);
  if (productId) url.searchParams.set("draft", productId);
  else url.searchParams.delete("draft");
  const href = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") window.history.pushState(null, "", href);
  else window.history.replaceState(null, "", href);
}

export function ProductCreateWizard({
  initialDraftState,
  initialMedia,
  initialMediaError,
  initialStepId = PRODUCT_WIZARD_STEP_ID_BASICS,
}: ProductCreateWizardProps) {
  const router = useRouter();
  const [wizardState, dispatch] = useReducer(
    productWizardReducer,
    createProductWizardState(initialDraftState.values, {
      currentStepId: initialStepId,
      productId: initialDraftState.productId,
    }),
  );
  const wizardStateRef = useRef(wizardState);
  const mediaBusyRef = useRef(false);
  const previousStepIdRef = useRef(wizardState.currentStepId);
  const skipStepHeadingFocusRef = useRef(false);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const [draftState, setDraftState] = useState(initialDraftState);
  const [media, setMedia] = useState(initialMedia);
  const [mediaLoadError, setMediaLoadError] = useState(initialMediaError);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [errorFocusKey, setErrorFocusKey] = useState(0);
  const [publishState, setPublishState] = useState(
    getInitialProductLifecycleActionState("draft"),
  );
  const [draftPending, startDraftTransition] = useTransition();
  const [publishPending, startPublishTransition] = useTransition();
  const pending = draftPending || publishPending;

  function dispatchWizard(action: ProductWizardAction) {
    const nextState = productWizardReducer(wizardStateRef.current, action);
    wizardStateRef.current = nextState;
    dispatch(action);
    return nextState;
  }

  useEffect(() => {
    wizardStateRef.current = wizardState;
  }, [wizardState]);

  useEffect(() => {
    mediaBusyRef.current = mediaBusy;
  }, [mediaBusy]);

  useEffect(() => {
    if (previousStepIdRef.current === wizardState.currentStepId) return;
    previousStepIdRef.current = wizardState.currentStepId;
    if (skipStepHeadingFocusRef.current) {
      skipStepHeadingFocusRef.current = false;
      return;
    }
    const frame = requestAnimationFrame(() => {
      stepHeadingRef.current?.focus({ preventScroll: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [wizardState.currentStepId]);

  useEffect(() => {
    updateWizardUrl(initialStepId, initialDraftState.productId, "replace");

    function handlePopState() {
      const targetStepId = new URL(window.location.href).searchParams.get("step");
      if (!isProductWizardStepId(targetStepId)) return;

      const current = wizardStateRef.current;
      if (current.currentStepId === targetStepId) return;
      if (mediaBusyRef.current) {
        updateWizardUrl(current.currentStepId, current.productId, "push");
        setDraftState((state) => ({
          ...state,
          status: "idle",
          message: "Дождитесь завершения загрузки всех фотографий, прежде чем менять шаг.",
        }));
        return;
      }

      if (targetStepId === PRODUCT_WIZARD_STEP_ID_REVIEW) {
        const reviewValidation = validateProductWizardStep(
          PRODUCT_WIZARD_STEP_ID_REVIEW,
          current.values,
        );
        const errorStep = getFirstProductErrorStep(
          reviewValidation.fieldErrors,
        );
        if (!reviewValidation.isValid && errorStep) {
          skipStepHeadingFocusRef.current = true;
          dispatchWizard({ type: "edit-step", stepId: errorStep });
          updateWizardUrl(errorStep, current.productId, "replace");
          setDraftState((state) => ({
            ...state,
            status: "error",
            message:
              "Исправьте данные перед возвратом к финальной проверке.",
            values: current.values,
            fieldErrors: reviewValidation.fieldErrors,
          }));
          setErrorFocusKey((value) => value + 1);
          return;
        }
      }

      const previousStepId = current.history.at(-1);
      dispatchWizard(
        previousStepId === targetStepId
          ? { type: "back" }
          : { type: "edit-step", stepId: targetStepId },
      );

      if (current.productId) {
        updateWizardUrl(targetStepId, current.productId, "replace");
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [initialDraftState.productId, initialStepId]);

  const visibleErrors = projectProductWizardStepErrors(
    wizardState.currentStepId,
    draftState.fieldErrors,
  );
  const summaryErrors = Object.entries(visibleErrors).flatMap(
    ([field, message]) =>
      message
        ? [
            {
              id: ERROR_FIELD_IDS[field as keyof ProductDraftFieldErrors],
              message,
            },
          ]
        : [],
  );
  const publicationValidation = validateProductPublication(
    wizardState.values,
    media.length,
  );
  const canPublish =
    Boolean(wizardState.productId) &&
    !mediaBusy &&
    !mediaLoadError &&
    publicationValidation.isValid;
  const publicationReason =
    (mediaBusy ? "Дождитесь завершения загрузки всех фотографий." : undefined) ??
    mediaLoadError ??
    publicationValidation.fieldErrors.media ??
    publicationValidation.fieldErrors.title ??
    publicationValidation.fieldErrors.priceMode ??
    publicationValidation.fieldErrors.priceAmount ??
    publicationValidation.fieldErrors.availabilityStatus ??
    publicationValidation.fieldErrors.description;

  function changeValues(patch: Partial<ProductDraftValues>) {
    const nextValues = dispatchWizard({
      type: "update-values",
      values: patch,
    }).values;
    setDraftState((current) => {
      const fieldErrors = { ...current.fieldErrors };
      for (const field of Object.keys(patch) as Array<keyof ProductDraftValues>) {
        delete fieldErrors[field];
      }
      return {
        ...current,
        status: "idle",
        message: "",
        values: nextValues,
        fieldErrors,
      };
    });
  }

  function showValidationErrors(
    stepId: ProductWizardStepId,
    fieldErrors: ProductDraftFieldErrors,
    message = "Проверьте поля текущего шага.",
  ) {
    setDraftState((current) => ({
      ...current,
      status: "error",
      message,
      values: wizardStateRef.current.values,
      fieldErrors,
    }));
    setErrorFocusKey((current) => current + 1);

    if (wizardStateRef.current.currentStepId !== stepId) {
      skipStepHeadingFocusRef.current = true;
      dispatchWizard({ type: "edit-step", stepId });
      updateWizardUrl(stepId, wizardStateRef.current.productId, "push");
    }
  }

  function validateStep(stepId: ProductWizardStepId) {
    const validation = validateProductWizardStep(stepId, wizardState.values);
    if (validation.isValid) {
      setDraftState((current) => ({
        ...current,
        status: "idle",
        message: "",
        fieldErrors: {},
      }));
      return true;
    }
    showValidationErrors(stepId, validation.fieldErrors);
    return false;
  }

  function moveForward(stepId: ProductWizardStepId, productId: string | null) {
    dispatchWizard({ type: "continue" });
    updateWizardUrl(stepId, productId, "push");
  }

  function editStep(stepId: ProductWizardStepId) {
    if (mediaBusyRef.current) {
      setDraftState((current) => ({
        ...current,
        status: "idle",
        message: "Дождитесь завершения загрузки всех фотографий, прежде чем менять шаг.",
      }));
      return;
    }
    dispatchWizard({ type: "edit-step", stepId });
    updateWizardUrl(stepId, wizardState.productId, "push");
  }

  function goBack() {
    if (mediaBusyRef.current) {
      setDraftState((current) => ({
        ...current,
        status: "idle",
        message: "Дождитесь завершения загрузки всех фотографий, прежде чем менять шаг.",
      }));
      return;
    }
    const previousFromHistory = wizardState.history.at(-1);
    if (previousFromHistory) {
      window.history.back();
      return;
    }

    const currentIndex = PRODUCT_WIZARD_STEP_IDS.indexOf(
      wizardState.currentStepId,
    );
    const previousStepId = PRODUCT_WIZARD_STEP_IDS[currentIndex - 1];
    if (!previousStepId) return;
    dispatchWizard({ type: "back" });
    updateWizardUrl(previousStepId, wizardState.productId, "replace");
  }

  async function persistDraftSnapshot() {
    return saveProductWizardDraft(
      {
        ...draftState,
        values: wizardState.values,
        productId: wizardState.productId,
      },
      buildProductFormData(wizardState.values),
    );
  }

  function applyDraftResult(result: ProductWizardDraftFormState) {
    setDraftState(result);
    if (result.status === "success" && result.productId) {
      dispatchWizard({
        type: "draft-saved",
        productId: result.productId,
        values: result.values,
      });
      return true;
    }

    const errorStep = getFirstProductErrorStep(result.fieldErrors);
    if (errorStep) {
      showValidationErrors(errorStep, result.fieldErrors, result.message);
    }
    return false;
  }

  function saveDraft(intent: "continue" | "save") {
    startDraftTransition(async () => {
      try {
        const result = await persistDraftSnapshot();
        if (!applyDraftResult(result) || !result.productId) return;

        if (intent === "continue") {
          updateWizardUrl(
            PRODUCT_WIZARD_STEP_ID_SALE,
            result.productId,
            "replace",
          );
          moveForward(PRODUCT_WIZARD_STEP_ID_PHOTOS, result.productId);
        }
      } catch {
        setDraftState((current) => ({
          ...current,
          status: "error",
          message:
            "Сохранение временно недоступно. Данные остались в форме — попробуйте ещё раз.",
          values: wizardStateRef.current.values,
        }));
      }
    });
  }

  function continueBasics(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateStep(PRODUCT_WIZARD_STEP_ID_BASICS)) return;
    moveForward(PRODUCT_WIZARD_STEP_ID_SALE, wizardState.productId);
  }

  function continueSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateStep(PRODUCT_WIZARD_STEP_ID_SALE)) return;
    saveDraft("continue");
  }

  function continuePhotos() {
    if (!validateStep(PRODUCT_WIZARD_STEP_ID_PHOTOS)) return;
    moveForward(PRODUCT_WIZARD_STEP_ID_REVIEW, wizardState.productId);
  }

  function saveFromReview() {
    if (!validateStep(PRODUCT_WIZARD_STEP_ID_REVIEW)) return;
    saveDraft("save");
  }

  function publishFromReview() {
    if (!canPublish || !wizardState.productId) return;
    if (!validateStep(PRODUCT_WIZARD_STEP_ID_REVIEW)) return;

    startPublishTransition(async () => {
      try {
        const savedDraft = await persistDraftSnapshot();
        if (!applyDraftResult(savedDraft) || !savedDraft.productId) return;

        const result = await publishProduct(
          savedDraft.productId,
          publishState,
          new FormData(),
        );
        setPublishState(result);
        if (result.status === "success") {
          router.replace(`/seller/products/${savedDraft.productId}/edit`);
        }
      } catch {
        setPublishState((current) => ({
          ...current,
          status: "error",
          message:
            "Публикация временно недоступна. Черновик сохранён — попробуйте ещё раз.",
        }));
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <ProductWizardStepper currentStepId={wizardState.currentStepId} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 text-sm">
        <p className="text-ink-secondary">
          {wizardState.productId
            ? "Черновик создан — изменения можно восстановить после перезагрузки."
            : "Черновик будет создан после шага «Продажа»."}
        </p>
        {wizardState.productId ? (
          <span className="font-mono text-[0.6875rem] text-ink-secondary">
            ID {wizardState.productId.slice(0, 8)}
          </span>
        ) : null}
      </div>

      <ErrorSummary
        errors={summaryErrors}
        focusKey={errorFocusKey}
        title="Проверьте текущий шаг"
      />

      {wizardState.currentStepId === PRODUCT_WIZARD_STEP_ID_BASICS ? (
        <form className="flex flex-col gap-7" onSubmit={continueBasics}>
          <div>
            <p className="font-mono text-xs text-ink-secondary">01 / ОСНОВНОЕ</p>
            <h2
              className="mt-2 text-2xl font-semibold tracking-[-0.025em] outline-none"
              ref={stepHeadingRef}
              tabIndex={-1}
            >
              Что это за товар
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
              Название и описание формируют первый покупательский контекст.
            </p>
          </div>
          <ProductFields
            fieldErrors={visibleErrors}
            onChange={changeValues}
            stepId="basics"
            values={wizardState.values}
          />
          <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-between">
            <Link
              className={cn(buttonVariants({ variant: "ghost" }), "w-full sm:w-auto")}
              href="/seller/products"
            >
              Выйти к товарам
            </Link>
            <Button className="w-full sm:w-auto" disabled={pending} type="submit">
              Продолжить
            </Button>
          </div>
        </form>
      ) : null}

      {wizardState.currentStepId === PRODUCT_WIZARD_STEP_ID_SALE ? (
        <form className="flex flex-col gap-7" onSubmit={continueSale}>
          <div>
            <p className="font-mono text-xs text-ink-secondary">02 / ПРОДАЖА</p>
            <h2
              className="mt-2 text-2xl font-semibold tracking-[-0.025em] outline-none"
              ref={stepHeadingRef}
              tabIndex={-1}
            >
              Цена и наличие
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
              После этого шага мы безопасно создадим черновик для фотографий.
            </p>
          </div>
          <ProductFields
            fieldErrors={visibleErrors}
            onChange={changeValues}
            stepId="sale"
            values={wizardState.values}
          />
          <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-between">
            <Button className="w-full sm:w-auto" disabled={pending || mediaBusy} onClick={goBack} variant="ghost">
              Назад
            </Button>
            <Button className="w-full sm:w-auto" disabled={pending} type="submit">
              {draftPending ? "Сохраняем…" : "Сохранить и перейти к фото"}
            </Button>
          </div>
        </form>
      ) : null}

      {wizardState.productId ? (
        <div
          className={cn(
            "flex flex-col gap-7",
            wizardState.currentStepId !== PRODUCT_WIZARD_STEP_ID_PHOTOS &&
              "hidden",
          )}
        >
          <div>
            <p className="font-mono text-xs text-ink-secondary">03 / ФОТО</p>
            <h2
              className="mt-2 text-2xl font-semibold tracking-[-0.025em] outline-none"
              ref={
                wizardState.currentStepId === PRODUCT_WIZARD_STEP_ID_PHOTOS
                  ? stepHeadingRef
                  : undefined
              }
              tabIndex={-1}
            >
              Покажите товар
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
              Черновик можно оставить без фото. Для публикации понадобится хотя бы одно.
            </p>
          </div>
          <ProductMediaManager
            initialError={mediaLoadError}
            initialMedia={media}
            onMediaChange={(nextMedia) => {
              setMedia(nextMedia);
              setMediaLoadError(undefined);
            }}
            onBusyChange={(busy) => {
              mediaBusyRef.current = busy;
              setMediaBusy(busy);
            }}
            productId={wizardState.productId}
            productTitle={wizardState.values.title}
          />
          <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-between">
            <Button className="w-full sm:w-auto" disabled={pending} onClick={goBack} variant="ghost">
              Назад
            </Button>
            <Button className="w-full sm:w-auto" disabled={pending || mediaBusy} onClick={continuePhotos}>
              Перейти к проверке
            </Button>
          </div>
        </div>
      ) : null}

      {!wizardState.productId &&
      wizardState.currentStepId === PRODUCT_WIZARD_STEP_ID_PHOTOS ? (
        <StatusMessage error>
          Сначала сохраните шаг «Продажа», чтобы получить черновик для фотографий.
        </StatusMessage>
      ) : null}

      {wizardState.currentStepId === PRODUCT_WIZARD_STEP_ID_REVIEW ? (
        <div className="flex flex-col gap-6">
          <div>
            <p className="font-mono text-xs text-ink-secondary">04 / ПРОВЕРКА</p>
            <h2
              className="mt-2 text-2xl font-semibold tracking-[-0.025em] outline-none"
              ref={stepHeadingRef}
              tabIndex={-1}
            >
              Проверьте глазами покупателя
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
              Сохранение оставляет товар черновиком. Публикация — отдельное явное действие.
            </p>
          </div>

          <ProductReview
            media={media}
            onEdit={editStep}
            values={wizardState.values}
          />

          {!canPublish && publicationReason ? (
            <StatusMessage error={Boolean(mediaLoadError)}>
              {publicationReason}
            </StatusMessage>
          ) : null}
          {summaryErrors.length === 0 ? (
            <StatusMessage error={draftState.status === "error"}>
              {draftState.message}
            </StatusMessage>
          ) : null}
          <StatusMessage error={publishState.status === "error"}>
            {publishState.message}
          </StatusMessage>

          <div className="grid gap-2 border-t border-border pt-5 sm:grid-cols-[auto_1fr_auto]">
            <Button disabled={pending || mediaBusy} onClick={goBack} variant="ghost">
              Назад
            </Button>
            <Button disabled={pending || mediaBusy} onClick={saveFromReview} variant="secondary">
              {draftPending ? "Сохраняем…" : "Сохранить черновик"}
            </Button>
            <Button disabled={pending || mediaBusy || !canPublish} onClick={publishFromReview}>
              {publishPending ? "Публикуем…" : "Опубликовать товар"}
            </Button>
          </div>
        </div>
      ) : null}

      {wizardState.currentStepId !== PRODUCT_WIZARD_STEP_ID_REVIEW &&
      summaryErrors.length === 0 ? (
        <StatusMessage error={draftState.status === "error"}>
          {draftState.message}
        </StatusMessage>
      ) : null}
    </div>
  );
}
