"use client";

import { useCallback, useRef, useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusMessage } from "@/components/ui/status-message";
import { deleteProduct, hideProduct, publishProduct } from "./actions";
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

type ConfirmationKind = "hide" | "delete";

export function ProductStateControl({
  productId,
  productStatus,
  mediaCount,
  mediaLoadError = false,
}: ProductStateControlProps) {
  const initialState = getInitialProductLifecycleActionState(productStatus);
  const [actionState, setActionState] = useState(initialState);
  const actionStateRef = useRef(actionState);
  const confirmationDialogOpenRef = useRef(false);
  const [pending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState<ConfirmationKind | null>(null);
  const [lastAction, setLastAction] = useState<
    "publish" | "hide" | "delete" | null
  >(null);
  const lifecycle = useProductLifecycleStatus(productStatus);

  const currentMediaCount = lifecycle.mediaCount ?? mediaCount;
  const message = actionState.message;
  const messageIsError = actionState.status === "error";
  const displayedStatus = actionState.productStatus ?? lifecycle.productStatus;

  const runLifecycleAction = useCallback(
    (action: "publish" | "hide" | "delete", formData: FormData) => {
      setLastAction(action);
      startTransition(async () => {
        const handler =
          action === "publish"
            ? publishProduct
            : action === "hide"
              ? hideProduct
              : deleteProduct;
        let nextState;
        try {
          nextState = await handler(
            productId,
            actionStateRef.current,
            formData,
          );
        } catch {
          nextState = {
            status: "error" as const,
            message:
              "Соединение прервалось. Состояние товара не изменено — повторите действие.",
            productStatus: actionStateRef.current.productStatus,
          };
        }
        actionStateRef.current = nextState;
        setActionState(nextState);
        lifecycle.setProductStatus(nextState.productStatus);
        if (
          nextState.status === "success" ||
          nextState.productStatus === PRODUCT_STATUS_DELETED
        ) {
          const shouldMoveFocus =
            action === "publish" || confirmationDialogOpenRef.current;
          confirmationDialogOpenRef.current = false;
          setConfirmation(null);
          if (shouldMoveFocus) {
            requestAnimationFrame(() => {
              document.getElementById("product-state-heading")?.focus();
            });
          }
        }
      });
    },
    [lifecycle, productId],
  );

  const confirmationIsHide = confirmation === "hide";
  const confirmationTitle = confirmationIsHide
    ? "Скрыть товар от покупателей?"
    : "Удалить товар?";
  const confirmationDescription = confirmationIsHide
    ? "Товар исчезнет из публичной витрины, но останется в кабинете. Его можно опубликовать снова."
    : "Товар и его фотографии исчезнут из публичной витрины. Действие нельзя отменить.";
  const confirmationError =
    messageIsError &&
    ((confirmation === "hide" && lastAction === "hide") ||
      (confirmation === "delete" && lastAction === "delete"))
      ? message
      : "";

  return (
    <section aria-labelledby="product-state-heading" className="space-y-5">
      <div className="border-b border-border-strong pb-4">
        <p className="font-mono text-xs text-ink-secondary">Состояние товара</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2
            className="text-xl font-semibold tracking-tight outline-none"
            id="product-state-heading"
            tabIndex={-1}
          >
            {getProductStatusLabel(displayedStatus)}
          </h2>
          <StatusBadge
            tone={
              displayedStatus === PRODUCT_STATUS_PUBLISHED
                ? "success"
                : displayedStatus === PRODUCT_STATUS_DELETED
                  ? "danger"
                  : "neutral"
            }
          >
            {getProductStatusLabel(displayedStatus)}
          </StatusBadge>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
          Сохранение полей не публикует товар. Видимость меняется только после
          отдельной команды.
        </p>
      </div>

      {mediaLoadError ? (
        <Alert tone="warning" title="Фотографии не проверены">
          Обновите страницу перед публикацией, чтобы не принять ошибку загрузки
          за пустой список.
        </Alert>
      ) : displayedStatus !== PRODUCT_STATUS_PUBLISHED ? (
        <p className="text-sm leading-6 text-ink-secondary">
          {currentMediaCount === 0
            ? "Для публикации добавьте хотя бы одну фотографию."
            : `Для публикации готово фотографий: ${currentMediaCount} из 10.`}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {displayedStatus === PRODUCT_STATUS_PUBLISHED ? (
          <Button
            disabled={pending}
            id="hide-product-trigger"
            onClick={() => {
              confirmationDialogOpenRef.current = true;
              setConfirmation("hide");
            }}
            variant="secondary"
          >
            Скрыть от покупателей
          </Button>
        ) : displayedStatus === PRODUCT_STATUS_HIDDEN || displayedStatus === "draft" ? (
          <form action={(formData) => runLifecycleAction("publish", formData)}>
            <Button
              disabled={pending || mediaLoadError || currentMediaCount === 0}
              type="submit"
            >
              {pending && lastAction === "publish"
                ? "Публикуем…"
                : "Опубликовать товар"}
            </Button>
          </form>
        ) : null}

        {displayedStatus !== PRODUCT_STATUS_DELETED ? (
          <Button
            disabled={pending}
            id="delete-product-trigger"
            onClick={() => {
              confirmationDialogOpenRef.current = true;
              setConfirmation("delete");
            }}
            variant="destructive"
          >
            Удалить товар
          </Button>
        ) : null}
      </div>

      {confirmation ? null : (
        <StatusMessage error={messageIsError}>{message}</StatusMessage>
      )}

      <Dialog
        actions={
          <>
            <Button
              data-dialog-initial-focus
              onClick={() => {
                confirmationDialogOpenRef.current = false;
                setConfirmation(null);
              }}
              variant="secondary"
            >
              {pending ? "Закрыть" : "Отмена"}
            </Button>
            {confirmationIsHide ? (
              <form action={(formData) => runLifecycleAction("hide", formData)}>
                <Button disabled={pending} type="submit" variant="destructive">
                  {pending && lastAction === "hide" ? "Скрываем…" : "Скрыть товар"}
                </Button>
              </form>
            ) : confirmation === "delete" ? (
              <form action={(formData) => runLifecycleAction("delete", formData)}>
                <input name="confirmDelete" type="hidden" value="yes" />
                <Button
                  aria-label="Подтвердить удаление товара"
                  disabled={pending}
                  type="submit"
                  variant="destructive"
                >
                  {pending && lastAction === "delete" ? "Удаляем…" : "Удалить товар"}
                </Button>
              </form>
            ) : null}
          </>
        }
        description={confirmationDescription}
        fallbackFocusId="product-state-heading"
        onOpenChange={(open) => {
          if (!open) {
            confirmationDialogOpenRef.current = false;
            setConfirmation(null);
          }
        }}
        open={confirmation !== null}
        title={confirmationTitle}
      >
        {pending ? (
          <StatusMessage>Действие выполняется. Диалог можно закрыть — операция продолжится.</StatusMessage>
        ) : null}
        {confirmationError ? (
          <Alert tone="danger" title="Действие не выполнено">
            {confirmationError}
          </Alert>
        ) : null}
      </Dialog>
    </section>
  );
}
