"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusMessage } from "@/components/ui/status-message";
import { manageProductMedia } from "./media-actions";
import {
  canRemoveProductMedia,
  getInitialProductMediaActionState,
  type ProductMedia,
} from "./media-schema";
import { ProductMediaUploadQueue } from "./product-media-upload-queue";
import { useProductLifecycleStatus } from "./product-lifecycle-context";
import type { ProductStatus } from "./schema";

export type ProductMediaManagerProps = {
  productId: string;
  productTitle: string;
  productStatus?: ProductStatus;
  initialMedia: ProductMedia[];
  initialError?: string;
  onMediaChange?: (media: ProductMedia[]) => void;
  onBusyChange?: (busy: boolean) => void;
};

function normalizeMedia(media: ProductMedia[]) {
  return [...media]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item, index) => ({
      ...item,
      sortOrder: index,
      isCover: index === 0,
    }));
}

export function ProductMediaManager({
  productId,
  productTitle,
  productStatus = "draft",
  initialMedia,
  initialError,
  onMediaChange,
  onBusyChange,
}: ProductMediaManagerProps) {
  const initialState = getInitialProductMediaActionState(initialMedia);
  const [actionState, setActionState] = useState(initialState);
  const [mutationPending, startMutation] = useTransition();
  const [media, setMedia] = useState(() => normalizeMedia(initialMedia));
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const mediaRef = useRef(media);
  const actionStateRef = useRef(actionState);
  const onMediaChangeRef = useRef(onMediaChange);
  const removalDialogOpenRef = useRef(false);
  const {
    productStatus: lifecycleStatus,
    setMediaCount,
  } = useProductLifecycleStatus(productStatus);

  useEffect(() => {
    onMediaChangeRef.current = onMediaChange;
  }, [onMediaChange]);

  const commitMedia = useCallback(
    (nextMedia: ProductMedia[], notify = true) => {
      const normalized = normalizeMedia(nextMedia);
      mediaRef.current = normalized;
      setMedia(normalized);
      setMediaCount(normalized.length);
      if (notify) onMediaChangeRef.current?.(normalized);
    },
    [setMediaCount],
  );

  const runMediaMutation = useCallback(
    (formData: FormData) => {
      const operation = String(formData.get("operation") ?? "");
      const focusMediaId = String(formData.get("focusMediaId") ?? "");
      const reorderKind = String(formData.get("reorderKind") ?? "");
      const previousIndex = mediaRef.current.findIndex(
        (item) => item.id === focusMediaId,
      );
      startMutation(async () => {
        let nextState;
        try {
          nextState = await manageProductMedia(
            productId,
            actionStateRef.current,
            formData,
          );
        } catch {
          nextState = {
            status: "error" as const,
            message:
              "Соединение прервалось. Фотографии не изменены — повторите действие.",
            media: mediaRef.current,
          };
        }
        if (
          nextState.status === "success" &&
          operation === "reorder" &&
          focusMediaId
        ) {
          const nextIndex = nextState.media.findIndex(
            (item) => item.id === focusMediaId,
          );
          nextState = {
            ...nextState,
            message:
              reorderKind === "cover"
                ? `Фото ${previousIndex + 1} стало обложкой и перемещено на позицию 1.`
                : `Фото перемещено с позиции ${previousIndex + 1} на позицию ${nextIndex + 1}.`,
          };
        }
        actionStateRef.current = nextState;
        setActionState(nextState);
        if (nextState.status === "success") {
          commitMedia(nextState.media);
          if (operation === "remove") {
            const shouldMoveFocus = removalDialogOpenRef.current;
            removalDialogOpenRef.current = false;
            setPendingRemovalId(null);
            if (shouldMoveFocus) {
              requestAnimationFrame(() => {
                document.getElementById("product-media-heading")?.focus();
              });
            }
          } else if (operation === "reorder" && focusMediaId) {
            requestAnimationFrame(() => {
              document
                .getElementById(`product-media-row-${focusMediaId}`)
                ?.focus();
            });
          }
        }
      });
    },
    [commitMedia, productId],
  );

  const handleUploaded = useCallback(
    (uploaded: ProductMedia) => {
      const next = [
        ...mediaRef.current.filter((item) => item.id !== uploaded.id),
        uploaded,
      ];
      commitMedia(next);
    },
    [commitMedia],
  );

  function getReorderedIds(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= media.length) return null;
    const ids = media.map((item) => item.id);
    [ids[index], ids[nextIndex]] = [ids[nextIndex], ids[index]];
    return JSON.stringify(ids);
  }

  function getCoverOrder(mediaId: string) {
    return JSON.stringify([
      mediaId,
      ...media.filter((item) => item.id !== mediaId).map((item) => item.id),
    ]);
  }

  const mediaLoadFailed = Boolean(initialError) && actionState.status === "idle";
  const controlsDisabled = mutationPending || uploadBusy;
  const removalMedia = media.find((item) => item.id === pendingRemovalId) ?? null;

  return (
    <section className="space-y-6" aria-labelledby="product-media-heading">
      <div className="border-b border-border-strong pb-4">
        <p className="font-mono text-xs text-ink-secondary">Фотографии</p>
        <h2
          className="mt-1 text-xl font-semibold tracking-tight outline-none"
          id="product-media-heading"
          tabIndex={-1}
        >
          Фото товара
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
          Превью появляется сразу. Файлы загружаются по одному; первая
          сохранённая позиция становится обложкой.
        </p>
      </div>

      {mediaLoadFailed ? (
        <Alert tone="danger" title="Не удалось загрузить сохранённые фотографии">
          Обновите страницу перед добавлением новых файлов. Пустой список не
          означает, что фотографий нет.
        </Alert>
      ) : null}

      <ProductMediaUploadQueue
        disabled={mutationPending || mediaLoadFailed}
        onBusyChange={(busy) => {
          setUploadBusy(busy);
          onBusyChange?.(busy);
        }}
        onUploaded={handleUploaded}
        persistedCount={media.length}
        productId={productId}
        productTitle={productTitle}
      />

      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border-strong pb-3">
        <h3 className="text-base font-semibold">Сохранённые фотографии</h3>
        <p className="font-mono text-xs text-ink-secondary">
          {media.length} из 10
        </p>
      </div>

      {media.length > 0 ? (
        <ol className="divide-y divide-border border-b border-border" aria-label={`Фотографии товара ${productTitle}`}>
          {media.map((item, index) => {
            const previousOrder = getReorderedIds(index, -1);
            const nextOrder = getReorderedIds(index, 1);

            return (
              <li
                className="grid gap-4 py-4 outline-none sm:grid-cols-[7rem_minmax(0,1fr)] lg:grid-cols-[7rem_minmax(0,1fr)_auto] lg:items-center"
                id={`product-media-row-${item.id}`}
                key={item.id}
                tabIndex={-1}
              >
                {item.url ? (
                  <img
                    alt={`Фото ${index + 1} из ${media.length}: ${productTitle}`}
                    className="aspect-square h-28 w-28 rounded-sm object-cover"
                    height={112}
                    src={item.url}
                    width={112}
                  />
                ) : (
                  <div
                    aria-label={`Предпросмотр фото ${index + 1} временно недоступен`}
                    className="flex aspect-square h-28 w-28 items-center justify-center rounded-sm border border-dashed border-border-strong bg-surface-muted p-2 text-center text-xs text-ink-secondary"
                    role="img"
                  >
                    Обновите для предпросмотра
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">
                      Фото {index + 1} из {media.length}
                    </p>
                    {item.isCover ? (
                      <StatusBadge tone="success">Обложка</StatusBadge>
                    ) : null}
                  </div>
                  <p className="mt-1 font-mono text-xs text-ink-secondary">
                    Позиция {index + 1}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 sm:col-start-2 lg:col-start-auto lg:justify-end">
                  {!item.isCover ? (
                    <form
                      action={runMediaMutation}
                    >
                      <input name="operation" type="hidden" value="reorder" />
                      <input
                        name="orderedMediaIds"
                        type="hidden"
                        value={getCoverOrder(item.id)}
                      />
                      <input name="focusMediaId" type="hidden" value={item.id} />
                      <input name="reorderKind" type="hidden" value="cover" />
                      <Button disabled={controlsDisabled} size="compact" type="submit" variant="secondary">
                        Сделать обложкой
                      </Button>
                    </form>
                  ) : null}

                  <form action={runMediaMutation}>
                    <input name="operation" type="hidden" value="reorder" />
                    <input name="orderedMediaIds" type="hidden" value={previousOrder ?? ""} />
                    <input name="focusMediaId" type="hidden" value={item.id} />
                    <input name="reorderKind" type="hidden" value="move" />
                    <Button
                      aria-label={`Переместить фото ${index + 1} из ${media.length} выше`}
                      disabled={!previousOrder || controlsDisabled}
                      size="compact"
                      type="submit"
                      variant="secondary"
                    >
                      Выше
                    </Button>
                  </form>

                  <form action={runMediaMutation}>
                    <input name="operation" type="hidden" value="reorder" />
                    <input name="orderedMediaIds" type="hidden" value={nextOrder ?? ""} />
                    <input name="focusMediaId" type="hidden" value={item.id} />
                    <input name="reorderKind" type="hidden" value="move" />
                    <Button
                      aria-label={`Переместить фото ${index + 1} из ${media.length} ниже`}
                      disabled={!nextOrder || controlsDisabled}
                      size="compact"
                      type="submit"
                      variant="secondary"
                    >
                      Ниже
                    </Button>
                  </form>

                  <Button
                    aria-label={`Удалить фото ${index + 1} из ${media.length}`}
                    disabled={
                      controlsDisabled ||
                      !canRemoveProductMedia(lifecycleStatus, media.length)
                    }
                    id={`remove-photo-trigger-${item.id}`}
                    onClick={() => {
                      removalDialogOpenRef.current = true;
                      setPendingRemovalId(item.id);
                    }}
                    size="compact"
                    variant="destructive"
                  >
                    Удалить
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : mediaLoadFailed ? null : (
        <div className="border-y border-border py-6">
          <p className="font-semibold">Сохранённых фотографий пока нет</p>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">
            Черновик можно оставить без фото. Для публикации потребуется хотя бы
            одна фотография.
          </p>
        </div>
      )}

      <StatusMessage error={actionState.status === "error"}>
        {actionState.status === "idle" ? initialError : actionState.message}
      </StatusMessage>

      {lifecycleStatus === "published" ? (
        <p className="text-xs leading-5 text-ink-secondary">
          У опубликованного товара должна оставаться хотя бы одна фотография.
        </p>
      ) : null}

      <Dialog
        actions={
          <>
            <Button
              data-dialog-initial-focus
              onClick={() => {
                removalDialogOpenRef.current = false;
                setPendingRemovalId(null);
              }}
              variant="secondary"
            >
              {mutationPending ? "Закрыть" : "Отмена"}
            </Button>
            {removalMedia ? (
              <form
                action={runMediaMutation}
              >
                <input name="operation" type="hidden" value="remove" />
                <input name="mediaId" type="hidden" value={removalMedia.id} />
                <Button
                  aria-label="Подтвердить удаление фотографии"
                  disabled={mutationPending}
                  type="submit"
                  variant="destructive"
                >
                  {mutationPending ? "Удаляем…" : "Удалить фотографию"}
                </Button>
              </form>
            ) : null}
          </>
        }
        description="Файл будет удалён из товара. Действие нельзя отменить."
        fallbackFocusId="product-media-heading"
        onOpenChange={(open) => {
          if (!open) {
            removalDialogOpenRef.current = false;
            setPendingRemovalId(null);
          }
        }}
        open={Boolean(removalMedia)}
        title="Удалить фотографию?"
      >
        {mutationPending ? (
          <StatusMessage>Удаление выполняется. Диалог можно закрыть — операция продолжится.</StatusMessage>
        ) : null}
        {removalMedia?.url ? (
          <img
            alt="Фотография, выбранная для удаления"
            className="h-20 w-20 rounded-sm object-cover"
            height={80}
            src={removalMedia.url}
            width={80}
          />
        ) : null}
      </Dialog>
    </section>
  );
}
