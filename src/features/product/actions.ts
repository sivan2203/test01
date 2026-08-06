"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProductMediaRowsForSeller } from "./media-queries";
import type { ProductDraftFormState } from "./form-state";
import {
  PRODUCT_MEDIA_BUCKET,
} from "./media-schema";
import {
  canTransitionProductStatus,
  getProductStatusLabel,
  type ProductLifecycleAction,
  type ProductLifecycleActionState,
  validateProductPublication,
  PRODUCT_STATUS_DELETED,
  PRODUCT_STATUS_DRAFT,
  PRODUCT_STATUS_HIDDEN,
  PRODUCT_STATUS_PUBLISHED,
} from "./lifecycle";
import {
  getCurrentSellerStoreForProducts,
  isProductId,
  type ProductRow,
} from "./queries";
import {
  type ProductAvailabilityStatus,
  type ProductPriceMode,
  type ProductStatus,
  validateProductDraftValues,
} from "./schema";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

function getProductValuesFromFormData(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    priceMode: String(formData.get("priceMode") ?? "request") as ProductPriceMode,
    priceAmount: String(formData.get("priceAmount") ?? ""),
    description: String(formData.get("description") ?? ""),
    availabilityStatus: String(
      formData.get("availabilityStatus") ?? "in_stock",
    ) as ProductAvailabilityStatus,
  };
}

function getProductErrorState(
  values: ProductDraftFormState["values"],
  message: string,
  fieldErrors: ProductDraftFormState["fieldErrors"] = {},
): ProductDraftFormState {
  return { status: "error", message, values, fieldErrors };
}

async function getProductActionContext(
  values: ProductDraftFormState["values"],
): Promise<
  | {
      status: "ready";
      supabase: SupabaseServerClient;
      storeId: string;
    }
  | { status: "error"; state: ProductDraftFormState }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      state: getProductErrorState(
        values,
        "Войдите в кабинет продавца, чтобы сохранить товар.",
      ),
    };
  }

  const storeResult = await getCurrentSellerStoreForProducts(supabase, user.id);
  if (storeResult.status === "error") {
    return {
      status: "error",
      state: getProductErrorState(
        values,
        "Не удалось загрузить магазин. Попробуйте сохранить ещё раз.",
      ),
    };
  }

  if (storeResult.status === "store_not_found") {
    return {
      status: "error",
      state: getProductErrorState(
        values,
        "Сначала создайте магазин, затем добавьте товар.",
      ),
    };
  }

  return { status: "ready", supabase, storeId: storeResult.storeId };
}

function getProductPayload(
  validation: ReturnType<typeof validateProductDraftValues>,
  storeId: string,
) {
  return {
    store_id: storeId,
    title: validation.normalized.title,
    description: validation.normalized.description,
    price_mode: validation.normalized.priceMode,
    price_amount: validation.normalized.priceAmount,
    availability_status: validation.normalized.availabilityStatus,
  };
}

function getProductUpdatePayload(
  validation: ReturnType<typeof validateProductDraftValues>,
) {
  return {
    title: validation.normalized.title,
    description: validation.normalized.description,
    price_mode: validation.normalized.priceMode,
    price_amount: validation.normalized.priceAmount,
    availability_status: validation.normalized.availabilityStatus,
  };
}

async function getOwnedProduct(
  supabase: SupabaseServerClient,
  productId: string,
  storeId: string,
) {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, store_id, title, description, price_mode, price_amount, availability_status, status, created_at, updated_at",
    )
    .eq("id", productId)
    .eq("store_id", storeId)
    .neq("status", PRODUCT_STATUS_DELETED)
    .maybeSingle<ProductRow>();

  if (error) return { status: "error" as const };
  if (!data) return { status: "not_found" as const };
  return { status: "found" as const, product: data };
}

export async function createProductDraft(
  _previousState: ProductDraftFormState,
  formData: FormData,
): Promise<ProductDraftFormState> {
  const values = getProductValuesFromFormData(formData);
  const validation = validateProductDraftValues(values);
  let productId: string;

  if (!validation.isValid) {
    return getProductErrorState(
      validation.values,
      "Проверьте поля и сохраните товар ещё раз.",
      validation.fieldErrors,
    );
  }

  try {
    const context = await getProductActionContext(validation.values);
    if (context.status === "error") return context.state;

    const { data, error } = await context.supabase
      .from("products")
      .insert({
        ...getProductPayload(validation, context.storeId),
        status: PRODUCT_STATUS_DRAFT,
      })
      .select("id")
      .single<{ id: string }>();

    if (error) {
      return getProductErrorState(
        validation.values,
        "Не удалось сохранить товар. Проверьте данные и попробуйте ещё раз.",
      );
    }

    productId = data.id;
  } catch {
    return getProductErrorState(
      validation.values,
      "Сохранение временно недоступно. Проверьте подключение и попробуйте снова.",
    );
  }

  revalidatePath("/seller/products");
  revalidatePath(`/seller/products/${productId}/edit`);
  redirect(`/seller/products/${productId}/edit`);
}

export async function updateProduct(
  productId: string,
  _previousState: ProductDraftFormState,
  formData: FormData,
): Promise<ProductDraftFormState> {
  const values = getProductValuesFromFormData(formData);
  const validation = validateProductDraftValues(values);

  if (!validation.isValid) {
    return getProductErrorState(
      validation.values,
      "Проверьте поля и сохраните товар ещё раз.",
      validation.fieldErrors,
    );
  }

  if (!isProductId(productId)) {
    return getProductErrorState(validation.values, "Товар не найден.");
  }

  try {
    const context = await getProductActionContext(validation.values);
    if (context.status === "error") return context.state;

    const productResult = await getOwnedProduct(
      context.supabase,
      productId,
      context.storeId,
    );
    if (productResult.status !== "found") {
      return getProductErrorState(validation.values, "Товар не найден.");
    }

    const { error } = await context.supabase
      .from("products")
      .update(getProductUpdatePayload(validation))
      .eq("id", productId)
      .eq("store_id", context.storeId)
      .select("id")
      .single<{ id: string }>();

    if (error) {
      return getProductErrorState(
        validation.values,
        productResult.product.status === PRODUCT_STATUS_PUBLISHED
          ? "Опубликованный товар нельзя сохранить с неполными данными. Проверьте поля и фотографии."
          : "Не удалось сохранить товар. Проверьте данные и попробуйте ещё раз.",
      );
    }

    revalidateProductPaths(productId);
    return {
      status: "success",
      message: `${getProductStatusLabel(productResult.product.status)} товар сохранён.`,
      values: validation.values,
      fieldErrors: {},
    };
  } catch {
    return getProductErrorState(
      validation.values,
      "Сохранение временно недоступно. Проверьте подключение и попробуйте снова.",
    );
  }
}

/** @deprecated Use updateProduct for all editable non-deleted products. */
export async function updateProductDraft(
  productId: string,
  previousState: ProductDraftFormState,
  formData: FormData,
) {
  return updateProduct(productId, previousState, formData);
}

function getLifecycleErrorState(
  previousState: ProductLifecycleActionState,
  message: string,
): ProductLifecycleActionState {
  return { status: "error", message, productStatus: previousState.productStatus };
}

function getLifecycleMessage(errorMessage: string) {
  if (errorMessage.includes("published_product_requires_media")) {
    return "Для публикации добавьте от 1 до 10 фотографий.";
  }
  if (errorMessage.includes("invalid_product_publication")) {
    return "Проверьте название, цену, наличие и фотографии перед публикацией.";
  }
  if (errorMessage.includes("invalid_product_transition")) {
    return "Это изменение состояния сейчас недоступно. Обновите страницу и попробуйте ещё раз.";
  }
  if (errorMessage.includes("product_not_found") || errorMessage.includes("product_not_owned")) {
    return "Товар не найден или больше недоступен для редактирования.";
  }
  return "Не удалось изменить состояние товара. Обновите страницу и попробуйте ещё раз.";
}

function getPublicationValidationMessage(fieldErrors: Record<string, string>) {
  return (
    fieldErrors.media ??
    fieldErrors.title ??
    fieldErrors.priceMode ??
    fieldErrors.priceAmount ??
    fieldErrors.availabilityStatus ??
    fieldErrors.description ??
    "Проверьте данные перед публикацией."
  );
}

async function getLifecycleContext(productId: string) {
  if (!isProductId(productId)) return { status: "not_found" as const };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { status: "unauthenticated" as const };

  const storeResult = await getCurrentSellerStoreForProducts(supabase, user.id);
  if (storeResult.status !== "found") return storeResult;

  const productResult = await getOwnedProduct(
    supabase,
    productId,
    storeResult.storeId,
  );
  if (productResult.status !== "found") return productResult;

  const mediaResult = await getProductMediaRowsForSeller(productId);
  if (mediaResult.status !== "found") {
    return { status: "error" as const };
  }

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("slug")
    .eq("id", storeResult.storeId)
    .maybeSingle<{ slug: string | null }>();
  if (storeError) return { status: "error" as const };

  return {
    status: "ready" as const,
    supabase,
    storeId: storeResult.storeId,
    storeSlug: store?.slug ?? null,
    product: productResult.product,
    mediaRows: mediaResult.rows,
  };
}

function getProductFormValues(product: ProductRow) {
  return {
    title: product.title,
    priceMode: product.price_mode,
    priceAmount: product.price_amount?.toString() ?? "",
    description: product.description ?? "",
    availabilityStatus: product.availability_status,
  };
}

function revalidateProductPaths(productId: string, storeSlug?: string | null) {
  revalidatePath("/seller/products");
  revalidatePath(`/seller/products/${productId}/edit`);
  if (storeSlug) revalidatePath(`/${storeSlug}`);
}

async function transitionProduct(
  productId: string,
  action: ProductLifecycleAction,
  previousState: ProductLifecycleActionState,
  formData: FormData,
): Promise<ProductLifecycleActionState> {
  try {
    if (action === "delete" && formData.get("confirmDelete") !== "yes") {
      return getLifecycleErrorState(
        previousState,
        "Подтвердите удаление товара, чтобы продолжить.",
      );
    }

    const context = await getLifecycleContext(productId);
    if (context.status === "unauthenticated") {
      return getLifecycleErrorState(
        previousState,
        "Войдите в кабинет продавца, чтобы изменить состояние товара.",
      );
    }
    if (context.status !== "ready") {
      return getLifecycleErrorState(previousState, "Товар не найден.");
    }

    const targetStatus: ProductStatus =
      action === "publish"
        ? PRODUCT_STATUS_PUBLISHED
        : action === "hide"
          ? PRODUCT_STATUS_HIDDEN
          : PRODUCT_STATUS_DELETED;

    if (!canTransitionProductStatus(context.product.status, targetStatus)) {
      return getLifecycleErrorState(
        { ...previousState, productStatus: context.product.status },
        "Это изменение состояния сейчас недоступно.",
      );
    }

    if (action === "publish") {
      const validation = validateProductPublication(
        getProductFormValues(context.product),
        context.mediaRows.length,
      );
      if (!validation.isValid) {
        return {
          status: "error",
          message: getPublicationValidationMessage(validation.fieldErrors),
          productStatus: context.product.status,
        };
      }
    }

    const { error } = await context.supabase.rpc("transition_product_lifecycle", {
      target_product_id: productId,
      target_status: targetStatus,
    });
    if (error) {
      return getLifecycleErrorState(
        { ...previousState, productStatus: context.product.status },
        getLifecycleMessage(error.message),
      );
    }

    if (action === "delete" && context.mediaRows.length > 0) {
      let cleanupError: Error | null = null;
      try {
        const { error } = await context.supabase.storage
          .from(PRODUCT_MEDIA_BUCKET)
          .remove(context.mediaRows.map((row) => row.storage_path));
        cleanupError = error;
      } catch (error) {
        cleanupError = error instanceof Error ? error : new Error("storage_cleanup_failed");
      }
      if (cleanupError) {
        revalidateProductPaths(productId, context.storeSlug);
        return {
          status: "error",
          message:
            "Товар скрыт, но не все фотографии удалось удалить из хранилища. Обратитесь к администратору для очистки.",
          productStatus: PRODUCT_STATUS_DELETED,
        };
      }
    }

    revalidateProductPaths(productId, context.storeSlug);
    if (action === "delete") redirect("/seller/products");

    return {
      status: "success",
      message:
        action === "publish"
          ? "Товар опубликован."
          : "Товар скрыт от покупателей.",
      productStatus: targetStatus,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    return getLifecycleErrorState(
      previousState,
      "Не удалось изменить состояние товара. Обновите страницу и попробуйте ещё раз.",
    );
  }
}

export async function publishProduct(
  productId: string,
  previousState: ProductLifecycleActionState,
  formData: FormData,
) {
  return transitionProduct(productId, "publish", previousState, formData);
}

export async function hideProduct(
  productId: string,
  previousState: ProductLifecycleActionState,
  formData: FormData,
) {
  return transitionProduct(productId, "hide", previousState, formData);
}

export async function deleteProduct(
  productId: string,
  previousState: ProductLifecycleActionState,
  formData: FormData,
) {
  return transitionProduct(productId, "delete", previousState, formData);
}
