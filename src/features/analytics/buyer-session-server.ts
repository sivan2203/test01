import "server-only";

import { normalizeAnalyticsSessionId } from "./event-contract.ts";

export const BUYER_SESSION_COOKIE = "buyer_session_id" as const;
export const BUYER_SESSION_MAX_AGE = 60 * 60 * 24 * 365;

export type BuyerSessionCookieStore = {
  get: (name: string) => { value: string } | undefined;
  set: (
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      maxAge: number;
      path: "/";
      sameSite: "lax";
      secure: boolean;
    },
  ) => void;
};

export function ensureBuyerSession(cookieStore: BuyerSessionCookieStore) {
  const existing = normalizeAnalyticsSessionId(
    cookieStore.get(BUYER_SESSION_COOKIE)?.value,
  );
  if (existing) return { value: existing, created: false };

  const value = crypto.randomUUID();
  cookieStore.set(BUYER_SESSION_COOKIE, value, {
    httpOnly: true,
    maxAge: BUYER_SESSION_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return { value, created: true };
}
