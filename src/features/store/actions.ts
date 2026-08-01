"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getStoreAvatarPath,
  STORE_AVATAR_BUCKET,
  validateStoreAvatarFile,
  validateStoreAvatarSignature,
} from "./avatar";
import type { StoreProfileFormState } from "./form-state";
import {
  normalizeOptionalStoreText,
  STORE_DEFAULT_TIMEZONE,
  validateStoreProfileValues,
} from "./schema";

const AVATAR_RESELECT_MESSAGE =
  "Выберите фото ещё раз после исправления полей.";
const SLUG_TAKEN_MESSAGE =
  "Такая ссылка уже занята. Попробуйте другой вариант.";

type SupabaseErrorLike = {
  code?: string;
};

function isUniqueViolation(error: SupabaseErrorLike | null) {
  return error?.code === "23505";
}

function getFieldErrorsWithAvatarReselect(
  fieldErrors: StoreProfileFormState["fieldErrors"],
  shouldRequestAvatarReselect: boolean,
) {
  if (!shouldRequestAvatarReselect || fieldErrors.avatar) {
    return fieldErrors;
  }

  return {
    ...fieldErrors,
    avatar: AVATAR_RESELECT_MESSAGE,
  };
}

export async function saveStoreProfile(
  previousState: StoreProfileFormState,
  formData: FormData,
): Promise<StoreProfileFormState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    additionalInfo: String(formData.get("additionalInfo") ?? ""),
  };
  const avatar = formData.get("avatar");
  const avatarFile = avatar instanceof File && avatar.size > 0 ? avatar : null;
  const validation = validateStoreProfileValues(values);
  const avatarValidation = validateStoreAvatarFile(avatarFile);
  const avatarSignatureValidation =
    avatarFile && avatarValidation.isValid && avatarValidation.extension
      ? await validateStoreAvatarSignature(avatarFile, avatarValidation.extension)
      : { isValid: true as const };
  const shouldRequestAvatarReselect = Boolean(
    avatarFile && avatarValidation.isValid && avatarSignatureValidation.isValid,
  );

  if (!avatarValidation.isValid) {
    validation.fieldErrors.avatar = avatarValidation.error;
  }

  if (!avatarSignatureValidation.isValid) {
    validation.fieldErrors.avatar = avatarSignatureValidation.error;
  }

  if (
    !validation.isValid ||
    !avatarValidation.isValid ||
    !avatarSignatureValidation.isValid
  ) {
    return {
      status: "error",
      message: "Проверьте поля и сохраните магазин ещё раз.",
      values: validation.values,
      fieldErrors: getFieldErrorsWithAvatarReselect(
        validation.fieldErrors,
        shouldRequestAvatarReselect && !validation.isValid,
      ),
      avatarUrl: previousState.avatarUrl,
    };
  }

  let uploadedAvatarPath: string | null = null;
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | null =
    null;

  try {
    supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        status: "error",
        message: "Войдите в кабинет продавца, чтобы сохранить магазин.",
        values: validation.values,
        fieldErrors: {},
        avatarUrl: previousState.avatarUrl,
      };
    }

    if (validation.values.slug) {
      const { data: isSlugAvailable, error: slugAvailabilityError } =
        await supabase.rpc("is_store_slug_available", {
          candidate_slug: validation.values.slug,
        });

      if (slugAvailabilityError) {
        return {
          status: "error",
          message:
            "Не удалось проверить публичную ссылку. Попробуйте сохранить ещё раз.",
          values: validation.values,
          fieldErrors: getFieldErrorsWithAvatarReselect(
            {},
            shouldRequestAvatarReselect,
          ),
          avatarUrl: previousState.avatarUrl,
        };
      }

      if (isSlugAvailable === false) {
        return {
          status: "error",
          message: "Проверьте публичную ссылку магазина.",
          values: validation.values,
          fieldErrors: getFieldErrorsWithAvatarReselect(
            { slug: SLUG_TAKEN_MESSAGE },
            shouldRequestAvatarReselect,
          ),
          avatarUrl: previousState.avatarUrl,
        };
      }
    }

    const { data: existingStore, error: existingStoreError } = await supabase
      .from("stores")
      .select("avatar_path")
      .eq("seller_id", user.id)
      .maybeSingle<{ avatar_path: string | null }>();

    if (existingStoreError) {
      return {
        status: "error",
        message:
          "Не удалось загрузить текущие данные магазина. Попробуйте ещё раз.",
        values: validation.values,
        fieldErrors: getFieldErrorsWithAvatarReselect(
          {},
          shouldRequestAvatarReselect,
        ),
        avatarUrl: previousState.avatarUrl,
      };
    }

    let avatarPath = existingStore?.avatar_path ?? null;

    if (avatarFile && avatarValidation.extension) {
      const nextAvatarPath = getStoreAvatarPath(user.id, avatarValidation.extension);
      const { error: uploadError } = await supabase.storage
        .from(STORE_AVATAR_BUCKET)
        .upload(nextAvatarPath, avatarFile, {
          contentType: avatarFile.type,
          upsert: false,
        });

      if (uploadError) {
        return {
          status: "error",
          message: "Не удалось загрузить фото магазина. Попробуйте ещё раз.",
          values: validation.values,
          fieldErrors: {
            avatar: "Фото не сохранилось. Выберите файл ещё раз.",
          },
          avatarUrl: previousState.avatarUrl,
        };
      }

      avatarPath = nextAvatarPath;
      uploadedAvatarPath = nextAvatarPath;
    }

    const { data: savedStore, error: saveError } = await supabase
      .from("stores")
      .upsert(
        {
          seller_id: user.id,
          name: validation.values.name,
          slug: validation.values.slug || null,
          avatar_path: avatarPath,
          description: normalizeOptionalStoreText(validation.values.description),
          additional_info: normalizeOptionalStoreText(validation.values.additionalInfo),
          timezone: STORE_DEFAULT_TIMEZONE,
        },
        { onConflict: "seller_id" },
      )
      .select("avatar_path")
      .single<{ avatar_path: string | null }>();

    if (saveError) {
      if (uploadedAvatarPath) {
        await supabase.storage.from(STORE_AVATAR_BUCKET).remove([uploadedAvatarPath]);
      }

      if (isUniqueViolation(saveError)) {
        return {
          status: "error",
          message: "Проверьте публичную ссылку магазина.",
          values: validation.values,
          fieldErrors: getFieldErrorsWithAvatarReselect(
            { slug: SLUG_TAKEN_MESSAGE },
            shouldRequestAvatarReselect,
          ),
          avatarUrl: previousState.avatarUrl,
        };
      }

      return {
        status: "error",
        message:
          "Не удалось сохранить магазин. Проверьте данные и попробуйте ещё раз.",
        values: validation.values,
        fieldErrors: {},
        avatarUrl: previousState.avatarUrl,
      };
    }

    if (
      avatarFile &&
      existingStore?.avatar_path &&
      existingStore.avatar_path !== savedStore.avatar_path
    ) {
      await supabase.storage
        .from(STORE_AVATAR_BUCKET)
        .remove([existingStore.avatar_path]);
    }

    let avatarUrl = previousState.avatarUrl;
    if (savedStore.avatar_path) {
      const { data: signedAvatar } = await supabase.storage
        .from(STORE_AVATAR_BUCKET)
        .createSignedUrl(savedStore.avatar_path, 60 * 60);
      avatarUrl = signedAvatar?.signedUrl;
    }

    revalidatePath("/seller");
    revalidatePath("/seller/store");
    if (validation.values.slug) {
      revalidatePath(`/${validation.values.slug}`);
    }
    if (
      previousState.values.slug &&
      previousState.values.slug !== validation.values.slug
    ) {
      revalidatePath(`/${previousState.values.slug}`);
    }

    return {
      status: "success",
      message: "Магазин сохранён.",
      values: validation.values,
      fieldErrors: {},
      avatarUrl,
    };
  } catch {
    if (uploadedAvatarPath && supabase) {
      try {
        await supabase.storage.from(STORE_AVATAR_BUCKET).remove([uploadedAvatarPath]);
      } catch {
        // Best-effort cleanup: the user-facing save failure is handled below.
      }
    }

    return {
      status: "error",
      message:
        "Сохранение временно недоступно. Проверьте подключение и попробуйте снова.",
      values: validation.values,
      fieldErrors: {},
      avatarUrl: previousState.avatarUrl,
    };
  }
}
