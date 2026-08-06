"use client";

import { useActionState, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  getInitialProductMediaActionState,
  type ProductMedia,
} from "./media-schema";
import { manageProductMedia } from "./media-actions";
import { useProductLifecycleStatus } from "./product-lifecycle-context";
import type { ProductStatus } from "./schema";

type ProductMediaManagerProps = {
  productId: string;
  productTitle: string;
  productStatus: ProductStatus;
  initialMedia: ProductMedia[];
  initialError?: string;
};

function mediaActionClassName(message: string) {
  return message ? "text-sm leading-6 text-foreground/75" : "sr-only";
}

export function ProductMediaManager({
  productId,
  productTitle,
  productStatus,
  initialMedia,
  initialError,
}: ProductMediaManagerProps) {
  const lifecycle = useProductLifecycleStatus(productStatus);
  const initialState = getInitialProductMediaActionState(initialMedia);
  const [state, mediaAction, pending] = useActionState(
    manageProductMedia.bind(null, productId),
    initialState,
  );
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const media = state.media;
  const actionMessage = state.status !== "idle" ? state.message : initialError ?? "";
  const mediaLoadFailed = Boolean(initialError) && state.status === "idle";

  function getReorderedIds(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= media.length) return null;
    const ids = media.map((item) => item.id);
    [ids[index], ids[nextIndex]] = [ids[nextIndex], ids[index]];
    return JSON.stringify(ids);
  }

  function closeRemovalConfirmation(mediaId: string) {
    setPendingRemovalId(null);
    requestAnimationFrame(() => {
      document.getElementById(`remove-photo-trigger-${mediaId}`)?.focus();
    });
  }

  function handleRemovalDialogKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
    mediaId: string,
  ) {
    if (event.key !== "Escape" || pending) return;
    event.preventDefault();
    closeRemovalConfirmation(mediaId);
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="product-media-heading">
      <div>
        <p className="text-sm text-foreground/60">Фотографии</p>
        <h2 id="product-media-heading" className="mt-1 text-xl font-semibold">
          Фото товара
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground/70">
          JPG, PNG или WebP до 6 МБ каждое. Можно добавить до 10 фотографий. Первая фотография — обложка.
        </p>
      </div>

      <form action={mediaAction} className="flex flex-col gap-3">
        <input name="operation" type="hidden" value="upload" />
        <label
          className="flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-border bg-surface-raised px-5 text-center text-sm font-medium text-foreground hover:bg-muted"
          htmlFor="product-media-files"
        >
          Добавить фотографии
          <input
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={pending}
            id="product-media-files"
            multiple
            name="files"
            type="file"
          />
        </label>
        <Button disabled={pending} type="submit">
          {pending ? "Сохраняем фотографии…" : "Сохранить выбранные фото"}
        </Button>
      </form>

      <p className="text-sm text-foreground/60" aria-live="polite">
        {media.length} из 10 фотографий
      </p>

      {mediaLoadFailed ? (
        <p className="rounded-2xl border border-dashed border-border p-4 text-sm leading-6 text-foreground/70" role="alert">
          Не удалось загрузить сохранённые фотографии. Обновите страницу; пустой список не означает, что фотографии отсутствуют.
        </p>
      ) : media.length > 0 ? (
        <ol className="grid grid-cols-2 gap-3" aria-label={`Фотографии товара ${productTitle}`}>
          {media.map((item, index) => {
            const previousOrder = getReorderedIds(index, -1);
            const nextOrder = getReorderedIds(index, 1);

            return (
              <li
                className="flex min-w-0 flex-col gap-2 rounded-2xl border border-border bg-surface-raised p-2"
                key={item.id}
              >
                <figure>
                  <img
                    alt={`Фото ${index + 1} из ${media.length}: ${productTitle}`}
                    className="aspect-square w-full rounded-xl object-cover"
                    src={item.url}
                  />
                  <figcaption className="mt-2 text-xs leading-5 text-foreground/65">
                    {item.isCover ? "Обложка · " : ""}Фото {index + 1} из {media.length}
                  </figcaption>
                </figure>

                <div className="grid grid-cols-2 gap-2">
                  <form action={mediaAction}>
                    <input name="operation" type="hidden" value="reorder" />
                    <input name="orderedMediaIds" type="hidden" value={previousOrder ?? ""} />
                    <Button
                      aria-label={`Переместить фото ${index + 1} из ${media.length} выше`}
                      className="w-full"
                      disabled={!previousOrder || pending}
                      variant="secondary"
                      type="submit"
                    >
                      ↑
                    </Button>
                  </form>
                  <form action={mediaAction}>
                    <input name="operation" type="hidden" value="reorder" />
                    <input name="orderedMediaIds" type="hidden" value={nextOrder ?? ""} />
                    <Button
                      aria-label={`Переместить фото ${index + 1} из ${media.length} ниже`}
                      className="w-full"
                      disabled={!nextOrder || pending}
                      variant="secondary"
                      type="submit"
                    >
                      ↓
                    </Button>
                  </form>
                </div>

                {pendingRemovalId === item.id ? (
                  <div
                    aria-describedby={`remove-photo-description-${item.id}`}
                    aria-labelledby={`remove-photo-title-${item.id}`}
                    aria-modal="false"
                    className="rounded-xl border border-border bg-muted p-3"
                    onKeyDown={(event) =>
                      handleRemovalDialogKeyDown(event, item.id)
                    }
                    role="alertdialog"
                  >
                    <p
                      className="text-sm font-medium text-foreground"
                      id={`remove-photo-title-${item.id}`}
                    >
                      Удалить фото {index + 1} из {media.length}?
                    </p>
                    <p
                      className="mt-1 text-xs leading-5 text-foreground/65"
                      id={`remove-photo-description-${item.id}`}
                    >
                      Действие нельзя отменить.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button
                        className="w-full"
                        disabled={pending}
                        onClick={() => closeRemovalConfirmation(item.id)}
                        variant="secondary"
                      >
                        Отмена
                      </Button>
                      <form action={mediaAction}>
                        <input name="operation" type="hidden" value="remove" />
                        <input name="mediaId" type="hidden" value={item.id} />
                        <Button
                          aria-label={`Подтвердить удаление фото ${index + 1} из ${media.length}`}
                          autoFocus
                          className="w-full"
                          disabled={pending}
                          type="submit"
                        >
                          {pending ? "Удаляем…" : "Удалить фото"}
                        </Button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <Button
                    aria-label={`Удалить фото ${index + 1} из ${media.length}`}
                    className="w-full"
                    disabled={pending}
                    id={`remove-photo-trigger-${item.id}`}
                    onClick={() => setPendingRemovalId(item.id)}
                    variant="ghost"
                  >
                    Удалить
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-4 text-sm leading-6 text-foreground/70">
          У товара пока нет фотографий. Их можно добавить сейчас или позже; для публикации понадобится от 1 до 10 фото.
        </p>
      )}

      <p className={mediaActionClassName(actionMessage)} role="alert" aria-live="polite">
        {actionMessage || "Нет сообщений"}
      </p>

      {lifecycle.productStatus === "published" ? (
        <p className="text-xs leading-5 text-foreground/60">
          Опубликованный товар должен сохранять хотя бы одну фотографию.
        </p>
      ) : null}
    </section>
  );
}
