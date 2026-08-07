import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="min-h-dvh" id="main-content" tabIndex={-1}>
      <header className="border-b border-border px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4">
          <p className="font-mono text-xs text-ink-secondary">ПЕРСОНАЛЬНАЯ ВИТРИНА / 01</p>
          <Link className={buttonVariants({ variant: "secondary", size: "compact" })} href="/seller/sign-in">
            Войти продавцу
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[90rem] gap-12 px-4 py-12 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)] lg:gap-20 lg:py-28">
        <section>
          <p className="font-mono text-xs text-primary">ПРОДУКТ → ДИАЛОГ</p>
          <h1 className="mt-5 max-w-5xl text-[clamp(2.75rem,8vw,7.5rem)] font-bold leading-[0.91] tracking-[-0.06em]">
            Товары — ясно. Связь — напрямую.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-ink-secondary sm:text-xl">
            Соберите личную витрину, покажите покупателю главное и продолжите разговор о конкретном товаре в Telegram.
          </p>
          <Link className={cn(buttonVariants({ size: "lg" }), "mt-8 sm:w-auto")} href="/seller/sign-in">
            Открыть кабинет продавца
          </Link>
        </section>

        <aside className="border-t-[3px] border-foreground pt-4 lg:self-end" aria-label="Возможности сервиса">
          {[
            ["01", "Одна публичная ссылка"],
            ["02", "Товары, фото и наличие"],
            ["03", "Контекстный переход в Telegram"],
          ].map(([index, label]) => (
            <div className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-border py-4" key={index}>
              <span className="font-mono text-xs text-ink-secondary">{index}</span>
              <span className="font-semibold">{label}</span>
            </div>
          ))}
          <p className="mt-5 text-sm leading-6 text-ink-secondary">
            Покупателю не нужен аккаунт. Продавец управляет публикацией и видит только наблюдаемые сигналы интереса.
          </p>
        </aside>
      </div>
    </main>
  );
}
