"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  deleteProduct,
  hideProduct,
  publishProduct,
} from "./actions";
import {
  getInitialProductLifecycleActionState,
  getProductStatusLabel,
  PRODUCT_STATUS_DELETED,
  PRODUCT_STATUS_HIDDEN,
  PRODUCT_STATUS_PUBLISHED,
  type ProductStatus,
} from "./lifecycle";
import { useProductLifecycleStatus } from "./product-lifecycle-context";

type ProductStateControlProps = {
  productId: string;
  productStatus: ProductStatus;
  mediaCount: number;
  mediaLoadError?: boolean;
};

export function ProductStateControl({
  productId,
  productStatus,
  mediaCount,
  mediaLoadError = false,
}: ProductStateControlProps) {
  const [publishState, publishAction, publishPending] = useActionState(
    publishProduct.bind(null, productId),
    getInitialProductLifecycleActionState(productStatus),
  );
  const [hideState, hideAction, hidePending] = useActionState(
    hideProduct.bind(null, productId),
    getInitialProductLifecycleActionState(productStatus),
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteProduct.bind(null, productId),
    getInitialProductLifecycleActionState(productStatus),
  );
  const [lastAction, setLastAction] = useState<"publish" | "hide" | "delete" | null>(null);
  const {
    productStatus: contextStatus,
    setProductStatus,
  } = useProductLifecycleStatus(productStatus);

  const pending = publishPending || hidePending || deletePending;
  const actionState =
    lastAction === "publish"
      ? publishState
      : lastAction === "hide"
        ? hideState
        : lastAction === "delete"
          ? deleteState
          : [deleteState, hideState, publishState].find(
              (state) => state.status !== "idle",
            );
  const message = actionState?.message ?? "";
  const messageIsError = actionState?.status === "error";
  const displayedStatus = actionState?.productStatus ?? contextStatus;

  useEffect(() => {
    if (actionState && actionState.status !== "idle") {
      setProductStatus(actionState.productStatus);
    }
  }, [actionState, setProductStatus]);

  return (
    <section
      aria-labelledby="product-state-heading"
      className="flex flex-col gap-4"
    >
      <div>
        <p className="text-sm text-foreground/60">Состояние товара</p>
        <h2 id="product-state-heading" className="mt-1 text-xl font-semibold">
          {getProductStatusLabel(displayedStatus)}
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground/70">
          Сохранение полей не меняет состояние автоматически. Публикация,
          скрытие и удаление выполняются отдельным действием.
        </p>
      </div>

      {displayedStatus !== PRODUCT_STATUS_PUBLISHED ? (
        <p className="text-sm leading-6 text-foreground/70">
          {mediaLoadError
            ? "Не удалось проверить фотографии. Обновите страницу перед публикацией."
            : mediaCount === 0
              ? "Для публикации добавьте от 1 до 10 фотографий."
              : `Фотографии для публикации: ${mediaCount} из 10.`}
        </p>
      ) : null}

      {displayedStatus === PRODUCT_STATUS_PUBLISHED ? (
        <form action={hideAction} onSubmit={() => setLastAction("hide")}>
          <Button className="w-full" disabled={pending} type="submit" variant="secondary">
            {hidePending ? "Скрываем…" : "Скрыть от покупателей"}
          </Button>
        </form>
      ) : displayedStatus === PRODUCT_STATUS_HIDDEN || displayedStatus === "draft" ? (
        <form action={publishAction} onSubmit={() => setLastAction("publish")}>
          <Button className="w-full" disabled={pending} type="submit">
            {publishPending ? "Публикуем…" : "Опубликовать товар"}
          </Button>
        </form>
      ) : null}

      {displayedStatus !== PRODUCT_STATUS_DELETED ? (
        <form
          action={deleteAction}
          onSubmit={(event) => {
            setLastAction("delete");
            if (!window.confirm("Удалить товар? Он исчезнет из публичных поверхностей.")) {
              event.preventDefault();
            }
          }}
        >
          <input name="confirmDelete" type="hidden" value="yes" />
          <Button
            className="w-full"
            disabled={pending}
            type="submit"
            variant="ghost"
          >
            {deletePending ? "Удаляем…" : "Удалить товар"}
          </Button>
        </form>
      ) : null}

      <p
        aria-live="polite"
        className={message ? "text-sm leading-6 text-foreground/75" : "sr-only"}
        role={messageIsError ? "alert" : "status"}
      >
        {message || "Нет новых сообщений"}
      </p>
    </section>
  );
}
