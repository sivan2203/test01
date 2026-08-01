"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createProductDraft, updateProduct } from "./actions";
import type { ProductDraftFormState } from "./form-state";
import type { ProductStatus } from "./schema";

type ProductFormProps = {
  initialState: ProductDraftFormState;
  productId?: string;
  productStatus?: ProductStatus;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm leading-6 text-foreground/75" role="alert">
      {message}
    </p>
  );
}

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

  return (
    <form action={submitProductDraft} className="flex flex-col gap-5" key={formKey}>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="product-title">
          Название товара
        </label>
        <input
          aria-describedby="product-title-help"
          className="min-h-11 rounded-xl border border-border bg-surface-raised px-4 text-base text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-ring"
          defaultValue={state.values.title}
          id="product-title"
          maxLength={120}
          name="title"
          required
          type="text"
        />
        <p className="text-sm leading-6 text-foreground/60" id="product-title-help">
          Короткое название, которое продавец увидит в списке товаров.
        </p>
        <FieldError message={state.fieldErrors.title} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Цена</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface-raised px-4 text-sm">
            <input
              checked={priceMode === "request"}
              name="priceMode"
              onChange={() => setPriceMode("request")}
              type="radio"
              value="request"
            />
            по запросу
          </label>
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface-raised px-4 text-sm">
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
          aria-label="Цена товара"
          className="min-h-11 rounded-xl border border-border bg-surface-raised px-4 text-base text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-ring disabled:opacity-50"
          defaultValue={state.values.priceAmount}
          disabled={priceMode === "request"}
          inputMode="decimal"
          name="priceAmount"
          placeholder="Например, 2500"
          type="text"
        />
        <p className="text-sm leading-6 text-foreground/60">
          Для черновика можно оставить цену как «по запросу».
        </p>
        <FieldError message={state.fieldErrors.priceMode} />
        <FieldError message={state.fieldErrors.priceAmount} />
      </fieldset>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="product-availability">
          Наличие
        </label>
        <select
          className="min-h-11 rounded-xl border border-border bg-surface-raised px-4 text-base text-foreground outline-none transition-colors focus:border-ring"
          defaultValue={state.values.availabilityStatus}
          id="product-availability"
          name="availabilityStatus"
        >
          <option value="in_stock">В наличии</option>
          <option value="out_of_stock">Нет в наличии</option>
        </select>
        <FieldError message={state.fieldErrors.availabilityStatus} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="product-description">
          Описание
        </label>
        <textarea
          aria-describedby="product-description-help"
          className="min-h-32 rounded-xl border border-border bg-surface-raised px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-foreground/40 focus:border-ring"
          defaultValue={state.values.description}
          id="product-description"
          maxLength={1000}
          name="description"
        />
        <p
          className="text-sm leading-6 text-foreground/60"
          id="product-description-help"
        >
          Необязательное описание. Фотографии и публикация появятся в следующих
          шагах.
        </p>
        <FieldError message={state.fieldErrors.description} />
      </div>

      {state.message ? (
        <p
          className="text-sm leading-6 text-foreground/75"
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <FieldError message={state.fieldErrors.media} />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button className="w-full" disabled={isPending} type="submit">
          {isPending
            ? "Сохраняем…"
            : productId && productStatus !== "draft"
              ? "Сохранить изменения"
              : "Сохранить черновик"}
        </Button>
        <Link
          className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
          href="/seller/products"
        >
          К списку товаров
        </Link>
      </div>
    </form>
  );
}
