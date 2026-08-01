import { getSafeSellerRedirectPath } from "@/proxy-rules.mjs";

export function getSellerAuthRedirect(value: string | null | undefined) {
  return getSafeSellerRedirectPath(value ?? null);
}

export function getAuthCallbackUrl(origin: string, nextPath: string) {
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", getSellerAuthRedirect(nextPath));
  return callbackUrl.toString();
}
