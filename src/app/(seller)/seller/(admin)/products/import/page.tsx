import Link from "next/link";
import { redirect } from "next/navigation";

import { GlassPanel } from "@/components/design-system";
import { buttonVariants } from "@/components/ui/button";
import { ImportProductFlow } from "@/features/import/import-product-flow";
import { getCurrentSellerStoreProfile } from "@/features/store/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductImportPage() {
  const storeResult = await getCurrentSellerStoreProfile();

  if (storeResult.status === "unauthenticated") {
    redirect("/seller/sign-in?from=/seller/products/import");
  }

  if (storeResult.status === "not_found") {
    return (
      <main>
        <GlassPanel className="p-5">
          <p className="text-sm text-foreground/60">Импорт товаров</p>
          <h1 className="mt-2 text-2xl font-semibold">Сначала создайте витрину</h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Импортированные черновики должны принадлежать вашей витрине. Создайте её, затем вернитесь к импорту.
          </p>
          <Link className={cn(buttonVariants(), "mt-5 w-full")} href="/seller/store">
            Создать витрину
          </Link>
        </GlassPanel>
      </main>
    );
  }

  if (storeResult.status === "error") {
    return (
      <main>
        <GlassPanel className="p-5" role="alert">
          <h1 className="text-2xl font-semibold">Не удалось загрузить витрину</h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Обновите страницу и попробуйте открыть импорт ещё раз.
          </p>
        </GlassPanel>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-foreground/60">Товары</p>
          <h1 className="mt-1 text-2xl font-semibold">Импорт товаров</h1>
        </div>
        <Link className={cn(buttonVariants({ variant: "secondary", size: "compact" }))} href="/seller/products">
          К товарам
        </Link>
      </div>
      <ImportProductFlow />
    </main>
  );
}
