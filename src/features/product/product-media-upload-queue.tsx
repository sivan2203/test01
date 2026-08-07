"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  PRODUCT_MEDIA_MAX_COUNT,
  type ProductMedia,
  type ProductMediaUploadResponse,
  validateProductMediaFile,
  validateProductMediaSignature,
} from "./media-schema";

type QueueStatus =
  | "queued"
  | "uploading"
  | "processing"
  | "success"
  | "error";

type QueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  objectUrl: string | null;
  status: QueueStatus;
  preflight: "checking" | "ready";
  progress: number | null;
  message: string;
  reservesCapacity: boolean;
};

type ProductMediaUploadQueueProps = {
  productId: string;
  productTitle: string;
  persistedCount: number;
  disabled?: boolean;
  onUploaded: (media: ProductMedia) => void;
  onBusyChange?: (busy: boolean) => void;
};

const MAX_VISIBLE_REJECTION_MESSAGES = 5;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  }
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(
    bytes / (1024 * 1024),
  )} МБ`;
}

function parseUploadResponse(value: unknown): ProductMediaUploadResponse | null {
  if (!value || typeof value !== "object") return null;
  const response = value as Record<string, unknown>;
  if (typeof response.message !== "string") return null;

  if (response.status === "error" && response.media === null) {
    return {
      status: "error",
      message: response.message,
      media: null,
    };
  }

  if (
    response.status !== "success" ||
    !response.media ||
    typeof response.media !== "object"
  ) {
    return null;
  }

  const media = response.media as Record<string, unknown>;
  if (
    typeof media.id !== "string" ||
    typeof media.url !== "string" ||
    (media.mimeType !== "image/jpeg" &&
      media.mimeType !== "image/png" &&
      media.mimeType !== "image/webp") ||
    typeof media.sortOrder !== "number" ||
    typeof media.isCover !== "boolean"
  ) {
    return null;
  }

  return {
    status: "success",
    message: response.message,
    media: {
      id: media.id,
      url: media.url,
      mimeType: media.mimeType,
      sortOrder: media.sortOrder,
      isCover: media.isCover,
    },
  };
}

function queueStatusLabel(item: QueueItem) {
  if (item.status === "queued") {
    return item.preflight === "checking" ? "Проверяем" : "В очереди";
  }
  if (item.status === "uploading") return "Загружаем";
  if (item.status === "processing") return "Обрабатываем";
  if (item.status === "success") return "Загружено";
  return "Ошибка";
}

function queueStatusTone(item: QueueItem) {
  if (item.status === "success") return "success" as const;
  if (item.status === "error") return "danger" as const;
  if (item.status === "processing") return "warning" as const;
  return "neutral" as const;
}

export function ProductMediaUploadQueue({
  productId,
  productTitle,
  persistedCount,
  disabled = false,
  onUploaded,
  onBusyChange,
}: ProductMediaUploadQueueProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [dropActive, setDropActive] = useState(false);
  const [announcement, setAnnouncement] = useState({ sequence: 0, message: "" });
  const [selectionErrors, setSelectionErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<QueueItem[]>([]);
  const activeUploadIdRef = useRef<string | null>(null);
  const requestsRef = useRef(new Map<string, XMLHttpRequest>());
  const onUploadedRef = useRef(onUploaded);
  const mountedRef = useRef(true);

  const announce = useCallback((message: string) => {
    setAnnouncement((current) => ({
      sequence: current.sequence + 1,
      message,
    }));
  }, []);

  useEffect(() => {
    onUploadedRef.current = onUploaded;
  }, [onUploaded]);

  const updateItems = useCallback(
    (updater: (current: QueueItem[]) => QueueItem[]) => {
      setItems((current) => {
        const next = updater(current);
        itemsRef.current = next;
        return next;
      });
    },
    [],
  );

  const replaceItems = useCallback((next: QueueItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const updateItem = useCallback(
    (itemId: string, updater: (item: QueueItem) => QueueItem) => {
      updateItems((current) =>
        current.map((item) => (item.id === itemId ? updater(item) : item)),
      );
    },
    [updateItems],
  );

  const rejectPreflightItem = useCallback(
    (itemId: string, file: File, message: string) => {
      const item = itemsRef.current.find((candidate) => candidate.id === itemId);
      updateItems((current) =>
        current.filter((candidate) => candidate.id !== itemId),
      );
      if (item?.objectUrl) URL.revokeObjectURL(item.objectUrl);
      setSelectionErrors((current) => [
        ...current.slice(-(MAX_VISIBLE_REJECTION_MESSAGES - 1)),
        `${file.name}: ${message}`,
      ]);
      announce(`${file.name}: файл не добавлен. ${message}`);
    },
    [announce, updateItems],
  );

  const runSignaturePreflight = useCallback(
    async (itemId: string, file: File) => {
      const validation = validateProductMediaFile(file);
      if (!validation.isValid) {
        rejectPreflightItem(itemId, file, validation.message);
        return;
      }

      try {
        const signature = await validateProductMediaSignature(
          file,
          validation.mimeType,
        );
        if (!mountedRef.current) return;
        if (!signature.isValid) {
          rejectPreflightItem(itemId, file, signature.message);
          return;
        }

        updateItem(itemId, (item) => ({
          ...item,
          preflight: "ready",
          message: "Файл готов к загрузке.",
        }));
      } catch {
        if (!mountedRef.current) return;
        const message = "Не удалось проверить файл. Удалите его или повторите.";
        updateItem(itemId, (item) => ({
          ...item,
          status: "error",
          preflight: "ready",
          reservesCapacity: false,
          message,
        }));
        announce(`${file.name}: ${message}`);
      }
    },
    [announce, rejectPreflightItem, updateItem],
  );

  const addFiles = useCallback(
    (selectedFiles: File[]) => {
      if (disabled || selectedFiles.length === 0) return;

      const current = itemsRef.current;
      let reservedCount = current.filter((item) => item.reservesCapacity).length;
      const created: QueueItem[] = [];
      const rejectedMessages: string[] = [];

      for (const file of selectedFiles) {
        const validation = validateProductMediaFile(file);
        const hasCapacity =
          persistedCount + reservedCount < PRODUCT_MEDIA_MAX_COUNT;
        if (!validation.isValid) {
          rejectedMessages.push(`${file.name}: ${validation.message}`);
          continue;
        }
        if (!hasCapacity) {
          rejectedMessages.push(
            `${file.name}: у товара может быть не больше ${PRODUCT_MEDIA_MAX_COUNT} фотографий.`,
          );
          continue;
        }

        const objectUrl = URL.createObjectURL(file);
        const item: QueueItem = {
          id: crypto.randomUUID(),
          file,
          previewUrl: objectUrl,
          objectUrl,
          status: "queued",
          preflight: "checking",
          progress: null,
          message: "Проверяем файл…",
          reservesCapacity: true,
        };
        reservedCount += 1;
        created.push(item);
      }

      replaceItems([...current, ...created]);
      const visibleRejections = rejectedMessages.slice(
        0,
        MAX_VISIBLE_REJECTION_MESSAGES,
      );
      if (rejectedMessages.length > MAX_VISIBLE_REJECTION_MESSAGES) {
        visibleRejections.push(
          `Ещё файлов не добавлено: ${rejectedMessages.length - MAX_VISIBLE_REJECTION_MESSAGES}.`,
        );
      }
      setSelectionErrors(visibleRejections);
      if (rejectedMessages.length > 0) {
        announce(
          `Не добавлено файлов: ${rejectedMessages.length}. ${visibleRejections.join(" ")}`,
        );
      }
      for (const item of created) {
        if (item.status === "queued") {
          void runSignaturePreflight(item.id, item.file);
        }
      }
    },
    [announce, disabled, persistedCount, replaceItems, runSignaturePreflight],
  );

  useEffect(() => {
    const busy = items.some(
      (item) =>
        item.status === "queued" ||
        item.status === "uploading" ||
        item.status === "processing",
    );
    onBusyChange?.(busy);
  }, [items, onBusyChange]);

  useEffect(() => {
    if (disabled || activeUploadIdRef.current) return;
    const nextItem = items.find(
      (item) => item.status === "queued" && item.preflight === "ready",
    );
    if (!nextItem) return;

    activeUploadIdRef.current = nextItem.id;
    updateItem(nextItem.id, (item) => ({
      ...item,
      status: "uploading",
      progress: 0,
      message: "Передаём файл…",
    }));

    const request = new XMLHttpRequest();
    requestsRef.current.set(nextItem.id, request);

    const finishRequest = () => {
      requestsRef.current.delete(nextItem.id);
      if (activeUploadIdRef.current === nextItem.id) {
        activeUploadIdRef.current = null;
      }
    };

    const failRequest = (message: string) => {
      finishRequest();
      if (!mountedRef.current) return;
      updateItem(nextItem.id, (item) => ({
        ...item,
        status: "error",
        progress: null,
        reservesCapacity: false,
        message,
      }));
      announce(`${nextItem.file.name}: ${message}`);
    };

    request.open(
      "POST",
      `/api/seller/products/${encodeURIComponent(productId)}/media`,
    );
    request.responseType = "json";
    request.timeout = 120_000;
    request.withCredentials = true;

    request.upload.addEventListener("progress", (event) => {
      if (!mountedRef.current) return;
      if (!event.lengthComputable || event.total <= 0) return;
      const progress = Math.min(
        100,
        Math.round((event.loaded / event.total) * 100),
      );
      updateItem(nextItem.id, (item) => ({ ...item, progress }));
    });

    request.upload.addEventListener("load", () => {
      if (!mountedRef.current) return;
      updateItem(nextItem.id, (item) => ({
        ...item,
        status: "processing",
        progress: 100,
        message: "Файл передан. Сервер проверяет и сохраняет его…",
      }));
      announce(`${nextItem.file.name}: файл передан, обрабатываем.`);
    });

    request.addEventListener("load", () => {
      if (!mountedRef.current) {
        finishRequest();
        return;
      }
      const response = parseUploadResponse(request.response);
      if (
        request.status < 200 ||
        request.status >= 300 ||
        !response ||
        response.status !== "success"
      ) {
        failRequest(
          response?.message ??
            "Не удалось загрузить фотографию. Файл сохранён в очереди — повторите.",
        );
        return;
      }

      finishRequest();
      updateItem(nextItem.id, (item) => {
        if (response.media.url && item.objectUrl) {
          URL.revokeObjectURL(item.objectUrl);
        }
        return {
          ...item,
          previewUrl: response.media.url || item.previewUrl,
          objectUrl: response.media.url ? null : item.objectUrl,
          status: "success",
          progress: 100,
          reservesCapacity: false,
          message: response.message,
        };
      });
      announce(`${nextItem.file.name}: загружено.`);
      onUploadedRef.current({
        ...response.media,
        url: response.media.url || nextItem.previewUrl,
      });
    });

    request.addEventListener("error", () => {
      failRequest(
        "Соединение прервалось. Файл сохранён в очереди — повторите загрузку.",
      );
    });

    request.addEventListener("abort", () => {
      failRequest("Загрузка отменена. Файл сохранён — можно повторить.");
    });

    request.addEventListener("timeout", () => {
      failRequest(
        "Загрузка заняла слишком много времени. Файл сохранён — повторите попытку.",
      );
    });

    const formData = new FormData();
    formData.set("file", nextItem.file);
    formData.set("uploadId", nextItem.id);
    request.send(formData);
  }, [announce, disabled, items, productId, updateItem]);

  useEffect(() => {
    mountedRef.current = true;
    const requests = requestsRef.current;
    return () => {
      mountedRef.current = false;
      for (const request of requests.values()) request.abort();
      requests.clear();
      for (const item of itemsRef.current) {
        if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
      }
    };
  }, []);

  function removeLocalItem(itemId: string) {
    const item = itemsRef.current.find((candidate) => candidate.id === itemId);
    if (!item || item.status === "processing") return;

    const request = requestsRef.current.get(itemId);
    replaceItems(itemsRef.current.filter((candidate) => candidate.id !== itemId));
    if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
    if (activeUploadIdRef.current === itemId) activeUploadIdRef.current = null;
    requestsRef.current.delete(itemId);
    request?.abort();
    announce(`${item.file.name}: убрано из очереди.`);
  }

  function retryItem(itemId: string) {
    const item = itemsRef.current.find((candidate) => candidate.id === itemId);
    if (!item || item.status !== "error") return;

    const validation = validateProductMediaFile(item.file);
    if (!validation.isValid) {
      updateItem(itemId, (current) => ({
        ...current,
        message: validation.message,
      }));
      announce(`${item.file.name}: ${validation.message}`);
      return;
    }

    const otherReserved = itemsRef.current.filter(
      (candidate) => candidate.id !== itemId && candidate.reservesCapacity,
    ).length;
    if (persistedCount + otherReserved >= PRODUCT_MEDIA_MAX_COUNT) {
      const message = `У товара уже ${PRODUCT_MEDIA_MAX_COUNT} фотографий.`;
      updateItem(itemId, (current) => ({ ...current, message }));
      announce(`${item.file.name}: ${message}`);
      return;
    }

    updateItem(itemId, (current) => ({
      ...current,
      status: "queued",
      preflight: "checking",
      progress: null,
      reservesCapacity: true,
      message: "Повторно проверяем файл…",
    }));
    void runSignaturePreflight(itemId, item.file);
  }

  const settledCount = items.filter(
    (item) => item.status === "success" || item.status === "error",
  ).length;
  const successCount = items.filter((item) => item.status === "success").length;

  return (
    <section aria-labelledby="media-upload-heading" className="space-y-4">
      <div
        aria-disabled={disabled}
        className={`border border-dashed px-4 py-6 text-center transition-colors ${
          dropActive
            ? "border-primary bg-primary/5"
            : "border-border-strong bg-surface-raised"
        } ${disabled ? "opacity-60" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDropActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          const nextTarget = event.relatedTarget;
          if (
            !(nextTarget instanceof Node) ||
            !event.currentTarget.contains(nextTarget)
          ) {
            setDropActive(false);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setDropActive(false);
          addFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <h3 className="text-base font-semibold" id="media-upload-heading">
          Добавьте фотографии
        </h3>
        <p
          className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink-secondary"
          id="media-upload-constraints"
        >
          Перетащите JPG, PNG или WebP сюда либо выберите файлы. До 6 МБ каждый,
          максимум {PRODUCT_MEDIA_MAX_COUNT}.
        </p>
        <input
          accept="image/jpeg,image/png,image/webp"
          aria-describedby="media-upload-constraints"
          aria-label="Фотографии товара"
          className="hidden"
          disabled={disabled}
          id="product-media-files"
          multiple
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
          ref={inputRef}
          type="file"
        />
        <Button
          aria-describedby="media-upload-constraints"
          className="mt-4"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          variant="secondary"
        >
          Выбрать фотографии
        </Button>
      </div>

      {selectionErrors.length > 0 ? (
        <Alert tone="danger" title="Некоторые файлы не добавлены">
          <ul className="min-w-0 list-disc space-y-1 break-words pl-5">
            {selectionErrors.map((message, index) => (
              <li key={`${index}-${message}`}>{message}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <p aria-live="polite" className="text-sm text-ink-secondary">
        {items.length > 0
          ? `Обработано ${settledCount} из ${items.length}. Загружено: ${successCount}.`
          : `Сохранено ${persistedCount} из ${PRODUCT_MEDIA_MAX_COUNT} фотографий.`}
      </p>
      <p
        aria-live="polite"
        className="sr-only"
        key={announcement.sequence}
        role="status"
      >
        {announcement.message}
      </p>

      {items.length > 0 ? (
        <ol aria-label="Очередь загрузки фотографий" className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <li className="grid gap-3 py-4 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center" key={item.id}>
              <img
                alt={`Предпросмотр ${item.file.name} для товара ${productTitle}`}
                className="h-20 w-20 rounded-sm object-cover"
                height={80}
                src={item.previewUrl}
                width={80}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold">{item.file.name}</p>
                  <StatusBadge tone={queueStatusTone(item)}>
                    {queueStatusLabel(item)}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-xs text-ink-secondary">
                  {formatBytes(item.file.size)} · {item.message}
                </p>
                {item.status === "uploading" ? (
                  <progress
                    aria-label={`Загрузка ${item.file.name}`}
                    className="mt-3 h-1.5 w-full accent-primary"
                    max={100}
                    value={item.progress ?? undefined}
                  />
                ) : item.status === "processing" ? (
                  <p className="mt-3 font-mono text-xs text-warning">
                    100% · Обрабатываем на сервере…
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {item.status === "error" ? (
                  <Button
                    aria-label={`Повторить загрузку ${item.file.name}`}
                    onClick={() => retryItem(item.id)}
                    size="compact"
                    variant="secondary"
                  >
                    Повторить
                  </Button>
                ) : null}
                {item.status !== "processing" ? (
                  <Button
                    aria-label={
                      item.status === "uploading"
                        ? `Отменить загрузку ${item.file.name}`
                        : `Убрать ${item.file.name} из очереди`
                    }
                    onClick={() => removeLocalItem(item.id)}
                    size="compact"
                    variant="ghost"
                  >
                    {item.status === "uploading" ? "Отменить" : "Убрать"}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
