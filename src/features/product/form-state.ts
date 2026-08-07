import type { SellerProduct } from "./queries";
import type { ProductDraftFieldErrors, ProductDraftValues } from "./schema";

export type ProductDraftFormState = {
  status: "idle" | "success" | "error";
  message: string;
  values: ProductDraftValues;
  fieldErrors: ProductDraftFieldErrors;
};

export type ProductWizardDraftFormState = ProductDraftFormState & {
  productId: string | null;
  draftRequestId: string;
};

function getProductDraftValues(product: SellerProduct | null): ProductDraftValues {
  if (product) {
    return {
      title: product.title,
      priceMode: product.priceMode,
      priceAmount: product.priceAmount?.toString() ?? "",
      description: product.description,
      availabilityStatus: product.availabilityStatus,
    };
  }

  return {
    title: "",
    priceMode: "request",
    priceAmount: "",
    description: "",
    availabilityStatus: "in_stock",
  };
}

export function getInitialProductDraftFormState(
  product: SellerProduct | null,
): ProductDraftFormState {
  return {
    status: "idle",
    message: "",
    values: getProductDraftValues(product),
    fieldErrors: {},
  };
}

export function getInitialProductWizardDraftFormState(
  product: SellerProduct | null,
  draftRequestId = globalThis.crypto.randomUUID(),
): ProductWizardDraftFormState {
  return {
    ...getInitialProductDraftFormState(product),
    productId: product?.id ?? null,
    draftRequestId,
  };
}
