"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthCallbackUrl, getSellerAuthRedirect } from "./redirect";
import type { SignInFormState } from "./state";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function requestSellerMagicLink(
  _previousState: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const from = getSellerAuthRedirect(String(formData.get("from") ?? "/seller"));

  if (!EMAIL_PATTERN.test(email)) {
    return {
      status: "error",
      message: "Введите корректный email, чтобы получить ссылку для входа.",
      email,
    };
  }

  try {
    const headerStore = await headers();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      headerStore.get("origin") ??
      "http://localhost:3000";
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getAuthCallbackUrl(origin, from),
        shouldCreateUser: true,
      },
    });

    if (error) {
      return {
        status: "error",
        message: "Не удалось отправить ссылку. Проверьте email и попробуйте ещё раз.",
        email,
      };
    }

    return {
      status: "success",
      message: "Мы отправили ссылку для входа. Проверьте email и вернитесь сюда.",
      email,
    };
  } catch {
    return {
      status: "error",
      message:
        "Вход пока не настроен. Проверьте переменные Supabase в окружении и попробуйте снова.",
      email,
    };
  }
}

export async function signOutSeller() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/seller/sign-in");
}
