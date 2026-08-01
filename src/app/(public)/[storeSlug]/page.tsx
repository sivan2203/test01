import { notFound } from "next/navigation";

import { GlassPanel } from "@/components/design-system";
import { getPublicStoreBySlug } from "@/features/store/public-queries";

export const dynamic = "force-dynamic";

export default async function PublicStorePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const storeResult = await getPublicStoreBySlug(storeSlug);

  if (storeResult.status === "not_found") {
    notFound();
  }

  if (storeResult.status === "error") {
    throw new Error("Public store lookup failed.");
  }

  const { store } = storeResult;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
      <GlassPanel className="p-5">
        <p className="text-sm text-foreground/60">Витрина / {store.slug}</p>
        <h1 className="mt-2 text-2xl font-semibold">{store.name}</h1>
        {store.description ? (
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            {store.description}
          </p>
        ) : null}
        {store.additionalInfo ? (
          <p className="mt-3 text-sm leading-6 text-foreground/60">
            {store.additionalInfo}
          </p>
        ) : null}
        <p className="mt-5 rounded-2xl border border-border bg-surface-raised p-4 text-sm leading-6 text-foreground/70">
          Каталог появится здесь в следующих шагах. Сейчас проверяется только
          текущая публичная ссылка магазина.
        </p>
      </GlassPanel>
    </main>
  );
}
