import { createSupabaseServerClient } from "@/lib/supabase/server";
import { STORE_AVATAR_BUCKET } from "./avatar";

type StoreRow = {
  id: string;
  seller_id: string;
  name: string;
  avatar_path: string | null;
  description: string | null;
  additional_info: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type SellerStoreProfile = {
  id: string;
  sellerId: string;
  name: string;
  avatarPath: string | null;
  avatarUrl?: string;
  description: string;
  additionalInfo: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

export type SellerStoreProfileResult =
  | { status: "found"; store: SellerStoreProfile }
  | { status: "not_found" }
  | { status: "unauthenticated" }
  | { status: "error" };

export function mapStoreRow(row: StoreRow): SellerStoreProfile {
  return {
    id: row.id,
    sellerId: row.seller_id,
    name: row.name,
    avatarPath: row.avatar_path,
    description: row.description ?? "",
    additionalInfo: row.additional_info ?? "",
    timezone: row.timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCurrentSellerStoreProfile(): Promise<SellerStoreProfileResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { status: "unauthenticated" };
    }

    const { data, error } = await supabase
      .from("stores")
      .select(
        "id, seller_id, name, avatar_path, description, additional_info, timezone, created_at, updated_at",
      )
      .eq("seller_id", user.id)
      .maybeSingle<StoreRow>();

    if (error) {
      return { status: "error" };
    }

    if (!data) {
      return { status: "not_found" };
    }

    const store = mapStoreRow(data);

    if (!store.avatarPath) {
      return { status: "found", store };
    }

    const { data: signedAvatar } = await supabase.storage
      .from(STORE_AVATAR_BUCKET)
      .createSignedUrl(store.avatarPath, 60 * 60);

    return {
      status: "found",
      store: {
        ...store,
        avatarUrl: signedAvatar?.signedUrl,
      },
    };
  } catch {
    return { status: "error" };
  }
}
