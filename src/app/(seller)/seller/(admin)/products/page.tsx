import Link from "next/link";
import { redirect } from "next/navigation";

import { GlassPanel } from "@/components/design-system";
import { buttonVariants } from "@/components/ui/button";
import { getProductStatusLabel } from "@/features/product/lifecycle";
import { getSellerProducts } from "@/features/product/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function availabilityLabel(status: "in_stock" | "out_of_stock") {
  return status === "in_stock" ? "В наличии" : "Нет в наличии";
}

export default async function SellerProductsPage() {
  const productsResult = await getSellerProducts();

  if (productsResult.status === "unauthenticated") {
    redirect("/seller/sign-in?from=/seller/products");
  }

  if (productsResult.status === "store_not_found") {
    return (
      <main className="flex flex-col gap-4">
        <GlassPanel className="p-5">
          <p className="text-sm text-foreground/60">Товары</p>
          <h1 className="mt-2 text-2xl font-semibold">Сначала создайте витрину</h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Черновики товаров привязываются к вашему магазину. Заполните профиль,
            а затем вернитесь к добавлению товаров.
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

  if (productsResult.status === "error") {
    return (
      <main>
        <GlassPanel className="p-5" role="alert">
          <p className="text-sm text-foreground/60">Товары</p>
          <h1 className="mt-2 text-2xl font-semibold">Не удалось загрузить товары</h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Обновите страницу или попробуйте позже. Мы не показываем пустой список,
            когда не уверены, что данные загрузились корректно.
          </p>
        </GlassPanel>
      </main>
    );
  }

  const hasProducts = productsResult.products.length > 0;

  return (
    <main className="flex flex-col gap-4">
      <GlassPanel className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-foreground/60">Товары</p>
            <h1 className="mt-2 text-2xl font-semibold">Товары</h1>
          </div>
          <Link
            className={cn(buttonVariants({ size: "compact" }), "shrink-0")}
            href="/seller/products/new"
          >
            Добавить
          </Link>
        </div>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Создавайте карточки быстро: название, цена, наличие и описание. Статус
          товара можно изменить отдельно в редакторе.
        </p>
      </GlassPanel>

      {hasProducts ? (
        <section className="flex flex-col gap-3" aria-label="Список товаров">
          {productsResult.products.map((product) => (
            <Link
              className="block rounded-2xl border border-border bg-glass p-4 text-foreground shadow-sm backdrop-blur-xl transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={`/seller/products/${product.id}/edit`}
              key={product.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-base font-semibold">
                    {product.title}
                  </p>
                  <p className="mt-2 text-sm text-foreground/65">
                    {product.priceLabel} · {availabilityLabel(product.availabilityStatus)}
                  </p>
                </div>
                <span className="rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-foreground/70">
                  {getProductStatusLabel(product.status)}
                </span>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <GlassPanel className="p-5">
          <h2 className="text-xl font-semibold">Пока нет товаров</h2>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Добавьте первый черновик. Его можно спокойно проверить и поправить
            перед будущей публикацией.
          </p>
          <Link
            className={cn(buttonVariants(), "mt-5 w-full")}
            href="/seller/products/new"
          >
            Добавить товар
          </Link>
        </GlassPanel>
      )}
    </main>
  );
}
