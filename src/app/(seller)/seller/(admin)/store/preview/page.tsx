import Link from "next/link";
import { redirect } from "next/navigation";

import { GlassPanel } from "@/components/design-system";
import { buttonVariants } from "@/components/ui/button";
import { getPublishedPublicCatalogItemsForStore } from "@/features/store/public-catalog";
import { getCurrentSellerStoreProfile } from "@/features/store/queries";
import { PublicStorefrontShell } from "@/features/store/public-storefront-shell";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
        <GlassPanel className="p-5">
          <p className="text-sm text-foreground/60">Предпросмотр витрины</p>
          <h1 className="mt-2 text-2xl font-semibold">
            Сначала создайте магазин
          </h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Предпросмотр показывает вашу публичную витрину глазами покупателя.
            Он станет доступен после первичной настройки магазина.
          </p>
          <Link
            className={cn(buttonVariants({ variant: "primary" }), "mt-5 w-full")}
            href="/seller/store"
          >
            Вернуться к настройкам
          </Link>
        </GlassPanel>
      </main>
    );
  }

  const { store } = storeResult;

  if (!store.slug) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-6">
        <GlassPanel className="p-5">
          <p className="text-sm text-foreground/60">Предпросмотр витрины</p>
          <h1 className="mt-2 text-2xl font-semibold">
            Настройте публичную ссылку
          </h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Чтобы открыть режим покупателя, сохраните короткую публичную ссылку
            магазина. Так предпросмотр будет проверять ту же витрину, которой вы
            делитесь в соцсетях.
          </p>
          <Link
            className={cn(buttonVariants({ variant: "primary" }), "mt-5 w-full")}
            href="/seller/store"
          >
            Вернуться к настройкам
          </Link>
        </GlassPanel>
      </main>
    );
  }

  const catalogItems = await getPublishedPublicCatalogItemsForStore(store.slug);
  const buyerFacingStore = {
    slug: store.slug,
    name: store.name,
    avatarUrl: store.avatarUrl,
    description: store.description,
    additionalInfo: store.additionalInfo,
  };

  return (
    <PublicStorefrontShell
      catalogItems={catalogItems}
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
