import { notFound, redirect } from "next/navigation";

import { GlassPanel } from "@/components/design-system";
import { getInitialProductDraftFormState } from "@/features/product/form-state";
import { ProductMediaManager } from "@/features/product/product-media-manager";
import { ProductLifecycleProvider } from "@/features/product/product-lifecycle-context";
import { ProductForm } from "@/features/product/product-form";
import { ProductStateControl } from "@/features/product/product-state-control";
import { getSellerProductMedia } from "@/features/product/media-queries";
import { getSellerProductById } from "@/features/product/queries";

export const dynamic = "force-dynamic";

type EditProductDraftPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export default async function EditProductDraftPage({
  params,
}: EditProductDraftPageProps) {
  const { productId } = await params;
  const productResult = await getSellerProductById(productId);

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
      <main>
        <GlassPanel className="p-5" role="alert">
          <p className="text-sm text-foreground/60">Редактирование товара</p>
          <h1 className="mt-2 text-2xl font-semibold">Не удалось загрузить товар</h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Обновите страницу и попробуйте ещё раз. Мы не показываем пустую
            форму, если не уверены, что черновик загрузился корректно.
          </p>
        </GlassPanel>
      </main>
    );
  }

  const mediaResult = await getSellerProductMedia(productResult.product.id);
  const initialMedia = mediaResult.status === "found" ? mediaResult.media : [];
  const mediaError =
    mediaResult.status !== "found"
      ? "Не удалось загрузить фотографии. Обновите страницу и попробуйте ещё раз."
      : undefined;

  return (
    <main className="flex flex-col gap-4">
      <GlassPanel className="p-5">
        <p className="text-sm text-foreground/60">Редактирование товара</p>
        <h1 className="mt-2 text-2xl font-semibold">
          Редактирование товара
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Проверьте карточку, сохраните изменения и отдельно управляйте её
          видимостью для покупателей.
        </p>
      </GlassPanel>

      <GlassPanel className="p-5">
        <ProductForm
          initialState={getInitialProductDraftFormState(productResult.product)}
          productId={productResult.product.id}
          productStatus={productResult.product.status}
        />
      </GlassPanel>

      <ProductLifecycleProvider initialStatus={productResult.product.status}>
        <GlassPanel className="p-5">
          <ProductMediaManager
            initialError={mediaError}
            initialMedia={initialMedia}
            productId={productResult.product.id}
            productStatus={productResult.product.status}
            productTitle={productResult.product.title}
          />
        </GlassPanel>

        <GlassPanel className="p-5">
          <ProductStateControl
            mediaCount={initialMedia.length}
            mediaLoadError={Boolean(mediaError)}
            productId={productResult.product.id}
            productStatus={productResult.product.status}
          />
        </GlassPanel>
      </ProductLifecycleProvider>
    </main>
  );
}
