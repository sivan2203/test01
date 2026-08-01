export const PRODUCT_TITLE_MAX_LENGTH = 120;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 1000;
export const PRODUCT_STATUS_DRAFT = "draft";

export const PRODUCT_PRICE_MODES = ["fixed", "request"] as const;
export const PRODUCT_AVAILABILITY_STATUSES = [
  "in_stock",
  "out_of_stock",
] as const;

export type ProductPriceMode = (typeof PRODUCT_PRICE_MODES)[number];
export type ProductAvailabilityStatus =
  (typeof PRODUCT_AVAILABILITY_STATUSES)[number];

export type ProductDraftValues = {
  title: string;
  priceMode: ProductPriceMode;
  priceAmount: string;
  description: string;
  availabilityStatus: ProductAvailabilityStatus;
};

export type ProductDraftFieldErrors = Partial<
  Record<keyof ProductDraftValues, string>
>;

type ProductDraftValidationResult = {
  values: ProductDraftValues;
  fieldErrors: ProductDraftFieldErrors;
  isValid: boolean;
  normalized: {
    title: string;
    priceMode: ProductPriceMode;
    priceAmount: number | null;
    description: string | null;
    availabilityStatus: ProductAvailabilityStatus;
  };
};

function countProductTextCharacters(value: string) {
  return Array.from(value).length;
}

function isProductPriceMode(value: string): value is ProductPriceMode {
  return PRODUCT_PRICE_MODES.includes(value as ProductPriceMode);
}

function isProductAvailabilityStatus(
  value: string,
): value is ProductAvailabilityStatus {
  return PRODUCT_AVAILABILITY_STATUSES.includes(
    value as ProductAvailabilityStatus,
  );
}

function normalizePriceAmount(value: string) {
  return value.trim().replace(",", ".");
}

function validateFixedPriceAmount(value: string) {
  const normalized = normalizePriceAmount(value);

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return {
      isValid: false as const,
      value: null,
      error: "Введите цену числом с максимум двумя знаками после запятой.",
    };
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 999999999.99) {
    return {
      isValid: false as const,
      value: null,
      error: "Цена должна быть больше 0.",
    };
  }

  return {
    isValid: true as const,
    value: Number(parsed.toFixed(2)),
  };
}

export function getProductPriceLabel(
  priceMode: ProductPriceMode,
  priceAmount: number | null,
) {
  if (priceMode === "request" || priceAmount === null) {
    return "по запросу";
  }

  return `${priceAmount.toLocaleString("ru-RU")} ₽`;
}

export function validateProductDraftValues(
  values: ProductDraftValues,
): ProductDraftValidationResult {
  const fieldErrors: ProductDraftFieldErrors = {};
  const title = values.title.trim();
  const description = values.description.trim();
  const titleLength = countProductTextCharacters(title);
  const descriptionLength = countProductTextCharacters(description);
  const priceMode = isProductPriceMode(values.priceMode)
    ? values.priceMode
    : "request";
  const availabilityStatus = isProductAvailabilityStatus(
    values.availabilityStatus,
  )
    ? values.availabilityStatus
    : "in_stock";

  if (titleLength === 0) {
    fieldErrors.title = "Введите название товара.";
  } else if (titleLength > PRODUCT_TITLE_MAX_LENGTH) {
    fieldErrors.title = `Название должно быть не длиннее ${PRODUCT_TITLE_MAX_LENGTH} символов.`;
  }

  if (!isProductPriceMode(values.priceMode)) {
    fieldErrors.priceMode = "Выберите формат цены.";
  }

  if (descriptionLength > PRODUCT_DESCRIPTION_MAX_LENGTH) {
    fieldErrors.description = `Описание должно быть не длиннее ${PRODUCT_DESCRIPTION_MAX_LENGTH} символов.`;
  }

  let priceAmount: number | null = null;
  if (priceMode === "fixed") {
    const priceValidation = validateFixedPriceAmount(values.priceAmount);
    if (!priceValidation.isValid) {
      fieldErrors.priceAmount = priceValidation.error;
    } else {
      priceAmount = priceValidation.value;
    }
  }

  if (!isProductAvailabilityStatus(values.availabilityStatus)) {
    fieldErrors.availabilityStatus = "Выберите статус наличия.";
  }

  return {
    values: {
      title,
      priceMode,
      priceAmount:
        priceMode === "fixed" ? normalizePriceAmount(values.priceAmount) : "",
      description,
      availabilityStatus,
    },
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
    normalized: {
      title,
      priceMode,
      priceAmount,
      description: descriptionLength > 0 ? description : null,
      availabilityStatus,
    },
  };
}
