import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSellerAuthRedirect } from "@/features/seller-auth/redirect";

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSellerAuthRedirect(requestUrl.searchParams.get("next"));
  const redirectToSignIn = (error: string) => {
    const signInUrl = new URL("/seller/sign-in", requestUrl.origin);
    signInUrl.searchParams.set("error", error);
    return NextResponse.redirect(signInUrl);
  };

  if (!code) {
    return redirectToSignIn("missing_code");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirectToSignIn("callback_failed");
    }
  } catch {
    return redirectToSignIn("callback_failed");
  }

  const redirectUrl = new URL(nextPath, requestUrl.origin);
  return NextResponse.redirect(redirectUrl);
}
