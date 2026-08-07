import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSellerProductCovers } from "@/features/product/media-queries";
import { ProductCover } from "@/features/product/product-cover";
import {
  getProductStatusLabel,
  PRODUCT_STATUS_DELETED,
  type ProductStatus,
} from "@/features/product/lifecycle";
import {
  parseSellerProductListFilter,
  SELLER_PRODUCT_LIST_FILTERS,
  type SellerProductListFilter,
} from "@/features/product/product-list";
import { getSellerProducts } from "@/features/product/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Товары" };

type SellerProductsPageProps = {
  searchParams: Promise<{ status?: string | string[] }>;
};

const filterLabels: Record<SellerProductListFilter, string> = {
  all: "Все",
  draft: "Черновики",
  published: "Опубликованные",
  hidden: "Скрытые",
  deleted: "Архив",
};

function statusTone(status: ProductStatus) {
  if (status === "published") return "success" as const;
  if (status === "hidden") return "warning" as const;
  if (status === "deleted") return "danger" as const;
  return "neutral" as const;
}

export default async function SellerProductsPage({ searchParams }: SellerProductsPageProps) {
  const { status } = await searchParams;
  const activeFilter = parseSellerProductListFilter(status);
  const productsResult = await getSellerProducts(activeFilter);

  if (productsResult.status === "unauthenticated") redirect("/seller/sign-in?from=/seller/products");

  if (productsResult.status === "store_not_found") {
    return (
      <EmptyState
        action={<Link className={buttonVariants()} href="/seller/store">Создать витрину</Link>}
        description="Черновики привязываются к магазину. Сначала сохраните его профиль."
        eyebrow="ТОВАРЫ / НУЖЕН МАГАЗИН"
        title="Сначала создайте витрину"
        titleAs="h1"
      />
    );
  }

  if (productsResult.status === "error") {
    return <Alert titleAs="h1" tone="danger" title="Не удалось загрузить товары">Обновите страницу. Пустой список не подменяет ошибку загрузки.</Alert>;
  }

  const coversResult = await getSellerProductCovers(productsResult.products.map((product) => product.id));
  if (coversResult.status === "unauthenticated") redirect("/seller/sign-in?from=/seller/products");

  const covers = coversResult.status === "found" ? coversResult.covers : new Map<string, string>();
  const products = productsResult.products.map((product) => ({ ...product, coverUrl: covers.get(product.id) ?? null }));

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-5 border-b border-border-strong pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs text-primary">КАТАЛОГ / {String(products.length).padStart(2, "0")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Товары</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">Черновики не видны покупателям. Публикация всегда остаётся отдельным действием.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={buttonVariants({ variant: "secondary" })} href="/seller/products/import">Импорт</Link>
          <Link className={buttonVariants()} href="/seller/products/new">Добавить товар</Link>
        </div>
      </header>

      {coversResult.status === "error" ? (
        <Alert tone="warning" title="Обложки временно недоступны">Товары можно открыть и отредактировать без миниатюр.</Alert>
      ) : null}

      <nav aria-label="Фильтр товаров" className="flex flex-wrap gap-x-5 gap-y-2 border-b border-border">
        {SELLER_PRODUCT_LIST_FILTERS.map((filter) => {
          const active = filter === activeFilter;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex min-h-11 items-center text-sm font-semibold text-ink-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary",
              )}
              href={filter === "all" ? "/seller/products" : `/seller/products?status=${filter}`}
              key={filter}
            >
              {filterLabels[filter]}
            </Link>
          );
        })}
      </nav>

      {products.length > 0 ? (
        <section aria-label="Список товаров">
          <div className="hidden grid-cols-[minmax(0,1.2fr)_9rem_9rem_8rem] gap-5 border-y border-border py-2 font-mono text-[0.6875rem] text-ink-secondary md:grid">
            <span>Товар</span><span>Статус</span><span>Цена</span><span>Наличие</span>
          </div>
          {products.map((product) => {
            const archived = product.status === PRODUCT_STATUS_DELETED;
            const content = (
              <>
                <div className="flex min-w-0 items-center gap-3">
                  <ProductCover src={product.coverUrl} title={product.title} />
                  <div className="min-w-0">
                    <p className="break-words font-semibold">{product.title}</p>
                    <p className="mt-1 text-xs text-ink-secondary md:hidden">{product.priceLabel}</p>
                    {archived ? (
                      <p className="mt-1 text-xs text-ink-secondary">Архивный товар · редактор недоступен</p>
                    ) : null}
                  </div>
                </div>
                <StatusBadge className="w-fit" tone={statusTone(product.status)}>{getProductStatusLabel(product.status)}</StatusBadge>
                <p className="hidden font-mono text-sm md:block">{product.priceLabel}</p>
                <p className="text-sm text-ink-secondary">{product.availabilityStatus === "in_stock" ? "В наличии" : "Нет в наличии"}</p>
              </>
            );

            return archived ? (
              <article className="grid gap-3 border-b border-border py-4 text-ink-secondary md:grid-cols-[minmax(0,1.2fr)_9rem_9rem_8rem] md:items-center md:gap-5" key={product.id}>{content}</article>
            ) : (
              <Link className="grid gap-3 border-b border-border py-4 transition-colors hover:bg-surface-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:grid-cols-[minmax(0,1.2fr)_9rem_9rem_8rem] md:items-center md:gap-5" href={`/seller/products/${product.id}/edit`} key={product.id}>{content}</Link>
            );
          })}
        </section>
      ) : (
        <EmptyState
          action={
            activeFilter === "all" ? (
              <Link className={buttonVariants()} href="/seller/products/new">Добавить товар</Link>
            ) : (
              <Link className={buttonVariants({ variant: "secondary" })} href="/seller/products">Сбросить фильтр</Link>
            )
          }
          description={activeFilter === "all" ? "Создайте черновик, добавьте фото и проверьте карточку перед публикацией." : "Выберите другой статус или сбросьте фильтр — это не первый запуск."}
          eyebrow={activeFilter === "all" ? "ПЕРВЫЙ ТОВАР" : "ФИЛЬТР ПУСТ"}
          title={activeFilter === "all" ? "Пока нет товаров" : `В разделе «${filterLabels[activeFilter]}» ничего нет`}
        />
      )}
    </div>
  );
}
