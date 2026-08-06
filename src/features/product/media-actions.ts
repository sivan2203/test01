"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getProductMediaRowsForSeller,
  getSellerProductMedia,
} from "./media-queries";
import {
  getProductMediaExtension,
  PRODUCT_MEDIA_BUCKET,
  PRODUCT_MEDIA_MAX_COUNT,
  canRemoveProductMedia,
  normalizeProductMediaOrder,
  type ProductMediaActionState,
  validateProductMediaFile,
  validateProductMediaSignature,
} from "./media-schema";
import { getCurrentSellerStoreForProducts, isProductId } from "./queries";

function errorState(
  previousState: ProductMediaActionState,
  message: string,
): ProductMediaActionState {
  return { status: "error", message, media: previousState.media };
}

async function getMediaActionContext(productId: string) {
  try {
    if (!isProductId(productId)) return { status: "not_found" as const };

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return { status: "unauthenticated" as const };

    const storeResult = await getCurrentSellerStoreForProducts(supabase, user.id);
    if (storeResult.status !== "found") return storeResult;

    const { data: product, error } = await supabase
      .from("products")
      .select("id, status")
      .eq("id", productId)
      .eq("store_id", storeResult.storeId)
      .neq("status", "deleted")
      .maybeSingle<{ id: string; status: string }>();

    if (error) return { status: "error" as const };
    if (!product) return { status: "not_found" as const };

    return {
      status: "ready" as const,
      supabase,
      storeId: storeResult.storeId,
      productStatus: product.status,
    };
  } catch {
    return { status: "error" as const };
  }
}

async function getCurrentMediaState(productId: string) {
  const result = await getSellerProductMedia(productId);
  return result.status === "found" ? result.media : [];
}

function refreshProductMediaPaths(productId: string) {
  revalidatePath(`/seller/products/${productId}/edit`);
  revalidatePath("/seller/products");
}

export async function manageProductMedia(
  productId: string,
  previousState: ProductMediaActionState,
  formData: FormData,
): Promise<ProductMediaActionState> {
  try {
    const operation = String(formData.get("operation") ?? "");

    if (operation === "upload") {
      return uploadProductMedia(productId, previousState, formData);
    }
    if (operation === "reorder") {
      return reorderProductMedia(productId, previousState, formData);
    }
    if (operation === "remove") {
      return removeProductMedia(productId, previousState, formData);
    }

    return errorState(previousState, "Неизвестное действие с фотографией.");
  } catch {
    return errorState(
      previousState,
      "Не удалось выполнить действие с фотографиями. Обновите страницу и попробуйте ещё раз.",
    );
  }
}

export async function uploadProductMedia(
  productId: string,
  previousState: ProductMediaActionState,
  formData: FormData,
): Promise<ProductMediaActionState> {
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    return errorState(previousState, "Выберите хотя бы одно изображение JPG, PNG или WebP.");
  }

  const context = await getMediaActionContext(productId);
  if (context.status === "unauthenticated") {
    return errorState(previousState, "Войдите в кабинет продавца, чтобы управлять фото.");
  }
  if (context.status !== "ready") {
    return errorState(previousState, "Товар не найден или сейчас недоступен для редактирования.");
  }

  const rowsResult = await getProductMediaRowsForSeller(productId);
  if (rowsResult.status !== "found") {
    return errorState(previousState, "Не удалось загрузить текущие фотографии. Попробуйте ещё раз.");
  }

  if (rowsResult.rows.length + files.length > PRODUCT_MEDIA_MAX_COUNT) {
    return errorState(
      previousState,
      `У товара может быть не больше ${PRODUCT_MEDIA_MAX_COUNT} фотографий.`,
    );
  }

  const validatedFiles: Array<{
    file: File;
    validation:
      | { isValid: true; mimeType: "image/jpeg" | "image/png" | "image/webp" }
      | { isValid: false; message: string };
  }> = [];
  for (const file of files) {
    const validation = validateProductMediaFile(file);
    if (!validation.isValid) {
      return errorState(previousState, validation.message);
    }
    const signature = await validateProductMediaSignature(file, validation.mimeType);
    if (!signature.isValid) {
      return errorState(previousState, signature.message);
    }
    validatedFiles.push({ file, validation });
  }

  const uploadedPaths: string[] = [];
  const insertedIds: string[] = [];

  try {
    for (const [index, item] of validatedFiles.entries()) {
      if (!item.validation.isValid) continue;

      const mediaId = crypto.randomUUID();
      const extension = getProductMediaExtension(item.validation.mimeType);
      const storagePath = `${context.storeId}/${productId}/${mediaId}.${extension}`;
      const { error: uploadError } = await context.supabase.storage
        .from(PRODUCT_MEDIA_BUCKET)
        .upload(storagePath, item.file, {
          contentType: item.validation.mimeType,
          upsert: false,
        });

      if (uploadError) throw new Error("upload");
      uploadedPaths.push(storagePath);

      const { error: insertError } = await context.supabase.rpc(
        "insert_product_media",
        {
          target_media_id: mediaId,
          target_product_id: productId,
          target_storage_path: storagePath,
          target_mime_type: item.validation.mimeType,
          target_byte_size: item.file.size,
          target_sort_order: rowsResult.rows.length + index,
        },
      );

      if (insertError) throw new Error("insert");
      insertedIds.push(mediaId);
    }
  } catch {
    if (uploadedPaths.length > 0) {
      const { error: cleanupError } = await context.supabase.storage
        .from(PRODUCT_MEDIA_BUCKET)
        .remove(uploadedPaths);
      if (cleanupError) {
        return errorState(
          previousState,
          "Фото загружены частично, но автоматическая очистка не завершилась. Обратитесь к администратору.",
        );
      }
    }
    if (insertedIds.length > 0) {
      for (const insertedId of insertedIds) {
        await context.supabase.rpc("remove_product_media", {
          target_product_id: productId,
          target_media_id: insertedId,
        });
      }
    }
    return errorState(previousState, "Не удалось сохранить фотографии. Попробуйте ещё раз.");
  }

  refreshProductMediaPaths(productId);
  const media = await getCurrentMediaState(productId);
  return {
    status: "success",
    message: "Фотографии сохранены.",
    media,
  };
}

export async function reorderProductMedia(
  productId: string,
  previousState: ProductMediaActionState,
  formData: FormData,
): Promise<ProductMediaActionState> {
  const rawIds = String(formData.get("orderedMediaIds") ?? "");
  let orderedMediaIds: string[];

  try {
    const parsed: unknown = JSON.parse(rawIds);
    if (!Array.isArray(parsed) || parsed.some((value) => typeof value !== "string")) {
      throw new Error("invalid");
    }
    orderedMediaIds = parsed;
  } catch {
    return errorState(previousState, "Не удалось определить порядок фотографий.");
  }

  const context = await getMediaActionContext(productId);
  if (context.status !== "ready") {
    return errorState(previousState, "Товар не найден или сейчас недоступен для редактирования.");
  }

  const currentMedia = await getProductMediaRowsForSeller(productId);
  if (currentMedia.status !== "found") {
    return errorState(previousState, "Не удалось загрузить текущий порядок фотографий.");
  }
  if (!normalizeProductMediaOrder(currentMedia.rows.map((row) => row.id), orderedMediaIds)) {
    return errorState(previousState, "Порядок должен содержать каждую фотографию товара ровно один раз.");
  }

  const { error } = await context.supabase.rpc("reorder_product_media", {
    target_product_id: productId,
    ordered_media_ids: orderedMediaIds,
  });

  if (error) {
    return errorState(previousState, "Порядок фотографий не изменён. Обновите страницу и попробуйте ещё раз.");
  }

  refreshProductMediaPaths(productId);
  return {
    status: "success",
    message: "Порядок фотографий сохранён.",
    media: await getCurrentMediaState(productId),
  };
}

export async function removeProductMedia(
  productId: string,
  previousState: ProductMediaActionState,
  formData: FormData,
): Promise<ProductMediaActionState> {
  const mediaId = String(formData.get("mediaId") ?? "");
  const context = await getMediaActionContext(productId);
  if (context.status !== "ready") {
    return errorState(previousState, "Товар не найден или сейчас недоступен для редактирования.");
  }

  const { data: media, error: mediaError } = await context.supabase
    .from("product_media")
    .select("id, storage_path, mime_type, byte_size, sort_order")
    .eq("id", mediaId)
    .eq("product_id", productId)
    .maybeSingle<{
      id: string;
      storage_path: string;
      mime_type: "image/jpeg" | "image/png" | "image/webp";
      byte_size: number;
      sort_order: number;
    }>();

  if (mediaError || !media) {
    return errorState(previousState, "Фотография не найдена. Обновите страницу.");
  }

  const { count, error: countError } = await context.supabase
    .from("product_media")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if (countError) {
    return errorState(previousState, "Не удалось проверить фотографии товара.");
  }

  if (!canRemoveProductMedia(context.productStatus, count ?? 0)) {
    return errorState(
      previousState,
      "Опубликованный товар должен иметь от 1 до 10 фотографий.",
    );
  }

  const { error: removeError } = await context.supabase.rpc("remove_product_media", {
    target_product_id: productId,
    target_media_id: media.id,
  });
  if (removeError) {
    return errorState(previousState, "Не удалось сохранить удаление фотографии. Обновите страницу.");
  }

  const { error: storageError } = await context.supabase.storage
    .from(PRODUCT_MEDIA_BUCKET)
    .remove([media.storage_path]);
  if (storageError) {
    const { error: restoreError } = await context.supabase.rpc("restore_product_media", {
      target_product_id: productId,
      target_media_id: media.id,
      target_storage_path: media.storage_path,
      target_mime_type: media.mime_type,
      target_byte_size: media.byte_size,
      target_sort_order: media.sort_order,
    });

    if (restoreError) {
      return errorState(
        previousState,
        "Файл не удалён, а восстановить запись фотографии автоматически не удалось. Обратитесь к администратору.",
      );
    }

    return errorState(previousState, "Не удалось удалить файл фотографии. Попробуйте ещё раз.");
  }

  refreshProductMediaPaths(productId);
  return {
    status: "success",
    message: "Фотография удалена.",
    media: await getCurrentMediaState(productId),
  };
}
