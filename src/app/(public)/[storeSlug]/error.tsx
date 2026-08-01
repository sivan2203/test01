"use client";

import { GlassPanel } from "@/components/design-system";
import { Button } from "@/components/ui/button";

export default function PublicStoreError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-6">
      <GlassPanel className="w-full p-6 text-center">
        <p className="text-sm text-foreground/60">Публичная витрина</p>
        <h1 className="mt-2 text-2xl font-semibold">Витрина временно недоступна</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Попробуйте обновить страницу немного позже.
        </p>
        <Button className="mt-5 w-full" onClick={() => reset()} variant="primary">
          Повторить
        </Button>
      </GlassPanel>
    </main>
  );
}
