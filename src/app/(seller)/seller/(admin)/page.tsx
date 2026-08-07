import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RetryButton } from "@/components/ui/retry-button";
import { getSellerHomeAnalyticsSummary } from "@/features/analytics/seller-home-analytics";
import { getSellerProducts } from "@/features/product/queries";
import { SellerDashboardView } from "@/features/seller-dashboard/seller-dashboard-view";
import { getCurrentSellerStoreProfile } from "@/features/store/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Обзор" };

export default async function SellerHomePage() {
  const storeResult = await getCurrentSellerStoreProfile();

  if (storeResult.status === "unauthenticated") redirect("/seller/sign-in?from=/seller");

  if (storeResult.status === "not_found") {
    return (
      <EmptyState
        action={<Link className={buttonVariants()} href="/seller/store">Создать витрину</Link>}
        description="Название, публичная ссылка и Telegram дадут основу, к которой можно привязать товары."
        eyebrow="ПЕРВЫЙ ВХОД / 01"
        title="Начните с профиля магазина"
        titleAs="h1"
      />
    );
  }

  if (storeResult.status === "error") {
    return <Alert titleAs="h1" tone="danger" title="Не удалось загрузить магазин">Обновите страницу или откройте настройки позже. Мы не показываем пустую витрину вместо ошибки.</Alert>;
  }

  const [summaryResult, productsResult] = await Promise.all([
    getSellerHomeAnalyticsSummary(),
    getSellerProducts(),
  ]);

  if (productsResult.status === "unauthenticated") redirect("/seller/sign-in?from=/seller");

  if (productsResult.status !== "found") {
    return (
      <Alert titleAs="h1" tone="danger" title="Не удалось загрузить товары">
        <p>Обновите страницу: мы не подменяем ошибку пустым каталогом.</p>
        <RetryButton className="mt-3">
          Повторить загрузку
        </RetryButton>
      </Alert>
    );
  }

  return (
    <SellerDashboardView
      analyticsFailed={summaryResult.status !== "found"}
      products={productsResult.products}
      store={storeResult.store}
      summary={summaryResult.status === "found" ? summaryResult.summary : undefined}
    />
  );
}
