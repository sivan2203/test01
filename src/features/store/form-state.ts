import type {
  StoreProfileFieldErrors,
  StoreProfileValues,
} from "./schema";
import type { SellerStoreProfile } from "./queries";

export type StoreProfileFormState = {
  status: "idle" | "success" | "error";
  message: string;
  values: StoreProfileValues;
  fieldErrors: StoreProfileFieldErrors;
  avatarUrl?: string;
};

export function getInitialStoreProfileFormState(
  store: SellerStoreProfile | null,
): StoreProfileFormState {
  return {
    status: "idle",
    message: "",
    values: {
      name: store?.name ?? "",
      description: store?.description ?? "",
      additionalInfo: store?.additionalInfo ?? "",
    },
    fieldErrors: {},
    avatarUrl: store?.avatarUrl,
  };
}
