import type { Metadata } from "next";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { getSellerAuthRedirect } from "@/features/seller-auth/redirect";
import { SellerSignInForm } from "@/features/seller-auth/sign-in-form";

export const metadata: Metadata = { title: "Вход продавца" };

export default async function SellerSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const params = await searchParams;
  const from = getSellerAuthRedirect(params.from);

  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)]" id="main-content" tabIndex={-1}>
      <section className="hidden border-r border-border bg-surface-muted p-10 lg:flex lg:flex-col lg:justify-between">
        <Link className="font-mono text-xs text-ink-secondary" href="/">← ПЕРСОНАЛЬНАЯ ВИТРИНА</Link>
        <div>
          <p className="font-mono text-xs text-primary">SELLER / ВХОД</p>
          <p className="mt-4 max-w-xl text-5xl font-bold leading-[0.95] tracking-[-0.05em]">
            Управляйте витриной без лишней панели управления.
          </p>
        </div>
        <p className="max-w-lg text-sm leading-6 text-ink-secondary">
          Ссылка действует один раз. Пароль хранить не нужно.
        </p>
      </section>

      <section className="flex items-center px-4 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
        <p className="font-mono text-xs text-primary">КАБИНЕТ ПРОДАВЦА</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Войти или зарегистрироваться</h1>
        <p className="mt-4 text-sm leading-6 text-ink-secondary">
          Укажите email — отправим одноразовую ссылку для входа. Покупателям
          аккаунт не нужен.
        </p>
        {params.error ? (
          <Alert className="mt-5" tone="danger" title="Вход не завершён">
            Не удалось завершить вход. Запросите новую ссылку и попробуйте ещё раз.
          </Alert>
        ) : null}
        <SellerSignInForm from={from} />
        <Link className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-ink-secondary underline underline-offset-4" href="/">
          Вернуться на главную
        </Link>
        </div>
      </section>
    </main>
  );
}
