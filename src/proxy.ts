import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseProxyClient } from "./lib/supabase/proxy";
import {
  getSellerReturnPath,
  SELLER_SIGN_IN_PATH,
} from "./proxy-rules.mjs";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/seller") || pathname === SELLER_SIGN_IN_PATH) {
    return NextResponse.next();
  }

  let authResponse: NextResponse | null = null;

  try {
    const auth = createSupabaseProxyClient(request);
    const {
      data: { user },
    } = await auth.supabase.auth.getUser();
    authResponse = auth.response;

    if (user) {
      return auth.response;
    }
  } catch {
    // If auth is unavailable because local env is missing, fail closed into sign-in.
  }

  const signInUrl = request.nextUrl.clone();
  signInUrl.pathname = SELLER_SIGN_IN_PATH;
  signInUrl.searchParams.set(
    "from",
    getSellerReturnPath(pathname, request.nextUrl.search),
  );

  const redirectResponse = NextResponse.redirect(signInUrl);
  authResponse?.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export const config = {
  matcher: ["/seller/:path*"],
};
