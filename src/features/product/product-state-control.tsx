"use client";

import {
  useActionState,
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";

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
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
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

  function closeDeleteConfirmation() {
    setDeleteConfirmationOpen(false);
    requestAnimationFrame(() => {
      document.getElementById("delete-product-trigger")?.focus();
    });
  }

  function handleDeleteDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" || pending) return;
    event.preventDefault();
    closeDeleteConfirmation();
  }

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
        deleteConfirmationOpen ? (
          <div
            aria-describedby="delete-product-description"
            aria-labelledby="delete-product-title"
            aria-modal="false"
            className="rounded-xl border border-border bg-muted p-4"
            onKeyDown={handleDeleteDialogKeyDown}
            role="alertdialog"
          >
            <p className="font-medium" id="delete-product-title">
              Удалить товар?
            </p>
            <p
              className="mt-2 text-sm leading-6 text-foreground/70"
              id="delete-product-description"
            >
              Товар исчезнет из публичной витрины. Действие нельзя отменить.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                className="w-full"
                disabled={pending}
                onClick={closeDeleteConfirmation}
                variant="secondary"
              >
                Отмена
              </Button>
              <form action={deleteAction} onSubmit={() => setLastAction("delete")}>
                <input name="confirmDelete" type="hidden" value="yes" />
                <Button
                  aria-label="Подтвердить удаление товара"
                  autoFocus
                  className="w-full"
                  disabled={pending}
                  type="submit"
                >
                  {deletePending ? "Удаляем…" : "Удалить товар"}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <Button
            className="w-full"
            disabled={pending}
            id="delete-product-trigger"
            onClick={() => setDeleteConfirmationOpen(true)}
            variant="ghost"
          >
            Удалить товар
          </Button>
        )
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
