import type { Metadata } from "next";
import { redirect } from "next/navigation";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getSellerProductAnalyticsSummary,
  parseProductAnalyticsPeriod,
} from "@/features/analytics/product-analytics";
import {
  ProductAnalyticsError,
  ProductAnalyticsSummaryView,
} from "@/features/analytics/product-analytics-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Аналитика" };

type SellerAnalyticsPageProps = {
  searchParams: Promise<{
    period?: string | string[];
  }>;
};

export default async function SellerAnalyticsPage({
  searchParams,
}: SellerAnalyticsPageProps) {
  const query = await searchParams;
  const rawPeriod = Array.isArray(query.period) ? query.period[0] : query.period;
  const period = parseProductAnalyticsPeriod(rawPeriod);
  const result = await getSellerProductAnalyticsSummary(period);

  if (result.status === "unauthenticated") {
    redirect("/seller/sign-in?from=/seller/analytics");
  }

  if (result.status === "store_not_found") {
    return (
      <EmptyState action={<Link className={buttonVariants()} href="/seller/store">Создать витрину</Link>} description="После настройки можно добавлять товары и видеть их просмотры." eyebrow="АНАЛИТИКА / НУЖЕН МАГАЗИН" title="Сначала создайте витрину" titleAs="h1" />
    );
  }

  if (result.status === "error") {
    return <ProductAnalyticsError period={period} />;
  }

  return <ProductAnalyticsSummaryView activePeriod={period} summary={result.summary} />;
}
