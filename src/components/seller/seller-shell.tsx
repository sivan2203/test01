import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SellerNavigation } from "./seller-navigation";

type SellerShellProps = {
  children: ReactNode;
  signOutAction: () => Promise<void>;
};

export function SellerShell({ children, signOutAction }: SellerShellProps) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface-muted px-4 py-5 lg:flex">
        <Link className="rounded-sm px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/seller">
          <span className="block font-mono text-[0.6875rem] text-ink-secondary">ВИТРИНА / SELLER</span>
          <span className="mt-1 block text-lg font-semibold tracking-tight">Кабинет продавца</span>
        </Link>
        <div className="mt-8 flex-1">
          <SellerNavigation />
        </div>
        <form action={signOutAction} className="border-t border-border pt-4">
          <Button className="w-full justify-start" type="submit" variant="ghost">
            Выйти из кабинета
          </Button>
        </form>
      </aside>

      <div className="min-w-0">
        <header className="flex min-h-16 items-center justify-between border-b border-border px-4 lg:hidden">
          <Link className="font-semibold tracking-tight" href="/seller">Витрина</Link>
          <form action={signOutAction}>
            <Button size="compact" type="submit" variant="secondary">Выйти</Button>
          </form>
        </header>
        <main
          className="mx-auto w-full max-w-[92rem] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8"
          id="main-content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-raised px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] lg:hidden">
        <SellerNavigation mobile />
      </div>
    </div>
  );
}
