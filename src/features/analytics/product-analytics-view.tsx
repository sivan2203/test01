import Link from "next/link";

import { GlassPanel } from "@/components/design-system";
import { buttonVariants } from "@/components/ui/button";
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-surface-raised p-4">
      <p className="text-sm text-foreground/65">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ProductAnalyticsCard({
  product,
  periodLabel,
}: {
  product: ProductAnalyticsSummary;
  periodLabel: string;
}) {
  const accessibleLabel = `Товар ${product.title}. Период: ${periodLabel}. Просмотры: ${product.productViews}. Переходы в Telegram: ${product.ctaClicks}. Статус: ${statusLabels[product.status]}.`;

  return (
    <article
      aria-label={accessibleLabel}
      className="min-w-0 rounded-2xl border border-border bg-glass p-4 text-foreground shadow-sm backdrop-blur-xl motion-reduce:backdrop-blur-none forced-colors:backdrop-blur-none"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-base font-semibold">{product.title}</h3>
        <span className="shrink-0 rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-foreground/70">
          {statusLabels[product.status]}
        </span>
      </div>
      <p className="mt-2 text-sm text-foreground/65">Период: {periodLabel}</p>
      <div className="mt-4 grid min-w-0 grid-cols-2 gap-3">
        <Metric label="Просмотры" value={product.productViews} />
        <Metric label="Переходы в Telegram" value={product.ctaClicks} />
      </div>
    </article>
  );
}

export function ProductAnalyticsSummaryView({
  activePeriod,
  summary,
}: {
  activePeriod: ProductAnalyticsPeriod;
  summary: SellerProductAnalyticsSummary;
}) {
  const periodLabel = periodLabels[activePeriod];

  return (
    <main className="flex flex-col gap-4">
      <GlassPanel className="p-5">
        <p className="text-sm text-foreground/60">Аналитика</p>
        <h1 className="mt-2 break-words text-2xl font-semibold">Аналитика товаров</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Просмотры карточек и переходы в Telegram по каждому товару.
        </p>
      </GlassPanel>

      <nav aria-label="Период аналитики" className="flex flex-wrap gap-2">
        {(Object.keys(periodLabels) as ProductAnalyticsPeriod[]).map((period) => {
          const isActive = period === activePeriod;
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={buttonVariants({
                className: "min-h-11",
                variant: isActive ? "primary" : "secondary",
              })}
              href={`/seller/analytics?period=${period}`}
              key={period}
            >
              {periodLabels[period]}
            </Link>
          );
        })}
      </nav>

      {summary.products.length > 0 ? (
        <section
          aria-label={`Аналитика товаров за период: ${periodLabel}`}
          className="flex min-w-0 flex-col gap-3"
        >
          <p className="text-sm text-foreground/65">Период: {periodLabel}</p>
          {summary.products.map((product) => (
            <ProductAnalyticsCard
              key={product.productId}
              periodLabel={periodLabel}
              product={product}
            />
          ))}
        </section>
      ) : (
        <GlassPanel className="p-5" role="status">
          <h2 className="text-xl font-semibold">Пока нет товаров для аналитики</h2>
          <p className="mt-3 text-sm text-foreground/65">Период: {periodLabel}</p>
          <p className="mt-2 text-sm leading-6 text-foreground/70">
            Добавьте товар, чтобы отслеживать его просмотры и переходы в Telegram.
          </p>
          <Link className={buttonVariants({ className: "mt-5 w-full" })} href="/seller/products/new">
            Добавить товар
          </Link>
        </GlassPanel>
      )}
    </main>
  );
}

export function ProductAnalyticsError({ period }: { period: ProductAnalyticsPeriod }) {
  return (
    <main>
      <GlassPanel className="p-5" role="alert">
        <p className="text-sm text-foreground/60">Аналитика товаров</p>
        <h1 className="mt-2 text-2xl font-semibold">Не удалось загрузить аналитику</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Обновите страницу или попробуйте позже. Мы не показываем нулевые значения,
          пока не уверены, что данные загрузились корректно.
        </p>
        <Link
          className={buttonVariants({ className: "mt-4 w-full" })}
          href={`/seller/analytics?period=${period}`}
        >
          Обновить
        </Link>
      </GlassPanel>
    </main>
  );
}
