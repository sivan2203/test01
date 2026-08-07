"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";

export default function ProductError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center px-4 py-10" id="main-content" tabIndex={-1}>
      <section className="w-full border-y border-border-strong py-10">
        <p className="font-mono text-xs text-destructive">ТОВАР / ОШИБКА ЗАГРУЗКИ</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Не удалось загрузить товар</h1>
        <p className="mt-4 text-sm leading-6 text-ink-secondary">Повторите запрос. Мы не показываем пустую карточку вместо ошибки.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={reset}>Повторить</Button>
          <Link className={buttonVariants({ variant: "secondary" })} href="/">На главную</Link>
        </div>
      </section>
    </main>
  );
}
