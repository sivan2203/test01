import Link from "next/link";
import { redirect } from "next/navigation";

import { GlassPanel } from "@/components/design-system";
import { buttonVariants } from "@/components/ui/button";
import {
  AnalyticsSummaryError,
  AnalyticsSummaryWidget,
  StoreProfileError,
} from "@/features/analytics/analytics-summary-widget";
import { getSellerHomeAnalyticsSummary } from "@/features/analytics/seller-home-analytics";
import { getCurrentSellerStoreProfile } from "@/features/store/queries";

export const dynamic = "force-dynamic";

export default async function SellerHomePage() {
  const storeResult = await getCurrentSellerStoreProfile();

  if (storeResult.status === "unauthenticated") {
    redirect("/seller/sign-in?from=/seller");
  }

  if (storeResult.status === "not_found") {
    return (
      <main className="flex flex-col gap-4">
        <GlassPanel className="p-5">
          <p className="text-sm text-foreground/60">Первый вход</p>
          <h1 className="mt-2 text-2xl font-semibold">Начните с витрины</h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Создайте базовую витрину, чтобы опубликовать товары и получать первые сигналы от покупателей.
          </p>
          <Link className={buttonVariants({ className: "mt-5 w-full" })} href="/seller/store">
            Создать витрину
          </Link>
        </GlassPanel>
      </main>
    );
  }

  if (storeResult.status === "error") {
    return (
      <main className="flex flex-col gap-4">
        <StoreProfileError />
      </main>
    );
  }

  const summaryResult = await getSellerHomeAnalyticsSummary();

  if (summaryResult.status === "unauthenticated") {
    redirect("/seller/sign-in?from=/seller");
  }

  return (
    <main className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-foreground/60">Главная</p>
        <h1 className="mt-2 break-words text-2xl font-semibold">{storeResult.store.name}</h1>
      </div>
      {summaryResult.status === "found" ? (
        <AnalyticsSummaryWidget
          shareHref={storeResult.store.slug ? `/${storeResult.store.slug}` : "/seller/store"}
          shareLabel={storeResult.store.slug ? "Открыть витрину" : "Настроить публичную ссылку"}
          summary={summaryResult.summary}
        />
      ) : (
        <AnalyticsSummaryError />
      )}
    </main>
  );
}
