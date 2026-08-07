import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublishedPublicCatalogItemsForStore } from "@/features/store/public-catalog";
import { getCurrentSellerStoreProfile } from "@/features/store/queries";
import { PublicStorefrontShell } from "@/features/store/public-storefront-shell";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Предпросмотр витрины" };

export default async function SellerStorePreviewPage() {
  const storeResult = await getCurrentSellerStoreProfile();

  if (storeResult.status === "unauthenticated") {
    redirect("/seller/sign-in?from=/seller/store/preview");
  }

  if (storeResult.status === "error") {
    throw new Error("Seller store preview lookup failed.");
  }

  if (storeResult.status === "not_found") {
    return (
      <EmptyState
        action={<Link className={buttonVariants()} href="/seller/store">Вернуться к настройкам</Link>}
        description="Предпросмотр показывает публичную витрину глазами покупателя и станет доступен после первичной настройки."
        eyebrow="МАГАЗИН / ПРЕДПРОСМОТР"
        title="Сначала создайте магазин"
        titleAs="h1"
      />
    );
  }

  const { store } = storeResult;

  if (!store.slug) {
    return (
      <EmptyState
        action={<Link className={buttonVariants()} href="/seller/store">Вернуться к настройкам</Link>}
        description="Сохраните короткую публичную ссылку, чтобы проверить именно ту витрину, которой вы делитесь с покупателями."
        eyebrow="МАГАЗИН / ПУБЛИЧНАЯ ССЫЛКА"
        title="Настройте публичную ссылку"
        titleAs="h1"
      />
    );
  }

  const catalogItems = await getPublishedPublicCatalogItemsForStore(store.slug);
  const buyerFacingStore = {
    slug: store.slug,
    name: store.name,
    avatarUrl: store.avatarUrl,
    contactConfigured: Boolean(store.telegramUsername),
    description: store.description,
    additionalInfo: store.additionalInfo,
  };

  return (
    <PublicStorefrontShell
      catalogItems={catalogItems}
      isPreview
      store={buyerFacingStore}
      previewIndicator={
        <span>
          Режим предпросмотра: покупатели не видят эту плашку, просмотры не
          попадают в аналитику.
        </span>
      }
      returnAction={
        <Link
          className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
          href="/seller/store"
        >
          Вернуться к настройкам магазина
        </Link>
      }
    />
  );
}
