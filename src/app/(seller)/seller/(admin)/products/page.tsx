import Link from "next/link";
import { redirect } from "next/navigation";

import { GlassPanel } from "@/components/design-system";
import { buttonVariants } from "@/components/ui/button";
import { getSellerProductCovers } from "@/features/product/media-queries";
import { ProductCover } from "@/features/product/product-cover";
import {
  getProductStatusLabel,
  PRODUCT_STATUS_DELETED,
  type ProductStatus,
} from "@/features/product/lifecycle";
import {
  getSellerProducts,
} from "@/features/product/queries";
import {
  parseSellerProductListFilter,
  SELLER_PRODUCT_LIST_FILTERS,
  getSellerProductCardState,
  type SellerProductListFilter,
} from "@/features/product/product-list";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SellerProductsPageProps = {
  searchParams: Promise<{
    status?: string | string[];
  }>;
};

const filterLabels: Record<SellerProductListFilter, string> = {
  all: "Все",
  draft: "Черновики",
  published: "Опубликованные",
  hidden: "Скрытые",
  deleted: "Архив",
};

function availabilityLabel(status: "in_stock" | "out_of_stock") {
  return status === "in_stock" ? "В наличии" : "Нет в наличии";
}

function productCardContent(product: {
  id: string;
  title: string;
  coverUrl: string | null;
  priceLabel: string;
  availabilityStatus: "in_stock" | "out_of_stock";
  status: ProductStatus;
}) {
  return (
    <>
      <ProductCover src={product.coverUrl} title={product.title} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="break-words text-base font-semibold">{product.title}</p>
          <span className="shrink-0 rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-foreground/70">
            {getProductStatusLabel(product.status)}
          </span>
        </div>
        <p className="mt-2 text-sm text-foreground/65">
          {product.priceLabel} · {availabilityLabel(product.availabilityStatus)}
        </p>
        {product.status === PRODUCT_STATUS_DELETED ? (
          <p className="mt-2 text-xs text-foreground/55">
            Архивный товар · редактор недоступен
          </p>
        ) : null}
      </div>
    </>
  );
}

export default async function SellerProductsPage({
  searchParams,
}: SellerProductsPageProps) {
  const { status } = await searchParams;
  const activeFilter = parseSellerProductListFilter(status);
  const productsResult = await getSellerProducts(activeFilter);

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
            Черновики товаров привязываются к вашей витрине. Заполните профиль, а затем вернитесь к добавлению товаров.
          </p>
          <Link className={cn(buttonVariants(), "mt-5 w-full")} href="/seller/store">
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
            Обновите страницу или попробуйте позже. Мы не показываем пустой список, когда не уверены, что данные загрузились корректно.
          </p>
        </GlassPanel>
      </main>
    );
  }

  const coversResult = await getSellerProductCovers(
    productsResult.products.map((product) => product.id),
  );

  if (coversResult.status === "unauthenticated") {
    redirect("/seller/sign-in?from=/seller/products");
  }

  if (coversResult.status === "store_not_found") {
    return (
      <main className="flex flex-col gap-4">
        <GlassPanel className="p-5">
          <p className="text-sm text-foreground/60">Товары</p>
          <h1 className="mt-2 text-2xl font-semibold">Сначала создайте витрину</h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Витрина больше не найдена. Проверьте профиль магазина и вернитесь к товарам.
          </p>
          <Link className={cn(buttonVariants(), "mt-5 w-full")} href="/seller/store">
            Открыть настройки витрины
          </Link>
        </GlassPanel>
      </main>
    );
  }

  const covers = coversResult.status === "found" ? coversResult.covers : new Map<string, string>();
  const coversLoadError = coversResult.status === "error";

  const products = productsResult.products.map((product) => ({
    ...product,
    coverUrl: covers.get(product.id) ?? null,
  }));
  const hasProducts = products.length > 0;

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
          Находите товары по статусу, открывайте редактор и продолжайте работу с телефона.
        </p>
      </GlassPanel>

      {coversLoadError ? (
        <p className="rounded-2xl border border-dashed border-border p-4 text-sm leading-6 text-foreground/70" role="status">
          Обложки временно недоступны. Список товаров можно открыть и отредактировать без фотографий.
        </p>
      ) : null}

      <nav aria-label="Фильтр товаров" className="flex flex-wrap gap-2">
        {SELLER_PRODUCT_LIST_FILTERS.map((filter) => {
          const href = filter === "all" ? "/seller/products" : `/seller/products?status=${filter}`;
          const isActive = filter === activeFilter;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                buttonVariants({
                  size: "compact",
                  variant: isActive ? "primary" : "secondary",
                }),
              )}
              href={href}
              key={filter}
            >
              {filterLabels[filter]}
            </Link>
          );
        })}
      </nav>

      {hasProducts ? (
        <section className="flex flex-col gap-3" aria-label="Список товаров">
          {products.map((product) => {
            const content = productCardContent(product);
            const cardState = getSellerProductCardState(product.status, product.coverUrl);

            return cardState.isArchived ? (
              <article
                className="flex items-start gap-3 rounded-2xl border border-border bg-glass p-4 text-foreground shadow-sm backdrop-blur-xl"
                key={product.id}
              >
                {content}
              </article>
            ) : (
              <Link
                className="flex items-start gap-3 rounded-2xl border border-border bg-glass p-4 text-foreground shadow-sm backdrop-blur-xl transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                href={`/seller/products/${product.id}/edit`}
                key={product.id}
              >
                {content}
              </Link>
            );
          })}
        </section>
      ) : (
        <GlassPanel className="p-5">
          <h2 className="text-xl font-semibold">
            {activeFilter === "all" ? "Пока нет товаров" : `В фильтре «${filterLabels[activeFilter]}» пока нет товаров`}
          </h2>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            {activeFilter === "all"
              ? "Добавьте первый черновик. Его можно спокойно проверить и поправить перед публикацией."
              : "Попробуйте выбрать другой фильтр или продолжите с новым товаром."}
          </p>
          <Link className={cn(buttonVariants(), "mt-5 w-full")} href="/seller/products/new">
            Добавить товар
          </Link>
        </GlassPanel>
      )}
    </main>
  );
}
