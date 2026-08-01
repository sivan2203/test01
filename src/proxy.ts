import { NextResponse, type NextRequest } from "next/server";

import {
  getSellerReturnPath,
  isDevSellerSessionCookie,
  SELLER_SIGN_IN_PATH,
} from "./proxy-rules.mjs";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/seller") || pathname === SELLER_SIGN_IN_PATH) {
    return NextResponse.next();
  }

  const hasDevSellerSession = isDevSellerSessionCookie(
    request.cookies.get("seller_session")?.value,
  );

  if (hasDevSellerSession) {
    return NextResponse.next();
  }

  const signInUrl = request.nextUrl.clone();
  signInUrl.pathname = SELLER_SIGN_IN_PATH;
  signInUrl.searchParams.set(
    "from",
    getSellerReturnPath(pathname, request.nextUrl.search),
  );

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/seller/:path*"],
};
