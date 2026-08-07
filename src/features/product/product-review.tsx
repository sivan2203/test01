"use client";

import { Button } from "@/components/ui/button";
import type { ProductMedia } from "./media-schema";
import {
  getProductPriceLabel,
  type ProductDraftValues,
  validateProductDraftValues,
} from "./schema";
import type { ProductWizardStepId } from "./product-wizard-state";

type ProductReviewProps = {
  values: ProductDraftValues;
  media: ProductMedia[];
  onEdit: (stepId: ProductWizardStepId) => void;
};

function ReviewSection({
  title,
  editLabel,
  onEdit,
  children,
}: {
  title: string;
  editLabel: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border py-5" aria-label={title}>
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Button onClick={onEdit} size="compact" variant="ghost">
          {editLabel}
        </Button>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ProductReview({ values, media, onEdit }: ProductReviewProps) {
  const validation = validateProductDraftValues(values);
  const priceLabel = getProductPriceLabel(
    validation.normalized.priceMode,
    validation.normalized.priceAmount,
  );
  const cover = media.find((item) => Boolean(item.url));

  return (
    <div>
      <section
        aria-labelledby="product-review-preview-heading"
        className="grid gap-5 border-t border-border py-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
      >
        <div className="overflow-hidden rounded-md bg-surface-muted">
          {cover ? (
            // Signed local Storage URLs are already owner-authorized by the server query.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={`Обложка товара ${values.title}`}
              className="aspect-square h-full w-full object-cover"
              src={cover.url}
            />
          ) : (
            <div className="flex aspect-square items-center justify-center px-6 text-center text-sm text-ink-secondary">
              {media.length > 0
                ? "Предпросмотр сохранённой фотографии временно недоступен"
                : "Обложка появится после загрузки фотографии"}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between gap-6 py-1">
          <div>
            <p className="font-mono text-xs text-ink-secondary">ПРЕДПРОСМОТР / ПОКУПАТЕЛЬ</p>
            <h3
              className="mt-3 break-words text-3xl font-semibold tracking-[-0.03em] sm:text-4xl"
              id="product-review-preview-heading"
            >
              {values.title}
            </h3>
            <p className="mt-3 text-xl font-semibold">{priceLabel}</p>
            <p className="mt-2 text-sm text-ink-secondary">
              {values.availabilityStatus === "in_stock"
                ? "В наличии"
                : "Нет в наличии"}
            </p>
          </div>
          <p className="whitespace-pre-wrap break-words text-base leading-7 text-ink-secondary">
            {values.description || "Описание не добавлено."}
          </p>
        </div>
      </section>

      <ReviewSection
        editLabel="Изменить основное"
        onEdit={() => onEdit("basics")}
        title="Основное"
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-ink-secondary">Название</dt>
          <dd className="break-words font-medium">{values.title}</dd>
          <dt className="text-ink-secondary">Описание</dt>
          <dd className="whitespace-pre-wrap break-words">
            {values.description || "Не добавлено"}
          </dd>
        </dl>
      </ReviewSection>

      <ReviewSection
        editLabel="Изменить продажу"
        onEdit={() => onEdit("sale")}
        title="Продажа"
      >
        <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-ink-secondary">Цена</dt>
          <dd className="font-medium">{priceLabel}</dd>
          <dt className="text-ink-secondary">Наличие</dt>
          <dd>
            {values.availabilityStatus === "in_stock"
              ? "В наличии"
              : "Нет в наличии"}
          </dd>
        </dl>
      </ReviewSection>

      <ReviewSection
        editLabel="Изменить фотографии"
        onEdit={() => onEdit("photos")}
        title="Фото"
      >
        {media.length > 0 ? (
          <ol className="grid grid-cols-3 gap-2 sm:grid-cols-5" aria-label="Фотографии товара">
            {media.map((item, index) => (
              <li className="min-w-0" key={item.id}>
                {item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`Фото ${index + 1} из ${media.length}: ${values.title}`}
                    className="aspect-square w-full rounded-sm object-cover"
                    src={item.url}
                  />
                ) : (
                  <div
                    aria-label={`Фото ${index + 1} из ${media.length}: предпросмотр временно недоступен`}
                    className="flex aspect-square items-center justify-center rounded-sm bg-surface-muted px-2 text-center text-xs text-ink-secondary"
                    role="img"
                  >
                    Нет предпросмотра
                  </div>
                )}
                <p className="mt-1 truncate font-mono text-[0.6875rem] text-ink-secondary">
                  {index === 0 ? "ОБЛОЖКА" : `ФОТО ${index + 1}`}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-ink-secondary">
            Фотографий пока нет. Черновик можно сохранить, но публикация недоступна.
          </p>
        )}
      </ReviewSection>
    </div>
  );
}
