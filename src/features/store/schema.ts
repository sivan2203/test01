export const STORE_NAME_MAX_LENGTH = 80;
export const STORE_OPTIONAL_TEXT_MAX_LENGTH = 500;
export const STORE_DEFAULT_TIMEZONE = "Europe/Moscow";
export const STORE_SLUG_MIN_LENGTH = 3;
export const STORE_SLUG_MAX_LENGTH = 32;
export const STORE_RESERVED_SLUGS = [
  "admin",
  "api",
  "login",
  "signup",
  "support",
  "help",
  "seller",
] as const;

const STORE_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type StoreProfileValues = {
  name: string;
  slug: string;
  telegramUsername: string;
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

export function normalizeStoreSlug(value: string) {
  return value.trim().toLowerCase();
}

export function validateStoreSlug(
  value: string,
  options: { allowEmpty?: boolean } = {},
) {
  const allowEmpty = options.allowEmpty ?? true;
  const slug = normalizeStoreSlug(value);
  const slugLength = countStoreTextCharacters(slug);

  if (slugLength === 0) {
    return allowEmpty
      ? { isValid: true as const, slug: "" }
      : {
          isValid: false as const,
          slug,
          error: "Введите публичную ссылку магазина.",
        };
  }

  if (slugLength < STORE_SLUG_MIN_LENGTH || slugLength > STORE_SLUG_MAX_LENGTH) {
    return {
      isValid: false as const,
      slug,
      error: `Ссылка должна быть от ${STORE_SLUG_MIN_LENGTH} до ${STORE_SLUG_MAX_LENGTH} символов.`,
    };
  }

  if (!STORE_SLUG_PATTERN.test(slug)) {
    return {
      isValid: false as const,
      slug,
      error:
        "Используйте только латинские буквы, цифры и дефис. Дефис не может быть первым или последним.",
    };
  }

  if (STORE_RESERVED_SLUGS.includes(slug as (typeof STORE_RESERVED_SLUGS)[number])) {
    return {
      isValid: false as const,
      slug,
      error: "Эта ссылка зарезервирована. Выберите другой вариант.",
    };
  }

  return { isValid: true as const, slug };
}

export function validateStoreProfileValues(values: StoreProfileValues) {
  const fieldErrors: StoreProfileFieldErrors = {};
  const name = values.name.trim();
  const slugValidation = validateStoreSlug(values.slug);
  const nameLength = countStoreTextCharacters(name);
  const descriptionLength = countStoreTextCharacters(values.description);
  const additionalInfoLength = countStoreTextCharacters(values.additionalInfo);

  if (nameLength === 0) {
    fieldErrors.name = "Введите название магазина.";
  } else if (nameLength > STORE_NAME_MAX_LENGTH) {
    fieldErrors.name = `Название должно быть не длиннее ${STORE_NAME_MAX_LENGTH} символов.`;
  }

  if (!slugValidation.isValid) {
    fieldErrors.slug = slugValidation.error;
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
      slug: slugValidation.slug,
      telegramUsername: values.telegramUsername,
      description: values.description.trim(),
      additionalInfo: values.additionalInfo.trim(),
    },
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
}
