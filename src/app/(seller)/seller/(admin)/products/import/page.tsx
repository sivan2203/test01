import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ImportProductFlow } from "@/features/import/import-product-flow";
import { getCurrentSellerStoreProfile } from "@/features/store/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Импорт товаров" };

export default async function ProductImportPage() {
  const storeResult = await getCurrentSellerStoreProfile();

  if (storeResult.status === "unauthenticated") {
    redirect("/seller/sign-in?from=/seller/products/import");
  }

  if (storeResult.status === "not_found") {
    return (
      <EmptyState
        action={<Link className={buttonVariants()} href="/seller/store">Создать витрину</Link>}
        description="Импортированные черновики должны принадлежать витрине. Создайте её, затем вернитесь к импорту."
        eyebrow="ИМПОРТ / НУЖЕН МАГАЗИН"
        title="Сначала создайте витрину"
        titleAs="h1"
      />
    );
  }

  if (storeResult.status === "error") {
    return (
      <Alert titleAs="h1" tone="danger" title="Не удалось загрузить витрину">
        Обновите страницу и попробуйте открыть импорт ещё раз.
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-4 border-b border-border-strong pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs text-primary">ТОВАРЫ / ИМПОРТ</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Импорт товаров</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">Проверьте структуру файла до создания черновиков.</p>
        </div>
        <Link className={cn(buttonVariants({ variant: "secondary", size: "compact" }))} href="/seller/products">
          К товарам
        </Link>
      </header>
      <ImportProductFlow />
    </div>
  );
}
