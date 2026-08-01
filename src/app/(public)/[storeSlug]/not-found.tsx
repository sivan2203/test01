import Link from "next/link";

import { GlassPanel } from "@/components/design-system";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PublicStoreNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-6">
      <GlassPanel className="w-full p-6 text-center">
        <p className="text-sm text-foreground/60">Публичная витрина</p>
        <h1 className="mt-2 text-2xl font-semibold">Витрина не найдена</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Проверьте ссылку или вернитесь на главную страницу.
        </p>
        <Link className={cn(buttonVariants({ variant: "primary" }), "mt-5 w-full")} href="/">
          На главную
        </Link>
      </GlassPanel>
    </main>
  );
}
