import Link from "next/link";
import { redirect } from "next/navigation";

import { GlassPanel } from "@/components/design-system";
import { buttonVariants } from "@/components/ui/button";
import { getInitialProductDraftFormState } from "@/features/product/form-state";
import { ProductForm } from "@/features/product/product-form";
import { getCurrentSellerStoreProfile } from "@/features/store/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewProductDraftPage() {
  const storeResult = await getCurrentSellerStoreProfile();

  if (storeResult.status === "unauthenticated") {
    redirect("/seller/sign-in?from=/seller/products/new");
  }

  if (storeResult.status === "not_found") {
    return (
      <main className="flex flex-col gap-4">
        <GlassPanel className="p-5">
          <p className="text-sm text-foreground/60">Новый товар</p>
          <h1 className="mt-2 text-2xl font-semibold">Сначала создайте витрину</h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Товар должен принадлежать вашему магазину. Создайте профиль витрины,
            затем вернитесь к черновику.
          </p>
          <Link
            className={cn(buttonVariants(), "mt-5 w-full")}
            href="/seller/store"
          >
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
          <p className="text-sm text-foreground/60">Новый товар</p>
          <h1 className="mt-2 text-2xl font-semibold">Не удалось загрузить магазин</h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Обновите страницу и попробуйте ещё раз. Мы не создаём черновик, пока
            не можем безопасно определить владельца магазина.
          </p>
        </GlassPanel>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4">
      <GlassPanel className="p-5">
        <p className="text-sm text-foreground/60">Новый товар</p>
        <h1 className="mt-2 text-2xl font-semibold">Создать черновик</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Заполните минимум: название, цену, наличие и описание. Фотографии и
          публикация появятся в следующих шагах.
        </p>
      </GlassPanel>

      <GlassPanel className="p-5">
        <ProductForm initialState={getInitialProductDraftFormState(null)} />
      </GlassPanel>
    </main>
  );
}
