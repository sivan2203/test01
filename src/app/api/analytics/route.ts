import { cookies } from "next/headers";

import {
  classifyAnalyticsUserAgent,
  normalizeAnalyticsSessionId,
} from "@/features/analytics/event-contract";
import {
  parsePublicAnalyticsPayload,
  type PublicAnalyticsPayload,
} from "@/features/analytics/public-ingestion";
import { recordPublicAnalyticsEvent } from "@/features/analytics/public-ingestion-server";

const BUYER_SESSION_COOKIE = "buyer_session_id";

function getSourceFromReferer(referer: string | null) {
  if (!referer) return null;

  try {
    const url = new URL(referer);
    return url.searchParams.get("source") ?? url.searchParams.get("utm_source");
  } catch {
    return null;
  }
}

function getSessionId(cookieValue: string | undefined) {
  const existing = normalizeAnalyticsSessionId(cookieValue);
  if (existing) return { value: existing, shouldSetCookie: false };
  return { value: crypto.randomUUID(), shouldSetCookie: true };
}

function getAnalyticsStatus(result: { status: string }) {
  if (result.status === "recorded" || result.status === "deduplicated") {
    return { ok: true, recorded: true, deduplicated: result.status === "deduplicated" };
  }
  return { ok: false, recorded: false, reason: result.status };
}

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ ok: false, reason: "malformed_payload" }, { status: 400 });
  }

  const payload = parsePublicAnalyticsPayload(rawBody);
  if (!payload) {
    return Response.json({ ok: false, reason: "invalid_payload" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const session = getSessionId(cookieStore.get(BUYER_SESSION_COOKIE)?.value);
  if (session.shouldSetCookie) {
    cookieStore.set(BUYER_SESSION_COOKIE, session.value, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  const userAgentType = classifyAnalyticsUserAgent(
    request.headers.get("user-agent"),
  );
  const input: PublicAnalyticsPayload & {
    sessionId: string;
    userAgentType: typeof userAgentType;
  } = {
    ...payload,
    source: payload.source ?? getSourceFromReferer(request.headers.get("referer")),
    sessionId: session.value,
    userAgentType,
  };

  const result = await recordPublicAnalyticsEvent(input);
  return Response.json(getAnalyticsStatus(result), { status: 202 });
}

