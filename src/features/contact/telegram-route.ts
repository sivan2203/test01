import "server-only";

import { cookies } from "next/headers";

import {
  classifyAnalyticsUserAgent,
  normalizeAnalyticsSessionId,
  normalizeAnalyticsSource,
} from "@/features/analytics/event-contract";
import { prepareTelegramHandoff } from "@/features/contact/handoff";
import { parseTelegramHandoffRequestBody } from "@/features/contact/telegram-request";

type TelegramHandoffRequestOptions = {
  isPreview: boolean;
  previewStoreSlug?: string;
};

function getSourceFromReferer(referer: string | null) {
  if (!referer) return null;

  try {
    const url = new URL(referer);
    return url.searchParams.get("source") ?? url.searchParams.get("utm_source");
  } catch {
    return null;
  }
}

function getTrustedSiteOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configuredOrigin) return null;

  try {
    const url = new URL(configuredOrigin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function handleTelegramHandoffRequest(
  request: Request,
  options: TelegramHandoffRequestOptions,
) {
  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ message: "Некорректный запрос." }, { status: 400 });
  }

  const body = parseTelegramHandoffRequestBody(rawBody);
  if (!body) {
    return Response.json(
      { message: "Не удалось определить товар." },
      { status: 400 },
    );
  }

  if (options.isPreview && options.previewStoreSlug !== body.storeSlug) {
    return Response.json({ message: "Предпросмотр недоступен." }, { status: 403 });
  }

  const origin = getTrustedSiteOrigin();
  if (!origin) {
    return Response.json(
      { message: "Публичный адрес сайта не настроен." },
      { status: 503 },
    );
  }

  const cookieStore = await cookies();
  const sessionId = normalizeAnalyticsSessionId(
    cookieStore.get("buyer_session_id")?.value,
  );
  const source = normalizeAnalyticsSource(
    body.source ?? getSourceFromReferer(request.headers.get("referer")),
  );
  const result = await prepareTelegramHandoff({
    storeSlug: body.storeSlug,
    productId: body.productId,
    origin,
    source,
    sessionId,
    userAgentType: classifyAnalyticsUserAgent(request.headers.get("user-agent")),
    isPreview: options.isPreview,
  });

  if (result.status === "not_found") {
    return Response.json({ message: "Товар не найден." }, { status: 404 });
  }

  if (result.status === "unavailable") {
    return Response.json({ message: result.message }, { status: 409 });
  }

  if (result.status === "error") {
    return Response.json({ message: result.message }, { status: 503 });
  }

  return Response.json({
    message: result.message,
    productUrl: result.productUrl,
    url: result.url,
  });
}
