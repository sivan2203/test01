"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { GlassPanel } from "@/components/design-system";
import { buttonVariants } from "@/components/ui/button";
import { sourceLabel } from "./source-attribution";
import type { SellerHomeAnalyticsSummary } from "./seller-home-summary";

type AnalyticsSummaryWidgetProps = {
  summary: SellerHomeAnalyticsSummary;
  shareHref: string;
  shareLabel: string;
};

function AnalyticsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-4">
      <p className="text-sm text-foreground/65">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function AnalyticsSummaryWidget({
  summary,
  shareHref,
  shareLabel,
}: AnalyticsSummaryWidgetProps) {
  const isZeroState =
    summary.storeViews === 0 &&
    summary.productViews === 0 &&
    summary.ctaClicks === 0;
  const topSourceLabel = summary.topSource
    ? sourceLabel(summary.topSource)
    : "Пока нет данных";
  const accessibleSummary = `Просмотры магазина сегодня: ${summary.storeViews}. Просмотры товаров: ${summary.productViews}. Переходы в Telegram: ${summary.ctaClicks}. Лучший источник: ${topSourceLabel}.`;

  return (
    <section aria-label={accessibleSummary} className="flex flex-col gap-3">
      <GlassPanel className="p-5">
        <p className="text-sm text-foreground/60">Аналитика за сегодня</p>
        <h2 className="mt-2 text-xl font-semibold">Сигнал витрины</h2>

        <div className="mt-5 rounded-2xl border border-border bg-surface-raised p-5">
          <p className="text-sm text-foreground/65">Просмотры магазина сегодня</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">
            {summary.storeViews}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <AnalyticsCard label="Просмотры товаров" value={summary.productViews} />
          <AnalyticsCard label="Переходы в Telegram" value={summary.ctaClicks} />
        </div>

        <div className="mt-3 rounded-2xl border border-border p-4">
          <p className="text-sm text-foreground/65">Лучший источник</p>
          <p className="mt-2 break-words font-medium">{topSourceLabel}</p>
        </div>

        {isZeroState ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-4" role="status">
            <p className="text-sm leading-6 text-foreground/70">
              Сегодня пока нет просмотров. Поделитесь ссылкой на витрину, чтобы увидеть первый сигнал.
            </p>
            <Link className={buttonVariants({ className: "mt-4 w-full" })} href={shareHref}>
              {shareLabel}
            </Link>
          </div>
        ) : null}
      </GlassPanel>
    </section>
  );
}

export function AnalyticsSummaryError() {
  const router = useRouter();

  return (
    <GlassPanel className="p-5" role="alert">
      <p className="text-sm text-foreground/60">Аналитика за сегодня</p>
      <h2 className="mt-2 text-xl font-semibold">Не удалось загрузить аналитику</h2>
      <p className="mt-3 text-sm leading-6 text-foreground/70">
        Обновите страницу или попробуйте позже. Мы не показываем нулевые значения, пока не уверены, что данные загрузились корректно.
      </p>
      <button
        className={buttonVariants({ className: "mt-4 w-full" })}
        onClick={() => router.refresh()}
        type="button"
      >
        Обновить
      </button>
    </GlassPanel>
  );
}

export function StoreProfileError() {
  return (
    <GlassPanel className="p-5" role="alert">
      <p className="text-sm text-foreground/60">Профиль магазина</p>
      <h1 className="mt-2 text-xl font-semibold">Не удалось загрузить магазин</h1>
      <p className="mt-3 text-sm leading-6 text-foreground/70">
        Обновите страницу или откройте настройки магазина, чтобы повторить запрос.
      </p>
      <Link className={buttonVariants({ className: "mt-4 w-full" })} href="/seller/store">
        Открыть настройки
      </Link>
    </GlassPanel>
  );
}
