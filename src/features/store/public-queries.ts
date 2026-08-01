import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { STORE_AVATAR_BUCKET } from "./avatar";
import { normalizeStoreSlug, validateStoreSlug } from "./schema";

type PublicStoreRow = {
  slug: string;
  name: string;
  avatar_path: string | null;
  description: string | null;
  additional_info: string | null;
  timezone: string;
};

export type PublicStoreProfile = {
  slug: string;
  name: string;
  avatarUrl?: string;
  description: string;
  additionalInfo: string;
  timezone: string;
};

export type PublicStoreResult =
  | { status: "found"; store: PublicStoreProfile }
  | { status: "not_found" }
  | { status: "error" };

function mapPublicStoreRow(row: PublicStoreRow): PublicStoreProfile {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    additionalInfo: row.additional_info ?? "",
    timezone: row.timezone,
  };
}

export async function getPublicStoreBySlug(
  storeSlug: string,
): Promise<PublicStoreResult> {
  const normalizedSlug = normalizeStoreSlug(storeSlug);
  const slugValidation = validateStoreSlug(storeSlug, { allowEmpty: false });

  if (!slugValidation.isValid || normalizedSlug !== storeSlug) {
    return { status: "not_found" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .rpc("get_public_store_by_slug", {
        store_slug: slugValidation.slug,
      })
      .maybeSingle<PublicStoreRow>();

    if (error) {
      return { status: "error" };
    }

    if (!data) {
      return { status: "not_found" };
    }

    let avatarUrl: string | undefined;
    if (data.avatar_path) {
      try {
        const { data: signedAvatar } = await supabase.storage
          .from(STORE_AVATAR_BUCKET)
          .createSignedUrl(data.avatar_path, 60 * 60);
        avatarUrl = signedAvatar?.signedUrl;
      } catch {
        avatarUrl = undefined;
      }
    }

    return {
      status: "found",
      store: {
        ...mapPublicStoreRow(data),
        avatarUrl,
      },
    };
  } catch {
    return { status: "error" };
  }
}
