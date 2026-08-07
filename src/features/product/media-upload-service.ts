import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getProductMediaExtension,
  PRODUCT_MEDIA_BUCKET,
  PRODUCT_MEDIA_MAX_COUNT,
  PRODUCT_MEDIA_SIGNED_URL_TTL_SECONDS,
  type ProductMedia,
  type ProductMediaMimeType,
  isProductMediaMimeType,
  validateProductMediaFile,
  validateProductMediaSignature,
} from "./media-schema";
import { getCurrentSellerStoreForProducts, isProductId } from "./queries";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type ProductMediaInsertArguments = {
  target_media_id: string;
  target_product_id: string;
  target_storage_path: string;
  target_mime_type: ProductMediaMimeType;
  target_byte_size: number;
  target_sort_order: number;
};

export type ProductMediaInsert = (
  arguments_: ProductMediaInsertArguments,
) => Promise<{ error: unknown }>;

export type PersistedProductMediaUpload = {
  media: ProductMedia;
  mediaId: string;
  storagePath: string;
};

type PersistProductMediaResult =
  | {
      status: "success";
      message: string;
      upload: PersistedProductMediaUpload;
    }
  | {
      status: "error";
      code: "storage" | "metadata" | "cleanup";
      message: string;
    };

export type ProductMediaUploadServiceResult =
  | {
      status: "success";
      code: "uploaded";
      message: string;
      media: ProductMedia;
    }
  | {
      status: "error";
      code:
        | "unauthenticated"
        | "not_found"
        | "invalid_file"
        | "limit_reached"
        | "storage"
        | "metadata"
        | "cleanup"
        | "unexpected";
      message: string;
      media: null;
    };

type ProductMediaUploadContext = {
  supabase: SupabaseServerClient;
  storeId: string;
  currentCount: number;
};

type PersistValidatedProductMediaFileInput = {
  supabase: SupabaseServerClient;
  storeId: string;
  productId: string;
  file: File;
  mimeType: ProductMediaMimeType;
  sortOrder: number;
  mediaId?: string;
  insertMedia?: ProductMediaInsert;
};

type ExistingProductMediaResult =
  | { status: "found"; media: ProductMedia }
  | { status: "not_found" }
  | { status: "error" };

function uploadError(
  code: Exclude<ProductMediaUploadServiceResult, { status: "success" }>["code"],
  message: string,
): ProductMediaUploadServiceResult {
  return { status: "error", code, message, media: null };
}

async function getProductMediaUploadContext(
  productId: string,
): Promise<
  | { status: "ready"; context: ProductMediaUploadContext }
  | { status: "unauthenticated" | "not_found" | "unexpected" }
> {
  if (!isProductId(productId)) return { status: "not_found" };

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return { status: "unauthenticated" };

    const storeResult = await getCurrentSellerStoreForProducts(supabase, user.id);
    if (storeResult.status !== "found") {
      return {
        status: storeResult.status === "error" ? "unexpected" : "not_found",
      };
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("store_id", storeResult.storeId)
      .neq("status", "deleted")
      .maybeSingle<{ id: string }>();

    if (productError) return { status: "unexpected" };
    if (!product) return { status: "not_found" };

    const { count, error: countError } = await supabase
      .from("product_media")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    if (countError || count === null) return { status: "unexpected" };

    return {
      status: "ready",
      context: {
        supabase,
        storeId: storeResult.storeId,
        currentCount: count,
      },
    };
  } catch {
    return { status: "unexpected" };
  }
}

async function removeUploadedObject(
  supabase: SupabaseServerClient,
  storagePath: string,
) {
  try {
    const { error } = await supabase.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .remove([storagePath]);
    return !error;
  } catch {
    return false;
  }
}

async function getExistingProductMediaUpload(
  context: ProductMediaUploadContext,
  productId: string,
  mediaId: string,
): Promise<ExistingProductMediaResult> {
  try {
    const { data, error } = await context.supabase
      .from("product_media")
      .select("id, storage_path, mime_type, sort_order")
      .eq("id", mediaId)
      .eq("product_id", productId)
      .maybeSingle<{
        id: string;
        storage_path: string;
        mime_type: string;
        sort_order: number;
      }>();

    if (error) return { status: "error" };
    if (!data) return { status: "not_found" };
    if (!isProductMediaMimeType(data.mime_type)) return { status: "error" };

    let signedUrl = "";
    try {
      const { data: signed } = await context.supabase.storage
        .from(PRODUCT_MEDIA_BUCKET)
        .createSignedUrl(
          data.storage_path,
          PRODUCT_MEDIA_SIGNED_URL_TTL_SECONDS,
        );
      signedUrl = signed?.signedUrl ?? "";
    } catch {
      // The retry is still successful; the client retains its object URL.
    }

    return {
      status: "found",
      media: {
        id: data.id,
        url: signedUrl,
        mimeType: data.mime_type,
        sortOrder: data.sort_order,
        isCover: data.sort_order === 0,
      },
    };
  } catch {
    return { status: "error" };
  }
}

export async function persistValidatedProductMediaFile({
  supabase,
  storeId,
  productId,
  file,
  mimeType,
  sortOrder,
  mediaId: requestedMediaId,
  insertMedia,
}: PersistValidatedProductMediaFileInput): Promise<PersistProductMediaResult> {
  const mediaId = requestedMediaId ?? crypto.randomUUID();
  const extension = getProductMediaExtension(mimeType);
  const storagePath = `${storeId}/${productId}/${mediaId}.${extension}`;

  try {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .upload(storagePath, file, {
        contentType: mimeType,
        upsert: false,
      });

    if (storageError) {
      return {
        status: "error",
        code: "storage",
        message: "Не удалось загрузить фотографию. Повторите попытку.",
      };
    }
  } catch {
    await removeUploadedObject(supabase, storagePath);
    return {
      status: "error",
      code: "storage",
      message: "Не удалось загрузить фотографию. Повторите попытку.",
    };
  }

  const insertArguments: ProductMediaInsertArguments = {
    target_media_id: mediaId,
    target_product_id: productId,
    target_storage_path: storagePath,
    target_mime_type: mimeType,
    target_byte_size: file.size,
    target_sort_order: sortOrder,
  };

  let insertError: unknown;
  try {
    if (insertMedia) {
      ({ error: insertError } = await insertMedia(insertArguments));
    } else {
      ({ error: insertError } = await supabase.rpc(
        "insert_product_media",
        insertArguments,
      ));
    }
  } catch (error) {
    insertError = error;
  }

  if (insertError) {
    const cleaned = await removeUploadedObject(supabase, storagePath);
    return cleaned
      ? {
          status: "error",
          code: "metadata",
          message: "Не удалось сохранить фотографию. Повторите попытку.",
        }
      : {
          status: "error",
          code: "cleanup",
          message:
            "Фотография не сохранена, а автоматическая очистка не завершилась. Обратитесь к администратору.",
        };
  }

  let signedUrl = "";
  try {
    const { data } = await supabase.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .createSignedUrl(storagePath, PRODUCT_MEDIA_SIGNED_URL_TTL_SECONDS);
    signedUrl = data?.signedUrl ?? "";
  } catch {
    // The upload is already durable. The client can keep its object URL until reload.
  }

  return {
    status: "success",
    message: "Фотография сохранена.",
    upload: {
      mediaId,
      storagePath,
      media: {
        id: mediaId,
        url: signedUrl,
        mimeType,
        sortOrder,
        isCover: sortOrder === 0,
      },
    },
  };
}

export async function uploadSingleProductMedia(
  productId: string,
  file: File,
  uploadId?: string,
): Promise<ProductMediaUploadServiceResult> {
  const contextResult = await getProductMediaUploadContext(productId);
  if (contextResult.status === "unauthenticated") {
    return uploadError(
      "unauthenticated",
      "Не удалось загрузить фотографию. Войдите снова и повторите попытку.",
    );
  }
  if (contextResult.status === "not_found") {
    return uploadError(
      "not_found",
      "Товар не найден или недоступен для редактирования.",
    );
  }
  if (contextResult.status !== "ready") {
    return uploadError(
      "unexpected",
      "Не удалось проверить товар. Повторите попытку.",
    );
  }

  if (uploadId) {
    const existingUpload = await getExistingProductMediaUpload(
      contextResult.context,
      productId,
      uploadId,
    );
    if (existingUpload.status === "error") {
      return uploadError(
        "unexpected",
        "Не удалось проверить повторную загрузку. Повторите попытку.",
      );
    }
    if (existingUpload.status === "found") {
      return {
        status: "success",
        code: "uploaded",
        message: "Фотография уже была сохранена.",
        media: existingUpload.media,
      };
    }
  }

  if (contextResult.context.currentCount >= PRODUCT_MEDIA_MAX_COUNT) {
    return uploadError(
      "limit_reached",
      `У товара может быть не больше ${PRODUCT_MEDIA_MAX_COUNT} фотографий.`,
    );
  }

  const validation = validateProductMediaFile(file);
  if (!validation.isValid) {
    return uploadError("invalid_file", validation.message);
  }

  let signature: Awaited<ReturnType<typeof validateProductMediaSignature>>;
  try {
    signature = await validateProductMediaSignature(file, validation.mimeType);
  } catch {
    return uploadError(
      "invalid_file",
      "Не удалось проверить изображение. Выберите другой файл.",
    );
  }
  if (!signature.isValid) {
    return uploadError("invalid_file", signature.message);
  }

  const result = await persistValidatedProductMediaFile({
    ...contextResult.context,
    productId,
    file,
    mimeType: validation.mimeType,
    sortOrder: contextResult.context.currentCount,
    mediaId: uploadId,
  });

  if (result.status === "error" && result.code === "storage" && uploadId) {
    const existingUpload = await getExistingProductMediaUpload(
      contextResult.context,
      productId,
      uploadId,
    );
    if (existingUpload.status === "found") {
      return {
        status: "success",
        code: "uploaded",
        message: "Фотография уже была сохранена.",
        media: existingUpload.media,
      };
    }
  }

  return result.status === "success"
    ? {
        status: "success",
        code: "uploaded",
        message: result.message,
        media: result.upload.media,
      }
    : uploadError(result.code, result.message);
}
