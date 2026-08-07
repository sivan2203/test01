import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import type {
  ProductAnalyticsPeriod,
  ProductAnalyticsSummary,
  SellerProductAnalyticsSummary,
} from "./product-analytics-summary";

const periodLabels: Record<ProductAnalyticsPeriod, string> = {
  today: "Сегодня",
  last_7_days: "Последние 7 дней",
};

const statusLabels: Record<ProductAnalyticsSummary["status"], string> = {
  draft: "Черновик",
  published: "Опубликован",
  hidden: "Скрыт",
};

function statusTone(status: ProductAnalyticsSummary["status"]) {
  if (status === "published") return "success" as const;
  if (status === "hidden") return "warning" as const;
  return "neutral" as const;
}

export function ProductAnalyticsSummaryView({ activePeriod, summary }: { activePeriod: ProductAnalyticsPeriod; summary: SellerProductAnalyticsSummary }) {
  const periodLabel = periodLabels[activePeriod];
  const totalViews = summary.products.reduce((total, product) => total + product.productViews, 0);
  const totalClicks = summary.products.reduce((total, product) => total + product.ctaClicks, 0);

  return (
    <div className="space-y-8">
      <header className="border-b border-border-strong pb-6">
        <p className="font-mono text-xs text-primary">АНАЛИТИКА / {activePeriod === "today" ? "01 ДЕНЬ" : "07 ДНЕЙ"}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Аналитика товаров</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">Наблюдаемые просмотры карточек и переходы в Telegram. Это не число отправленных сообщений или продаж.</p>
      </header>

      <nav aria-label="Период аналитики" className="flex gap-5 border-b border-border">
        {(Object.keys(periodLabels) as ProductAnalyticsPeriod[]).map((period) => {
          const active = period === activePeriod;
          return (
            <Link aria-current={active ? "page" : undefined} className={cn("relative inline-flex min-h-11 items-center text-sm font-semibold text-ink-secondary hover:text-foreground", active && "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary")} href={`/seller/analytics?period=${period}`} key={period}>
              {periodLabels[period]}
            </Link>
          );
        })}
      </nav>

      <section aria-label={`Сводка за период: ${periodLabel}`} className="grid gap-6 border-t-[3px] border-foreground py-6 sm:grid-cols-[minmax(0,1fr)_12rem_12rem] sm:items-end">
        <div>
          <p className="font-mono text-[clamp(3.5rem,9vw,6rem)] font-semibold leading-none tracking-[-0.07em] tabular-nums">{totalViews}</p>
          <p className="mt-2 text-sm text-ink-secondary">просмотров товаров · {periodLabel.toLowerCase()}</p>
        </div>
        <div className="border-t border-border pt-3 sm:border-t-0 sm:border-l sm:pl-5">
          <p className="font-mono text-2xl tabular-nums">{totalClicks}</p>
          <p className="mt-1 text-sm text-ink-secondary">переходов в Telegram</p>
        </div>
        <div className="border-t border-border pt-3 sm:border-t-0 sm:border-l sm:pl-5">
          <p className="font-mono text-2xl tabular-nums">{summary.products.length}</p>
          <p className="mt-1 text-sm text-ink-secondary">товаров в отчёте</p>
        </div>
      </section>

      {summary.products.length > 0 ? (
        <section aria-label={`Аналитика товаров за период: ${periodLabel}`}>
          <div className="hidden grid-cols-[minmax(0,1fr)_8rem_8rem_8rem] gap-4 border-y border-border py-2 font-mono text-[0.6875rem] text-ink-secondary md:grid">
            <span>Товар</span><span>Статус</span><span className="text-right">Просмотры</span><span className="text-right">Telegram</span>
          </div>
          {summary.products.map((product) => (
            <article aria-label={`Товар ${product.title}. Период: ${periodLabel}. Просмотры: ${product.productViews}. Переходы в Telegram: ${product.ctaClicks}. Статус: ${statusLabels[product.status]}.`} className="grid gap-3 border-b border-border py-4 md:grid-cols-[minmax(0,1fr)_8rem_8rem_8rem] md:items-center md:gap-4" key={product.productId}>
              <h2 className="break-words font-semibold">{product.title}</h2>
              <StatusBadge className="w-fit" tone={statusTone(product.status)}>{statusLabels[product.status]}</StatusBadge>
              <p className="font-mono text-lg tabular-nums md:text-right">{product.productViews}<span className="ml-2 text-xs text-ink-secondary md:hidden">просмотров</span></p>
              <p className="font-mono text-lg tabular-nums md:text-right">{product.ctaClicks}<span className="ml-2 text-xs text-ink-secondary md:hidden">переходов</span></p>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState action={<Link className={buttonVariants()} href="/seller/products/new">Добавить товар</Link>} description="После первого товара здесь появятся просмотры карточки и переходы в Telegram." eyebrow={`ПЕРИОД / ${periodLabel.toUpperCase()}`} title="Пока нет товаров для аналитики" />
      )}
    </div>
  );
}

export function ProductAnalyticsError({ period }: { period: ProductAnalyticsPeriod }) {
  return (
    <Alert titleAs="h1" tone="danger" title="Не удалось загрузить аналитику">
      <p>Нулевые значения не подменяют ошибку. Обновите запрос или попробуйте позже.</p>
      <Link className={`${buttonVariants({ variant: "secondary" })} mt-4`} href={`/seller/analytics?period=${period}`}>Обновить</Link>
    </Alert>
  );
}
