import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { RetryButton } from "@/components/ui/retry-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { sourceLabel } from "@/features/analytics/source-attribution";
import type { SellerHomeAnalyticsSummary } from "@/features/analytics/seller-home-summary";
import { getProductStatusLabel, type ProductStatus } from "@/features/product/lifecycle";
import type { SellerProduct } from "@/features/product/queries";
import type { SellerStoreProfile } from "@/features/store/queries";
import { cn } from "@/lib/utils";

type SellerDashboardViewProps = {
  store: SellerStoreProfile;
  products: SellerProduct[];
  summary?: SellerHomeAnalyticsSummary;
  analyticsFailed?: boolean;
};

function statusTone(status: ProductStatus) {
  if (status === "published") return "success" as const;
  if (status === "hidden") return "warning" as const;
  return "neutral" as const;
}

export function SellerDashboardView({
  store,
  products,
  summary,
  analyticsFailed = false,
}: SellerDashboardViewProps) {
  const drafts = products.filter((product) => product.status === "draft").length;
  const published = products.filter((product) => product.status === "published").length;
  const outOfStock = products.filter((product) => product.availabilityStatus === "out_of_stock").length;
  const tasks = [
    !store.slug
      ? { title: "Нет публичной ссылки", note: "Выберите короткий адрес витрины.", href: "/seller/store#public-link", action: "Настроить" }
      : null,
    !store.telegramUsername
      ? { title: "Telegram не подключён", note: "Покупатель пока не сможет связаться о товаре.", href: "/seller/store#contact", action: "Подключить" }
      : null,
    !store.description
      ? { title: "Не заполнено описание витрины", note: "Добавьте одну строку о магазине.", href: "/seller/store#about", action: "Добавить" }
      : null,
    drafts > 0
      ? { title: `${drafts} ${drafts === 1 ? "черновик ждёт" : "черновика ждут"} проверки`, note: "Черновики не видны покупателям.", href: "/seller/products?status=draft", action: "Проверить" }
      : null,
    outOfStock > 0
      ? { title: `${outOfStock} ${outOfStock === 1 ? "товар закончился" : "товара закончились"}`, note: "Проверьте наличие или скройте товар.", href: "/seller/products", action: "Открыть" }
      : null,
  ].filter((task): task is NonNullable<typeof task> => Boolean(task)).slice(0, 4);

  const topSource = summary?.topSource ? sourceLabel(summary.topSource) : "Пока нет данных";
  const conversion = summary && summary.productViews > 0
    ? Math.round((summary.ctaClicks / summary.productViews) * 1000) / 10
    : 0;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-5 border-b border-border-strong pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs text-primary">СВОДКА / СЕГОДНЯ</p>
          <h1 className="mt-2 break-words text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            {store.name}
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">
            {published} опубликовано · {drafts} в черновиках
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {store.slug ? (
            <Link className={buttonVariants({ variant: "secondary" })} href={`/${store.slug}`}>
              Посмотреть витрину
            </Link>
          ) : null}
          <Link className={buttonVariants()} href="/seller/products/new">
            Добавить товар
          </Link>
        </div>
      </header>

      {analyticsFailed ? (
        <Alert tone="warning" title="Аналитика временно недоступна">
          <p>Товары и настройки работают. Нулевые значения не подменяют ошибку загрузки.</p>
          <RetryButton className="mt-3">
            Обновить данные
          </RetryButton>
        </Alert>
      ) : null}

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <section aria-labelledby="signal-heading">
          <div className="flex items-baseline justify-between gap-4 border-t-[3px] border-foreground py-3">
            <h2 className="text-xl font-semibold" id="signal-heading">Сигнал витрины</h2>
            <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline" href="/seller/analytics">
              Вся аналитика →
            </Link>
          </div>
          <div className="grid gap-5 border-b border-border py-7 sm:grid-cols-2 sm:items-end">
            <div>
              <p className="font-mono text-[clamp(3.5rem,10vw,6rem)] font-semibold leading-none tracking-[-0.07em] tabular-nums">
                {summary?.storeViews ?? 0}
              </p>
              <p className="mt-2 text-sm text-ink-secondary">просмотров витрины сегодня</p>
            </div>
            <div className="text-sm leading-6 text-ink-secondary">
              <strong className="block text-foreground">Лучший источник — {topSource}</strong>
              {summary?.storeViews ? `${summary.productViews} просмотров товаров` : "Поделитесь ссылкой, чтобы увидеть первый сигнал."}
            </div>
          </div>
          {[
            ["Просмотры товаров", summary?.productViews ?? 0, "сегодня"],
            ["Переходы в Telegram", summary?.ctaClicks ?? 0, "сегодня"],
            ["Просмотр → контакт", `${conversion}%`, "наблюдаемая"],
          ].map(([label, value, meta]) => (
            <div className="grid min-h-14 grid-cols-[1fr_auto] items-center gap-4 border-b border-border py-3 sm:grid-cols-[1fr_8rem_8rem]" key={label}>
              <span className="text-sm text-ink-secondary">{label}</span>
              <span className="text-right font-mono text-lg tabular-nums">{value}</span>
              <span className="hidden text-right font-mono text-[0.6875rem] text-ink-secondary sm:block">{meta}</span>
            </div>
          ))}
        </section>

        <section aria-labelledby="attention-heading">
          <div className="flex items-baseline justify-between gap-4 border-t-[3px] border-foreground py-3">
            <h2 className="text-xl font-semibold" id="attention-heading">Требует внимания</h2>
            <span className="font-mono text-xs text-primary">{String(tasks.length).padStart(2, "0")}</span>
          </div>
          {tasks.length > 0 ? (
            <ol>
              {tasks.map((task, index) => (
                <li className="grid grid-cols-[2rem_1fr] gap-3 border-b border-border py-4" key={task.title}>
                  <span className="font-mono text-[0.6875rem] text-ink-secondary">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="font-semibold">{task.title}</p>
                    <p className="mt-1 text-sm leading-5 text-ink-secondary">{task.note}</p>
                    <Link className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline" href={task.href}>
                      {task.action} →
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="border-b border-border py-6 text-sm leading-6 text-ink-secondary">
              Базовая настройка завершена. Следите за наличием и новыми сигналами.
            </p>
          )}
        </section>
      </div>

      <section aria-labelledby="recent-products-heading">
        <div className="flex items-baseline justify-between gap-4 border-t-[3px] border-foreground py-3">
          <h2 className="text-xl font-semibold" id="recent-products-heading">Последние товары</h2>
          <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline" href="/seller/products">Все товары →</Link>
        </div>
        {products.length > 0 ? (
          <div>
            <div className="hidden grid-cols-[minmax(0,1fr)_8rem_9rem_5rem] gap-4 border-b border-border py-2 font-mono text-[0.6875rem] text-ink-secondary md:grid">
              <span>Товар</span><span>Статус</span><span>Цена</span><span></span>
            </div>
            {products.slice(0, 5).map((product) => (
              <article className="grid gap-3 border-b border-border py-4 md:grid-cols-[minmax(0,1fr)_8rem_9rem_5rem] md:items-center md:gap-4" key={product.id}>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{product.title}</p>
                  <p className="mt-1 text-sm text-ink-secondary">{product.availabilityStatus === "in_stock" ? "В наличии" : "Нет в наличии"}</p>
                </div>
                <StatusBadge className="w-fit" tone={statusTone(product.status)}>{getProductStatusLabel(product.status)}</StatusBadge>
                <p className="font-mono text-sm">{product.priceLabel}</p>
                <Link className={cn(buttonVariants({ variant: "ghost", size: "compact" }), "justify-start md:justify-center")} href={`/seller/products/${product.id}/edit`}>
                  Открыть
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="border-b border-border py-8">
            <p className="font-semibold">Пока нет товаров</p>
            <p className="mt-2 text-sm text-ink-secondary">Добавьте первый черновик и опубликуйте его после проверки.</p>
          </div>
        )}
      </section>
    </div>
  );
}
