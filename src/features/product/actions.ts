"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProductDraftFormState } from "./form-state";
import { getCurrentSellerStoreForProducts, isProductId } from "./queries";
import {
  PRODUCT_STATUS_DRAFT,
  type ProductAvailabilityStatus,
  type ProductPriceMode,
  validateProductDraftValues,
} from "./schema";

function getProductDraftValuesFromFormData(formData: FormData) {
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

function getProductDraftErrorState(
  values: ProductDraftFormState["values"],
  message: string,
  fieldErrors: ProductDraftFormState["fieldErrors"] = {},
): ProductDraftFormState {
  return {
    status: "error",
    message,
    values,
    fieldErrors,
  };
}

async function getProductDraftActionContext(
  values: ProductDraftFormState["values"],
): Promise<
  | {
      status: "ready";
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
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
      state: getProductDraftErrorState(
        values,
        "Войдите в кабинет продавца, чтобы сохранить товар.",
      ),
    };
  }

  const storeResult = await getCurrentSellerStoreForProducts(supabase, user.id);
  if (storeResult.status === "error") {
    return {
      status: "error",
      state: getProductDraftErrorState(
        values,
        "Не удалось загрузить магазин. Попробуйте сохранить ещё раз.",
      ),
    };
  }

  if (storeResult.status === "store_not_found") {
    return {
      status: "error",
      state: getProductDraftErrorState(
        values,
        "Сначала создайте магазин, затем добавьте товар.",
      ),
    };
  }

  return { status: "ready", supabase, storeId: storeResult.storeId };
}

function getValidatedProductDraft(formData: FormData) {
  return validateProductDraftValues(getProductDraftValuesFromFormData(formData));
}

function getProductDraftPayload(
  validation: ReturnType<typeof getValidatedProductDraft>,
  storeId: string,
) {
  return {
    store_id: storeId,
    title: validation.normalized.title,
    description: validation.normalized.description,
    price_mode: validation.normalized.priceMode,
    price_amount: validation.normalized.priceAmount,
    availability_status: validation.normalized.availabilityStatus,
    status: PRODUCT_STATUS_DRAFT,
  };
}

export async function createProductDraft(
  _previousState: ProductDraftFormState,
  formData: FormData,
): Promise<ProductDraftFormState> {
  const validation = getValidatedProductDraft(formData);
  let productId: string;

  if (!validation.isValid) {
    return getProductDraftErrorState(
      validation.values,
      "Проверьте поля и сохраните товар ещё раз.",
      validation.fieldErrors,
    );
  }

  try {
    const context = await getProductDraftActionContext(validation.values);
    if (context.status === "error") {
      return context.state;
    }

    const { data, error } = await context.supabase
      .from("products")
      .insert(getProductDraftPayload(validation, context.storeId))
      .select("id")
      .single<{ id: string }>();

    if (error) {
      return getProductDraftErrorState(
        validation.values,
        "Не удалось сохранить товар. Проверьте данные и попробуйте ещё раз.",
      );
    }

    productId = data.id;
  } catch {
    return getProductDraftErrorState(
      validation.values,
      "Сохранение временно недоступно. Проверьте подключение и попробуйте снова.",
    );
  }

  revalidatePath("/seller/products");
  revalidatePath(`/seller/products/${productId}/edit`);
  redirect(`/seller/products/${productId}/edit`);
}

export async function updateProductDraft(
  productId: string,
  _previousState: ProductDraftFormState,
  formData: FormData,
): Promise<ProductDraftFormState> {
  const validation = getValidatedProductDraft(formData);

  if (!validation.isValid) {
    return getProductDraftErrorState(
      validation.values,
      "Проверьте поля и сохраните товар ещё раз.",
      validation.fieldErrors,
    );
  }

  if (!isProductId(productId)) {
    return getProductDraftErrorState(
      validation.values,
      "Товар не найден.",
    );
  }

  try {
    const context = await getProductDraftActionContext(validation.values);
    if (context.status === "error") {
      return context.state;
    }

    const { error } = await context.supabase
      .from("products")
      .update(getProductDraftPayload(validation, context.storeId))
      .eq("id", productId)
      .eq("store_id", context.storeId)
      .eq("status", PRODUCT_STATUS_DRAFT);

    if (error) {
      return getProductDraftErrorState(
        validation.values,
        "Не удалось сохранить товар. Проверьте данные и попробуйте ещё раз.",
      );
    }

    revalidatePath("/seller/products");
    revalidatePath(`/seller/products/${productId}/edit`);

    return {
      status: "success",
      message: "Черновик товара сохранён.",
      values: validation.values,
      fieldErrors: {},
    };
  } catch {
    return getProductDraftErrorState(
      validation.values,
      "Сохранение временно недоступно. Проверьте подключение и попробуйте снова.",
    );
  }
}
