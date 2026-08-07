import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { Alert } from "@/components/ui/alert";
import { getInitialProductDraftFormState } from "@/features/product/form-state";
import { ProductMediaManager } from "@/features/product/product-media-manager";
import { ProductLifecycleProvider } from "@/features/product/product-lifecycle-context";
import { ProductForm } from "@/features/product/product-form";
import { ProductStateControl } from "@/features/product/product-state-control";
import { getSellerProductMedia } from "@/features/product/media-queries";
import { getSellerProductById } from "@/features/product/queries";

export const dynamic = "force-dynamic";

const getCachedSellerProductById = cache(getSellerProductById);

type EditProductDraftPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export async function generateMetadata({
  params,
}: EditProductDraftPageProps): Promise<Metadata> {
  const { productId } = await params;
  const result = await getCachedSellerProductById(productId);
  return {
    title:
      result.status === "found"
        ? `Редактирование: ${result.product.title}`
        : "Редактирование товара",
  };
}

export default async function EditProductDraftPage({
  params,
}: EditProductDraftPageProps) {
  const { productId } = await params;
  const productResult = await getCachedSellerProductById(productId);

  if (productResult.status === "unauthenticated") {
    redirect(`/seller/sign-in?from=/seller/products/${productId}/edit`);
  }

  if (
    productResult.status === "not_found" ||
    productResult.status === "store_not_found"
  ) {
    notFound();
  }

  if (productResult.status === "error") {
    return (
      <Alert titleAs="h1" tone="danger" title="Не удалось загрузить товар">
        Обновите страницу и попробуйте ещё раз. Пустая форма не подменяет ошибку загрузки.
      </Alert>
    );
  }

  const mediaResult = await getSellerProductMedia(productResult.product.id);
  const initialMedia = mediaResult.status === "found" ? mediaResult.media : [];
  const mediaError =
    mediaResult.status !== "found"
      ? "Не удалось загрузить фотографии. Обновите страницу и попробуйте ещё раз."
      : undefined;

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-border-strong pb-6">
        <p className="font-mono text-xs text-primary">ТОВАРЫ / РЕДАКТОР</p>
        <h1 className="mt-2 break-words text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
          {productResult.product.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-secondary">
          Проверьте карточку, сохраните изменения и отдельно управляйте её
          видимостью для покупателей.
        </p>
      </header>

      <section className="max-w-3xl border-t border-border pt-6" aria-labelledby="product-data-title">
        <h2 className="mb-5 text-xl font-semibold" id="product-data-title">Данные товара</h2>
        <ProductForm
          initialState={getInitialProductDraftFormState(productResult.product)}
          productId={productResult.product.id}
          productStatus={productResult.product.status}
        />
      </section>

      <ProductLifecycleProvider initialStatus={productResult.product.status}>
        <section className="border-t border-border pt-6" aria-labelledby="product-media-title">
          <h2 className="sr-only" id="product-media-title">Фотографии товара</h2>
          <ProductMediaManager
            initialError={mediaError}
            initialMedia={initialMedia}
            productId={productResult.product.id}
            productStatus={productResult.product.status}
            productTitle={productResult.product.title}
          />
        </section>

        <section className="border-t border-border pt-6" aria-labelledby="product-state-title">
          <h2 className="sr-only" id="product-state-title">Статус товара</h2>
          <ProductStateControl
            mediaCount={initialMedia.length}
            mediaLoadError={Boolean(mediaError)}
            productId={productResult.product.id}
            productStatus={productResult.product.status}
          />
        </section>
      </ProductLifecycleProvider>
    </div>
  );
}
