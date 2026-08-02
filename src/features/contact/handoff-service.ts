import type {
  TelegramHandoff,
  TelegramProductContactContext,
} from "./telegram";

export type PrepareTelegramHandoffInput = {
  storeSlug: string;
  productId: string;
  origin: string;
  source?: string | null;
  sessionId?: string | null;
  isPreview?: boolean;
};

export type PrepareTelegramHandoffResult =
  | ({ status: "ready" } & TelegramHandoff)
  | { status: "not_found" }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string };

type PublicStoreLookup =
  | {
      status: "found";
      store: {
        slug: string;
        contactConfigured: boolean;
        telegramUsername?: string;
      };
    }
  | { status: "not_found" }
  | { status: "error" };

type PublicProductLookup =
  | {
      status: "found";
      product: {
        id: string;
        title: string;
        priceMode: "fixed" | "request";
        priceAmount: number | null;
      };
    }
  | { status: "not_found" }
  | { status: "error" };

export type CtaClickRecordInput = {
  storeSlug: string;
  productId: string;
  source: string | null;
  sessionId: string | null;
};

export type TelegramHandoffServiceDependencies = {
  getStore: (storeSlug: string) => Promise<PublicStoreLookup>;
  getProduct: (storeSlug: string, productId: string) => Promise<PublicProductLookup>;
  recordCtaClick: (input: CtaClickRecordInput) => Promise<void>;
  buildHandoff: (context: TelegramProductContactContext) => TelegramHandoff;
};

export async function prepareTelegramHandoffWithDependencies(
  input: PrepareTelegramHandoffInput,
  dependencies: TelegramHandoffServiceDependencies,
): Promise<PrepareTelegramHandoffResult> {
  try {
    const storeResult = await dependencies.getStore(input.storeSlug);
    if (storeResult.status === "not_found") return { status: "not_found" };
    if (storeResult.status === "error") {
      return {
        status: "error",
        message: "Не удалось загрузить контакт продавца.",
      };
    }

    const telegramUsername = storeResult.store.telegramUsername;
    if (!storeResult.store.contactConfigured || !telegramUsername) {
      return {
        status: "unavailable",
        message: "Контакт продавца пока не настроен.",
      };
    }

    const productResult = await dependencies.getProduct(
      input.storeSlug,
      input.productId,
    );
    if (productResult.status === "not_found") return { status: "not_found" };
    if (productResult.status === "error") {
      return {
        status: "error",
        message: "Не удалось загрузить товар.",
      };
    }

    const buildHandoff = () =>
      dependencies.buildHandoff({
        storeSlug: storeResult.store.slug,
        productId: productResult.product.id,
        telegramUsername,
        title: productResult.product.title,
        priceMode: productResult.product.priceMode,
        priceAmount: productResult.product.priceAmount,
        origin: input.origin,
      });

    if (!input.isPreview) {
      await dependencies.recordCtaClick({
        storeSlug: storeResult.store.slug,
        productId: productResult.product.id,
        source: input.source ?? "unknown",
        sessionId: input.sessionId ?? null,
      });
    }

    const handoff = buildHandoff();

    return { status: "ready", ...handoff };
  } catch {
    return {
      status: "error",
      message: "Не удалось подготовить обращение. Попробуйте ещё раз.",
    };
  }
}
