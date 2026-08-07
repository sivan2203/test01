import { StatusBadge } from "@/components/ui/status-badge";

import type { StoreProfileValues } from "./schema";

type StoreLivePreviewProps = {
  values: StoreProfileValues;
  avatarUrl?: string;
  unsaved: boolean;
};

export function StoreLivePreview({
  values,
  avatarUrl,
  unsaved,
}: StoreLivePreviewProps) {
  const storeName = values.name.trim() || "Название витрины";
  const description = values.description.trim();
  const additionalInfo = values.additionalInfo.trim();
  const telegramUsername = values.telegramUsername.trim();

  return (
    <div className="overflow-hidden rounded-lg border border-border-strong bg-surface-raised">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <span className="font-mono text-[0.6875rem] tracking-wide text-ink-secondary">
          ВИД ПОКУПАТЕЛЯ
        </span>
        {unsaved ? (
          <StatusBadge tone="warning">Не сохранено</StatusBadge>
        ) : (
          <StatusBadge tone="success">Сохранено</StatusBadge>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start gap-4">
          {avatarUrl ? (
            // Blob URLs from a freshly selected File cannot be rendered by next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={`Аватар витрины «${storeName}»`}
              className="h-16 w-16 shrink-0 rounded-md border border-border object-cover"
              src={avatarUrl}
            />
          ) : (
            <div
              aria-hidden="true"
              className="grid h-16 w-16 shrink-0 place-items-center rounded-md border border-border bg-surface-muted font-mono text-lg font-semibold text-ink-secondary"
            >
              {storeName.slice(0, 1).toLocaleUpperCase("ru-RU")}
            </div>
          )}

          <div className="min-w-0">
            <p className="break-words text-2xl font-semibold tracking-tight">
              {storeName}
            </p>
            <p className="mt-1 break-all font-mono text-xs text-ink-secondary">
              {values.slug.trim() ? `/${values.slug.trim()}` : "Ссылка не настроена"}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          {description ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
              {description}
            </p>
          ) : (
            <p className="text-sm leading-6 text-ink-secondary">
              Здесь появится короткое описание витрины.
            </p>
          )}

          {additionalInfo ? (
            <p className="mt-4 whitespace-pre-wrap break-words border-l-2 border-primary pl-3 text-sm leading-6 text-ink-secondary">
              {additionalInfo}
            </p>
          ) : null}

          <div className="mt-6 border-t border-border pt-4">
            <p className="font-mono text-[0.6875rem] tracking-wide text-ink-secondary">
              СВЯЗЬ
            </p>
            <p className="mt-2 text-sm font-semibold">
              {telegramUsername
                ? `Telegram: @${telegramUsername.replace(/^@/, "")}`
                : "Контакт пока не настроен"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
