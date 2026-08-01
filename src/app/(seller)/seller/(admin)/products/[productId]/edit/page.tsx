import { notFound, redirect } from "next/navigation";

import { GlassPanel } from "@/components/design-system";
import { getInitialProductDraftFormState } from "@/features/product/form-state";
import { ProductForm } from "@/features/product/product-form";
import { getSellerProductDraftById } from "@/features/product/queries";

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
  const productResult = await getSellerProductDraftById(productId);

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
          <h1 className="mt-2 text-2xl font-semibold">Не удалось загрузить черновик</h1>
          <p className="mt-3 text-sm leading-6 text-foreground/70">
            Обновите страницу и попробуйте ещё раз. Мы не показываем пустую
            форму, если не уверены, что черновик загрузился корректно.
          </p>
        </GlassPanel>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4">
      <GlassPanel className="p-5">
        <p className="text-sm text-foreground/60">Редактирование товара</p>
        <h1 className="mt-2 text-2xl font-semibold">Черновик товара</h1>
        <p className="mt-3 text-sm leading-6 text-foreground/70">
          Проверьте карточку и сохраните изменения. В MVP черновик ещё не
          публикуется на витрину.
        </p>
      </GlassPanel>

      <GlassPanel className="p-5">
        <ProductForm
          initialState={getInitialProductDraftFormState(productResult.product)}
          productId={productResult.product.id}
        />
      </GlassPanel>
    </main>
  );
}
