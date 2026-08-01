import type { ProductDraftValues } from "./schema";

export const PRODUCT_STATUS_DRAFT = "draft";
export const PRODUCT_STATUS_PUBLISHED = "published";
export const PRODUCT_STATUS_HIDDEN = "hidden";
export const PRODUCT_STATUS_DELETED = "deleted";
export type ProductStatus =
  | typeof PRODUCT_STATUS_DRAFT
  | typeof PRODUCT_STATUS_PUBLISHED
  | typeof PRODUCT_STATUS_HIDDEN
  | typeof PRODUCT_STATUS_DELETED;

export type ProductLifecycleAction = "publish" | "hide" | "delete";

export type ProductLifecycleActionState = {
  status: "idle" | "success" | "error";
  message: string;
  productStatus: ProductStatus;
};

const PRODUCT_MEDIA_MAX_COUNT = 10;

export function isProductStatus(value: string): value is ProductStatus {
  return (
    value === PRODUCT_STATUS_DRAFT ||
    value === PRODUCT_STATUS_PUBLISHED ||
    value === PRODUCT_STATUS_HIDDEN ||
    value === PRODUCT_STATUS_DELETED
  );
}

export function canTransitionProductStatus(
  currentStatus: ProductStatus | string,
  nextStatus: ProductStatus | string,
) {
  if (!isProductStatus(currentStatus) || !isProductStatus(nextStatus)) {
    return false;
  }

  if (currentStatus === PRODUCT_STATUS_DELETED) return false;
  if (nextStatus === PRODUCT_STATUS_DELETED) return true;
  if (currentStatus === nextStatus) return true;

  return (
    (currentStatus === PRODUCT_STATUS_DRAFT &&
      nextStatus === PRODUCT_STATUS_PUBLISHED) ||
    (currentStatus === PRODUCT_STATUS_HIDDEN &&
      nextStatus === PRODUCT_STATUS_PUBLISHED) ||
    (currentStatus === PRODUCT_STATUS_PUBLISHED &&
      nextStatus === PRODUCT_STATUS_HIDDEN)
  );
}

export function getProductStatusLabel(status: ProductStatus) {
  if (status === PRODUCT_STATUS_PUBLISHED) return "Опубликован";
  if (status === PRODUCT_STATUS_HIDDEN) return "Скрыт";
  if (status === PRODUCT_STATUS_DELETED) return "Удалён";
  return "Черновик";
}

export function getProductLifecycleActionLabel(
  action: ProductLifecycleAction,
) {
  if (action === "publish") return "Опубликовать";
  if (action === "hide") return "Скрыть товар";
  return "Удалить товар";
}

export function validateProductPublication(
  values: ProductDraftValues,
  mediaCount: number | { length: number },
) {
  const fieldErrors: Record<string, string> = {};
  const title = values.title.trim();
  const description = values.description.trim();
  const priceMode = values.priceMode;
  const availabilityStatus = values.availabilityStatus;
  const price = values.priceAmount.trim().replace(",", ".");
  const count = typeof mediaCount === "number" ? mediaCount : mediaCount.length;

  if (Array.from(title).length === 0) {
    fieldErrors.title = "Введите название товара.";
  } else if (Array.from(title).length > 120) {
    fieldErrors.title = "Название должно быть не длиннее 120 символов.";
  }

  if (priceMode === "fixed") {
    if (!/^\d+(\.\d{1,2})?$/.test(price)) {
      fieldErrors.priceAmount = "Укажите положительную цену максимум с двумя знаками после запятой.";
    } else if (
      !Number.isFinite(Number(price)) ||
      Number(price) <= 0 ||
      Number(price) > 999999999.99
    ) {
      fieldErrors.priceAmount = "Цена должна быть больше 0.";
    }
  } else if (priceMode !== "request") {
    fieldErrors.priceMode = "Выберите формат цены.";
  }

  if (Array.from(description).length > 1000) {
    fieldErrors.description = "Описание должно быть не длиннее 1000 символов.";
  }

  if (availabilityStatus !== "in_stock" && availabilityStatus !== "out_of_stock") {
    fieldErrors.availabilityStatus = "Выберите статус наличия.";
  }

  if (count < 1 || count > PRODUCT_MEDIA_MAX_COUNT) {
    fieldErrors.media = `Для публикации добавьте от 1 до ${PRODUCT_MEDIA_MAX_COUNT} фотографий.`;
  }

  return {
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
}

export function getInitialProductLifecycleActionState(
  productStatus: ProductStatus,
): ProductLifecycleActionState {
  return { status: "idle", message: "", productStatus };
}
