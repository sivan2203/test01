import "server-only";

import { cookies } from "next/headers";

import {
  classifyAnalyticsUserAgent,
  normalizeAnalyticsSessionId,
} from "@/features/analytics/event-contract";
import {
  MAX_ATTRIBUTION_REQUEST_BYTES,
  shouldPersistResolvedSource,
} from "@/features/analytics/source-attribution";
import {
  clearSourceAttribution,
  persistSourceAttribution,
  resolveRequestSource,
} from "@/features/analytics/source-attribution-server";
import { ensureBuyerSession } from "@/features/analytics/buyer-session-server";
import { prepareTelegramHandoff } from "@/features/contact/handoff";
import { parseTelegramHandoffRequestBody } from "@/features/contact/telegram-request";

type TelegramHandoffRequestOptions = {
  isPreview: boolean;
  previewStoreSlug?: string;
};

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
    const contentLength = Number(request.headers.get("content-length"));
    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_ATTRIBUTION_REQUEST_BYTES
    ) {
      return Response.json({ message: "РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ Р·Р°РїСЂРѕСЃ." }, { status: 400 });
    }

    const rawText = await request.text();
    if (new TextEncoder().encode(rawText).byteLength > MAX_ATTRIBUTION_REQUEST_BYTES) {
      return Response.json({ message: "РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ Р·Р°РїСЂРѕСЃ." }, { status: 400 });
    }
    rawBody = JSON.parse(rawText);
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
  const session = options.isPreview
    ? {
        value: normalizeAnalyticsSessionId(
          cookieStore.get("buyer_session_id")?.value,
        ),
        created: false,
      }
    : ensureBuyerSession(cookieStore);
  if (session.created) {
    clearSourceAttribution(cookieStore);
  }
  const sourceResolution = resolveRequestSource(request, cookieStore, {
    source: body.source,
    utmSource: body.utmSource,
    referrer: body.referrer || null,
  });
  const userAgentType = classifyAnalyticsUserAgent(request.headers.get("user-agent"));
  const result = await prepareTelegramHandoff({
    storeSlug: body.storeSlug,
    productId: body.productId,
    origin,
    source: sourceResolution.source,
    sessionId: session.value,
    userAgentType,
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

  if (
    shouldPersistResolvedSource({
      isPreview: options.isPreview,
      source: sourceResolution.source,
      status: "recorded",
      userAgentType,
    })
  ) {
    persistSourceAttribution(cookieStore, sourceResolution.source);
  }

  return Response.json({
    message: result.message,
    productUrl: result.productUrl,
    url: result.url,
  });
}
