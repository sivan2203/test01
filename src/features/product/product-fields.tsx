"use client";

import { Field, fieldControlClassName, getFieldDescriptionId } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type {
  ProductDraftFieldErrors,
  ProductDraftValues,
} from "./schema";
import type { ProductWizardStepId } from "./product-wizard-state";

export const PRODUCT_WIZARD_FIELD_IDS = {
  title: "product-wizard-title",
  description: "product-wizard-description",
  priceMode: "product-wizard-price-mode",
  priceAmount: "product-wizard-price-amount",
  availabilityStatus: "product-wizard-availability",
} as const;

type ProductFieldsProps = {
  stepId: Extract<ProductWizardStepId, "basics" | "sale">;
  values: ProductDraftValues;
  fieldErrors: ProductDraftFieldErrors;
  onChange: (values: Partial<ProductDraftValues>) => void;
};

export function ProductFields({
  stepId,
  values,
  fieldErrors,
  onChange,
}: ProductFieldsProps) {
  if (stepId === "basics") {
    const titleId = PRODUCT_WIZARD_FIELD_IDS.title;
    const descriptionId = PRODUCT_WIZARD_FIELD_IDS.description;

    return (
      <div className="flex flex-col gap-6">
        <Field
          error={fieldErrors.title}
          helper="Короткое название, которое покупатель сразу свяжет с товаром."
          htmlFor={titleId}
          label="Название товара"
        >
          <input
            aria-describedby={getFieldDescriptionId(titleId, fieldErrors.title)}
            aria-invalid={Boolean(fieldErrors.title)}
            aria-required="true"
            autoComplete="off"
            className={fieldControlClassName}
            id={titleId}
            maxLength={120}
            name="title"
            onChange={(event) => onChange({ title: event.target.value })}
            type="text"
            value={values.title}
          />
        </Field>

        <Field
          error={fieldErrors.description}
          helper="До 1000 символов. Опишите назначение, состояние или важные детали."
          htmlFor={descriptionId}
          label="Описание"
          optional
        >
          <textarea
            aria-describedby={getFieldDescriptionId(
              descriptionId,
              fieldErrors.description,
            )}
            aria-invalid={Boolean(fieldErrors.description)}
            className={cn(fieldControlClassName, "min-h-36 resize-y py-3")}
            id={descriptionId}
            maxLength={1000}
            name="description"
            onChange={(event) => onChange({ description: event.target.value })}
            value={values.description}
          />
        </Field>
      </div>
    );
  }

  const priceModeId = PRODUCT_WIZARD_FIELD_IDS.priceMode;
  const priceAmountId = PRODUCT_WIZARD_FIELD_IDS.priceAmount;
  const availabilityId = PRODUCT_WIZARD_FIELD_IDS.availabilityStatus;
  const priceModeDescriptionId = fieldErrors.priceMode
    ? `${priceModeId}-error`
    : `${priceModeId}-help`;

  return (
    <div className="flex flex-col gap-6">
      <fieldset
        aria-describedby={priceModeDescriptionId}
        aria-invalid={Boolean(fieldErrors.priceMode)}
        className="flex flex-col gap-2"
      >
        <legend className="text-sm font-semibold">Формат цены</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex min-h-11 items-center gap-3 rounded-md border border-border-strong bg-surface-raised px-3.5 text-sm font-medium">
            <input
              checked={values.priceMode === "request"}
              id={priceModeId}
              name="priceMode"
              onChange={() => onChange({ priceMode: "request", priceAmount: "" })}
              type="radio"
              value="request"
            />
            По запросу
          </label>
          <label className="flex min-h-11 items-center gap-3 rounded-md border border-border-strong bg-surface-raised px-3.5 text-sm font-medium">
            <input
              checked={values.priceMode === "fixed"}
              id={`${priceModeId}-fixed`}
              name="priceMode"
              onChange={() => onChange({ priceMode: "fixed" })}
              type="radio"
              value="fixed"
            />
            Фиксированная цена
          </label>
        </div>
        {fieldErrors.priceMode ? (
          <p className="text-sm leading-5 text-destructive" id={`${priceModeId}-error`} role="alert">
            {fieldErrors.priceMode}
          </p>
        ) : (
          <p className="text-sm leading-5 text-ink-secondary" id={`${priceModeId}-help`}>
            «По запросу» подходит, если сумма зависит от варианта или комплектации.
          </p>
        )}
      </fieldset>

      <Field
        error={fieldErrors.priceAmount}
        helper={
          values.priceMode === "request"
            ? "Цена не будет показана числом."
            : "Введите сумму в рублях, максимум два знака после запятой."
        }
        htmlFor={priceAmountId}
        label="Цена, ₽"
        optional={values.priceMode === "request"}
      >
        <input
          aria-describedby={getFieldDescriptionId(
            priceAmountId,
            fieldErrors.priceAmount,
          )}
          aria-invalid={Boolean(fieldErrors.priceAmount)}
          aria-required={values.priceMode === "fixed"}
          className={fieldControlClassName}
          disabled={values.priceMode === "request"}
          id={priceAmountId}
          inputMode="decimal"
          name="priceAmount"
          onChange={(event) => onChange({ priceAmount: event.target.value })}
          placeholder="Например, 2500"
          type="text"
          value={values.priceAmount}
        />
      </Field>

      <Field
        error={fieldErrors.availabilityStatus}
        helper="Статус можно изменить позже в редакторе товара."
        htmlFor={availabilityId}
        label="Наличие"
      >
        <select
          aria-describedby={getFieldDescriptionId(
            availabilityId,
            fieldErrors.availabilityStatus,
          )}
          aria-invalid={Boolean(fieldErrors.availabilityStatus)}
          className={fieldControlClassName}
          id={availabilityId}
          name="availabilityStatus"
          onChange={(event) =>
            onChange({
              availabilityStatus: event.target.value as ProductDraftValues["availabilityStatus"],
            })
          }
          value={values.availabilityStatus}
        >
          <option value="in_stock">В наличии</option>
          <option value="out_of_stock">Нет в наличии</option>
        </select>
      </Field>
    </div>
  );
}
