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

export type StoreSlugAvailabilityResult = {
  status: "invalid" | "current" | "available" | "unavailable" | "error";
  slug: string;
  message: string;
};

export type StoreProfileSnapshot = {
  values: StoreProfileValues;
  avatarUrl?: string;
};

const STORE_PROFILE_VALUE_KEYS = [
  "name",
  "slug",
  "telegramUsername",
  "description",
  "additionalInfo",
] as const satisfies readonly (keyof StoreProfileValues)[];

function cloneStoreProfileValues(
  values: StoreProfileValues,
): StoreProfileValues {
  return {
    name: values.name,
    slug: values.slug,
    telegramUsername: values.telegramUsername,
    description: values.description,
    additionalInfo: values.additionalInfo,
  };
}

export function getStoreProfileSnapshot(
  state: Pick<StoreProfileFormState, "values" | "avatarUrl">,
): StoreProfileSnapshot {
  const snapshot = {
    values: cloneStoreProfileValues(state.values),
  };

  return state.avatarUrl === undefined
    ? snapshot
    : { ...snapshot, avatarUrl: state.avatarUrl };
}

export function getStoreProfileValuesFromSnapshot(
  snapshot: StoreProfileSnapshot,
): StoreProfileValues {
  return cloneStoreProfileValues(snapshot.values);
}

export function isStoreProfileDirty(
  snapshot: StoreProfileSnapshot,
  values: StoreProfileValues,
  hasPendingAvatar = false,
) {
  return (
    hasPendingAvatar ||
    STORE_PROFILE_VALUE_KEYS.some(
      (key) => snapshot.values[key] !== values[key],
    )
  );
}

export function getInitialStoreProfileFormState(
  store: SellerStoreProfile | null,
): StoreProfileFormState {
  return {
    status: "idle",
    message: "",
    values: {
      name: store?.name ?? "",
      slug: store?.slug ?? "",
      telegramUsername: store?.telegramUsername ?? "",
      description: store?.description ?? "",
      additionalInfo: store?.additionalInfo ?? "",
    },
    fieldErrors: {},
    avatarUrl: store?.avatarUrl,
  };
}
