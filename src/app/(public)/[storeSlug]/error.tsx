"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";

export default function PublicStoreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center px-4 py-10" id="main-content" tabIndex={-1}>
      <section className="w-full border-y border-border-strong py-10">
        <p className="font-mono text-xs text-destructive">ВИТРИНА / ОШИБКА ЗАГРУЗКИ</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Витрина временно недоступна</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-ink-secondary">Это не означает, что товаров нет. Повторите запрос или вернитесь на главную.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={reset}>Повторить</Button>
          <Link className={buttonVariants({ variant: "secondary" })} href="/">На главную</Link>
        </div>
      </section>
    </main>
  );
}
