import { GlassPanel } from "@/components/design-system";
import { getSellerAuthRedirect } from "@/features/seller-auth/redirect";
import { SellerSignInForm } from "@/features/seller-auth/sign-in-form";

export default async function SellerSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const params = await searchParams;
  const from = getSellerAuthRedirect(params.from);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-6">
      <GlassPanel className="p-5">
        <p className="text-sm text-foreground/60">Кабинет продавца</p>
        <h1 className="mt-2 text-2xl font-semibold">Войти или зарегистрироваться</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Укажите email — отправим одноразовую ссылку для входа. Покупателям
          аккаунт не нужен.
        </p>
        {params.error ? (
          <p className="mt-3 text-sm leading-6 text-foreground/75" role="alert">
            Не удалось завершить вход. Запросите новую ссылку и попробуйте ещё раз.
          </p>
        ) : null}
        <SellerSignInForm from={from} />
      </GlassPanel>
    </main>
  );
}
