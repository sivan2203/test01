export const STORE_NAME_MAX_LENGTH = 80;
export const STORE_OPTIONAL_TEXT_MAX_LENGTH = 500;
export const STORE_DEFAULT_TIMEZONE = "Europe/Moscow";

export type StoreProfileValues = {
  name: string;
  description: string;
  additionalInfo: string;
};

export type StoreProfileFieldErrors = Partial<
  Record<keyof StoreProfileValues | "avatar", string>
>;

export function normalizeOptionalStoreText(value: string) {
  const trimmed = value.trim();
  return countStoreTextCharacters(trimmed) > 0 ? trimmed : null;
}

export function countStoreTextCharacters(value: string) {
  return Array.from(value).length;
}

export function validateStoreProfileValues(values: StoreProfileValues) {
  const fieldErrors: StoreProfileFieldErrors = {};
  const name = values.name.trim();
  const nameLength = countStoreTextCharacters(name);
  const descriptionLength = countStoreTextCharacters(values.description);
  const additionalInfoLength = countStoreTextCharacters(values.additionalInfo);

  if (nameLength === 0) {
    fieldErrors.name = "Введите название магазина.";
  } else if (nameLength > STORE_NAME_MAX_LENGTH) {
    fieldErrors.name = `Название должно быть не длиннее ${STORE_NAME_MAX_LENGTH} символов.`;
  }

  if (descriptionLength > STORE_OPTIONAL_TEXT_MAX_LENGTH) {
    fieldErrors.description = `Описание должно быть не длиннее ${STORE_OPTIONAL_TEXT_MAX_LENGTH} символов.`;
  }

  if (additionalInfoLength > STORE_OPTIONAL_TEXT_MAX_LENGTH) {
    fieldErrors.additionalInfo = `Дополнительная информация должна быть не длиннее ${STORE_OPTIONAL_TEXT_MAX_LENGTH} символов.`;
  }

  return {
    values: {
      name,
      description: values.description.trim(),
      additionalInfo: values.additionalInfo.trim(),
    },
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
}
