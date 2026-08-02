import { cookies } from "next/headers";

import {
  classifyAnalyticsUserAgent,
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
import {
  parsePublicAnalyticsPayload,
  type PublicAnalyticsPayload,
} from "@/features/analytics/public-ingestion";
import { recordPublicAnalyticsEvent } from "@/features/analytics/public-ingestion-server";

function getAnalyticsStatus(result: { status: string }) {
  if (result.status === "recorded" || result.status === "deduplicated") {
    return { ok: true, recorded: true, deduplicated: result.status === "deduplicated" };
  }
  return { ok: false, recorded: false, reason: result.status };
}

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_ATTRIBUTION_REQUEST_BYTES
    ) {
      return Response.json({ ok: false, reason: "payload_too_large" }, { status: 400 });
    }

    const rawText = await request.text();
    if (new TextEncoder().encode(rawText).byteLength > MAX_ATTRIBUTION_REQUEST_BYTES) {
      return Response.json({ ok: false, reason: "payload_too_large" }, { status: 400 });
    }
    rawBody = JSON.parse(rawText);
  } catch {
    return Response.json({ ok: false, reason: "malformed_payload" }, { status: 400 });
  }

  const payload = parsePublicAnalyticsPayload(rawBody);
  if (!payload) {
    return Response.json({ ok: false, reason: "invalid_payload" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const session = ensureBuyerSession(cookieStore);
  if (session.created) {
    clearSourceAttribution(cookieStore);
  }

  const userAgentType = classifyAnalyticsUserAgent(
    request.headers.get("user-agent"),
  );
  const sourceResolution = resolveRequestSource(request, cookieStore, {
    source: payload.source,
    utmSource: payload.utmSource,
    referrer: payload.referrer || null,
  });
  const input: PublicAnalyticsPayload & {
    sessionId: string;
    userAgentType: typeof userAgentType;
  } = {
    ...payload,
    source: sourceResolution.source,
    sessionId: session.value,
    userAgentType,
  };

  const result = await recordPublicAnalyticsEvent(input);
  if (shouldPersistResolvedSource({
    source: sourceResolution.source,
    status: result.status,
    userAgentType,
  })) {
    persistSourceAttribution(cookieStore, sourceResolution.source);
  }
  return Response.json(getAnalyticsStatus(result), { status: 202 });
}
