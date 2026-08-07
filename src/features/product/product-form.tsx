"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorSummary } from "@/components/ui/error-summary";
import {
  Field,
  fieldControlClassName,
  getFieldDescriptionId,
} from "@/components/ui/field";
import { StatusMessage } from "@/components/ui/status-message";
import { cn } from "@/lib/utils";
import { createProductDraft, updateProduct } from "./actions";
import type { ProductDraftFormState } from "./form-state";
import type { ProductStatus } from "./schema";

type ProductFormProps = {
  initialState: ProductDraftFormState;
  productId?: string;
  productStatus?: ProductStatus;
};

export function ProductForm({
  initialState,
  productId,
  productStatus = "draft",
}: ProductFormProps) {
  const productDraftAction = productId
    ? updateProduct.bind(null, productId)
    : createProductDraft;
  const [state, submitProductDraft, isPending] = useActionState(
    productDraftAction,
    initialState,
  );
  const [priceMode, setPriceMode] = useState(state.values.priceMode);
  const formKey = `${state.status}:${state.message}:${JSON.stringify(state.values)}`;
  const errors = [
    ["product-title", state.fieldErrors.title],
    ["product-price", state.fieldErrors.priceMode ?? state.fieldErrors.priceAmount],
    ["product-availability", state.fieldErrors.availabilityStatus],
    ["product-description", state.fieldErrors.description],
    ["product-media-heading", state.fieldErrors.media],
  ]
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([id, message]) => ({ id, message }));

  return (
    <form action={submitProductDraft} className="flex flex-col gap-6" key={formKey}>
      <ErrorSummary errors={errors} focusKey={state.status === "error" ? formKey : undefined} />

      <Field
        error={state.fieldErrors.title}
        helper="Короткое название для каталога и карточки товара."
        htmlFor="product-title"
        label="Название товара"
      >
        <input
          aria-describedby={getFieldDescriptionId("product-title", state.fieldErrors.title)}
          aria-invalid={Boolean(state.fieldErrors.title)}
          className={fieldControlClassName}
          defaultValue={state.values.title}
          id="product-title"
          maxLength={120}
          name="title"
          required
          type="text"
        />
      </Field>

      <fieldset
        aria-describedby={
          state.fieldErrors.priceMode || state.fieldErrors.priceAmount
            ? "product-price-help product-price-error"
            : "product-price-help"
        }
        aria-invalid={Boolean(
          state.fieldErrors.priceMode || state.fieldErrors.priceAmount,
        )}
        className="flex flex-col gap-3"
        id="product-price"
      >
        <legend className="text-sm font-semibold">Цена</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex min-h-11 items-center gap-3 rounded-md border border-border-strong bg-surface-raised px-4 text-sm hover:bg-surface-muted">
            <input
              checked={priceMode === "request"}
              name="priceMode"
              onChange={() => setPriceMode("request")}
              type="radio"
              value="request"
            />
            по запросу
          </label>
          <label className="flex min-h-11 items-center gap-3 rounded-md border border-border-strong bg-surface-raised px-4 text-sm hover:bg-surface-muted">
            <input
              checked={priceMode === "fixed"}
              name="priceMode"
              onChange={() => setPriceMode("fixed")}
              type="radio"
              value="fixed"
            />
            указать цену
          </label>
        </div>
        <input
          aria-describedby={
            state.fieldErrors.priceMode || state.fieldErrors.priceAmount
              ? "product-price-help product-price-error"
              : "product-price-help"
          }
          aria-invalid={Boolean(state.fieldErrors.priceMode ?? state.fieldErrors.priceAmount)}
          aria-label="Цена товара"
          className={fieldControlClassName}
          defaultValue={state.values.priceAmount}
          disabled={priceMode === "request"}
          inputMode="decimal"
          name="priceAmount"
          placeholder="Например, 2500"
          type="text"
        />
        <p className="text-sm leading-5 text-ink-secondary" id="product-price-help">
          Для черновика можно оставить цену как «по запросу».
        </p>
        {state.fieldErrors.priceMode || state.fieldErrors.priceAmount ? (
          <p className="text-sm text-destructive" id="product-price-error" role="alert">
            {state.fieldErrors.priceMode ?? state.fieldErrors.priceAmount}
          </p>
        ) : null}
      </fieldset>

      <Field
        error={state.fieldErrors.availabilityStatus}
        htmlFor="product-availability"
        label="Наличие"
      >
        <select
          aria-describedby={state.fieldErrors.availabilityStatus ? "product-availability-error" : undefined}
          aria-invalid={Boolean(state.fieldErrors.availabilityStatus)}
          className={fieldControlClassName}
          defaultValue={state.values.availabilityStatus}
          id="product-availability"
          name="availabilityStatus"
        >
          <option value="in_stock">В наличии</option>
          <option value="out_of_stock">Нет в наличии</option>
        </select>
      </Field>

      <Field
        error={state.fieldErrors.description}
        helper="До 1000 символов. Добавьте особенности, материалы или условия заказа."
        htmlFor="product-description"
        label="Описание"
        optional
      >
        <textarea
          aria-describedby={getFieldDescriptionId("product-description", state.fieldErrors.description)}
          aria-invalid={Boolean(state.fieldErrors.description)}
          className={cn(fieldControlClassName, "min-h-32 py-3")}
          defaultValue={state.values.description}
          id="product-description"
          maxLength={1000}
          name="description"
        />
      </Field>

      <StatusMessage error={state.status === "error"}>{state.message}</StatusMessage>
      {state.fieldErrors.media ? (
        <p className="text-sm text-destructive" id="product-media" role="alert">
          {state.fieldErrors.media}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Link
          className={cn(buttonVariants({ variant: "secondary" }), "w-full sm:w-auto")}
          href="/seller/products"
        >
          К списку товаров
        </Link>
        <Button className="w-full sm:w-auto" disabled={isPending} type="submit">
          {isPending
            ? "Сохраняем…"
            : productId && productStatus !== "draft"
              ? "Сохранить изменения"
              : "Сохранить черновик"}
        </Button>
      </div>
    </form>
  );
}
