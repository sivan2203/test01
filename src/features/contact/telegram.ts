export const TELEGRAM_USERNAME_MIN_LENGTH = 5;
export const TELEGRAM_USERNAME_MAX_LENGTH = 32;

const TELEGRAM_USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;
const TELEGRAM_PROFILE_PATTERN =
  /^https:\/\/(?:t\.me|telegram\.me|telegram\.dog)\/([^/]+)\/?$/i;

export type TelegramUsernameValidation =
  | { isValid: true; username: string | null }
  | { isValid: false; username: null; error: string };

export type TelegramProductContactContext = {
  storeSlug: string;
  productId: string;
  telegramUsername: string;
  title: string;
  priceMode: "fixed" | "request";
  priceAmount: number | null;
  origin: string;
};

export type TelegramHandoff = {
  message: string;
  productUrl: string;
  url: string;
};

function invalidTelegramUsername(): TelegramUsernameValidation {
  return {
    isValid: false,
    username: null,
    error:
      "Введите username, @username или HTTPS-ссылку на публичный профиль Telegram без дополнительных параметров.",
  };
}

function getCandidateUsername(value: string) {
  if (value.startsWith("@")) {
    return value.slice(1);
  }

  if (!value.startsWith("https://")) {
    return value;
  }

  return value.match(TELEGRAM_PROFILE_PATTERN)?.[1] ?? null;
}

export function validateTelegramUsername(
  value: string,
): TelegramUsernameValidation {
  if (value === "") {
    return { isValid: true, username: null };
  }

  if (/\s/.test(value)) {
    return invalidTelegramUsername();
  }

  const candidate = getCandidateUsername(value);
  if (
    candidate === null ||
    candidate.length < TELEGRAM_USERNAME_MIN_LENGTH ||
    candidate.length > TELEGRAM_USERNAME_MAX_LENGTH ||
    !TELEGRAM_USERNAME_PATTERN.test(candidate)
  ) {
    return invalidTelegramUsername();
  }

  return { isValid: true, username: candidate };
}

const PRODUCT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertProductContactContext(context: TelegramProductContactContext) {
  const contact = validateTelegramUsername(context.telegramUsername);
  if (!contact.isValid || !contact.username) {
    throw new Error("Telegram contact is not configured.");
  }

  if (!PRODUCT_ID_PATTERN.test(context.productId)) {
    throw new Error("Invalid product identity.");
  }

  if (!context.storeSlug || /[^a-z0-9-]/i.test(context.storeSlug)) {
    throw new Error("Invalid store identity.");
  }

  if (
    context.priceMode === "fixed" &&
    (!Number.isFinite(context.priceAmount) || (context.priceAmount ?? 0) <= 0)
  ) {
    throw new Error("Invalid product price.");
  }

  if (context.priceMode === "request" && context.priceAmount !== null) {
    throw new Error("Invalid request price.");
  }

  try {
    const origin = new URL(context.origin);
    if (origin.protocol !== "http:" && origin.protocol !== "https:") {
      throw new Error();
    }
  } catch {
    throw new Error("Invalid public site origin.");
  }

  return contact.username;
}

function getProductPriceLabel(
  priceMode: TelegramProductContactContext["priceMode"],
  priceAmount: number | null,
) {
  if (priceMode === "request" || priceAmount === null) return "по запросу";

  return `${priceAmount.toLocaleString("ru-RU")} ₽`;
}

function getProductUrl(context: TelegramProductContactContext) {
  const origin = new URL(context.origin).origin;
  return `${origin}/${encodeURIComponent(context.storeSlug)}/products/${encodeURIComponent(context.productId)}`;
}

export function formatProductContactMessage(
  context: TelegramProductContactContext,
) {
  assertProductContactContext(context);
  const productUrl = getProductUrl(context);
  const priceLabel = getProductPriceLabel(context.priceMode, context.priceAmount);

  return `Здравствуйте! Пишу по товару «${context.title}». Цена: ${priceLabel}. Ссылка на товар: ${productUrl}`;
}

export function buildTelegramHandoff(
  context: TelegramProductContactContext,
): TelegramHandoff {
  const username = assertProductContactContext(context);
  const productUrl = getProductUrl(context);
  const message = formatProductContactMessage(context);
  const telegramUrl = new URL(`https://t.me/${username}`);
  telegramUrl.searchParams.set("text", message);

  return { message, productUrl, url: telegramUrl.toString() };
}
