import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function PublicStoreNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center px-4 py-10" id="main-content" tabIndex={-1}>
      <section className="w-full border-y border-border-strong py-10">
        <p className="font-mono text-xs text-primary">ВИТРИНА / 404</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Витрина не найдена</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-ink-secondary">Проверьте адрес. Если продавец изменил публичную ссылку, старая сразу перестаёт работать.</p>
        <Link className={`${buttonVariants({ variant: "secondary" })} mt-6`} href="/">На главную</Link>
      </section>
    </main>
  );
}
