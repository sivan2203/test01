import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { ProductCreateWizard } from "@/features/product/product-create-wizard";
import { getInitialProductWizardDraftFormState } from "@/features/product/form-state";
import { getSellerProductMedia } from "@/features/product/media-queries";
import type { ProductMedia } from "@/features/product/media-schema";
import { getSellerProductById, type SellerProduct } from "@/features/product/queries";
import { PRODUCT_STATUS_DRAFT } from "@/features/product/schema";
import {
  PRODUCT_WIZARD_STEP_ID_BASICS,
  PRODUCT_WIZARD_STEP_ID_PHOTOS,
  PRODUCT_WIZARD_STEP_IDS,
  type ProductWizardStepId,
} from "@/features/product/product-wizard-state";
import { getCurrentSellerStoreProfile } from "@/features/store/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Новый товар" };

type NewProductDraftPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function getRequestedWizardStep(value: string | undefined) {
  return PRODUCT_WIZARD_STEP_IDS.includes(value as ProductWizardStepId)
    ? (value as ProductWizardStepId)
    : undefined;
}

function ProductLoadError() {
  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div className="border-b border-border pb-5">
        <p className="font-mono text-xs text-ink-secondary">ТОВАР / НОВЫЙ</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
          Не удалось загрузить черновик
        </h1>
      </div>
      <Alert titleAs="h2" tone="danger" title="Данные временно недоступны">
        Обновите страницу и попробуйте ещё раз. Пустая форма не заменяет уже
        сохранённый черновик.
      </Alert>
      <Link
        className={cn(buttonVariants({ variant: "secondary" }), "w-fit")}
        href="/seller/products"
      >
        К списку товаров
      </Link>
    </div>
  );
}

export default async function NewProductDraftPage({
  searchParams,
}: NewProductDraftPageProps) {
  const [storeResult, resolvedSearchParams] = await Promise.all([
    getCurrentSellerStoreProfile(),
    searchParams,
  ]);

  if (storeResult.status === "unauthenticated") {
    redirect("/seller/sign-in?from=/seller/products/new");
  }

  if (storeResult.status === "not_found") {
    return (
      <div className="flex max-w-3xl flex-col gap-5">
        <div className="border-b border-border pb-5">
          <p className="font-mono text-xs text-ink-secondary">ТОВАР / НОВЫЙ</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            Сначала создайте витрину
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-secondary">
            Товар должен принадлежать вашему магазину. Заполните профиль, затем
            вернитесь к созданию товара.
          </p>
        </div>
        <Link className={cn(buttonVariants(), "w-fit")} href="/seller/store">
          Создать витрину
        </Link>
      </div>
    );
  }

  if (storeResult.status === "error") return <ProductLoadError />;

  const requestedDraftId = getSingleSearchParam(resolvedSearchParams.draft);
  const requestedStep = getRequestedWizardStep(
    getSingleSearchParam(resolvedSearchParams.step),
  );
  let initialProduct: SellerProduct | null = null;
  let initialMedia: ProductMedia[] = [];
  let initialMediaError: string | undefined;
  let initialStepId: ProductWizardStepId = PRODUCT_WIZARD_STEP_ID_BASICS;

  if (requestedDraftId) {
    const productResult = await getSellerProductById(requestedDraftId);
    if (productResult.status === "unauthenticated") {
      redirect(
        `/seller/sign-in?from=/seller/products/new?draft=${encodeURIComponent(requestedDraftId)}`,
      );
    }
    if (
      productResult.status === "not_found" ||
      productResult.status === "store_not_found" ||
      (productResult.status === "found" &&
        productResult.product.status !== PRODUCT_STATUS_DRAFT)
    ) {
      notFound();
    }
    if (productResult.status === "error") return <ProductLoadError />;

    initialProduct = productResult.product;
    initialStepId = requestedStep ?? PRODUCT_WIZARD_STEP_ID_PHOTOS;

    const mediaResult = await getSellerProductMedia(initialProduct.id);
    if (mediaResult.status === "unauthenticated") {
      redirect(
        `/seller/sign-in?from=/seller/products/new?draft=${encodeURIComponent(initialProduct.id)}`,
      );
    }
    if (
      mediaResult.status === "not_found" ||
      mediaResult.status === "store_not_found"
    ) {
      notFound();
    }
    if (mediaResult.status === "found") initialMedia = mediaResult.media;
    else {
      initialMediaError =
        "Не удалось загрузить сохранённые фотографии. Обновите страницу перед публикацией.";
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-7">
      <header className="border-b border-border pb-6">
        <p className="font-mono text-xs text-ink-secondary">ТОВАР / НОВЫЙ</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          Добавить товар
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-secondary">
          Четыре коротких шага: основные сведения, продажа, фотографии и
          проверка перед публикацией.
        </p>
      </header>

      <ProductCreateWizard
        initialDraftState={getInitialProductWizardDraftFormState(initialProduct)}
        initialMedia={initialMedia}
        initialMediaError={initialMediaError}
        initialStepId={initialStepId}
      />
    </div>
  );
}
