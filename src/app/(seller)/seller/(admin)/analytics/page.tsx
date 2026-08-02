import { redirect } from "next/navigation";

import { GlassPanel } from "@/components/design-system";
import {
  getSellerProductAnalyticsSummary,
  parseProductAnalyticsPeriod,
} from "@/features/analytics/product-analytics";
import {
  ProductAnalyticsError,
  ProductAnalyticsSummaryView,
} from "@/features/analytics/product-analytics-view";

export const dynamic = "force-dynamic";

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
      <main>
        <GlassPanel className="p-5">
          <p className="text-sm text-foreground/60">Аналитика товаров</p>
          <h1 className="mt-2 text-2xl font-semibold">Сначала создайте витрину</h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Создайте витрину, чтобы добавлять товары и видеть их аналитику.
          </p>
        </GlassPanel>
      </main>
    );
  }

  if (result.status === "error") {
    return <ProductAnalyticsError period={period} />;
  }

  return <ProductAnalyticsSummaryView activePeriod={period} summary={result.summary} />;
}
