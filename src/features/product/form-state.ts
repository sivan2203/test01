import type { SellerProduct } from "./queries";
import type { ProductDraftFieldErrors, ProductDraftValues } from "./schema";

export type ProductDraftFormState = {
  status: "idle" | "success" | "error";
  message: string;
  values: ProductDraftValues;
  fieldErrors: ProductDraftFieldErrors;
};

export function getInitialProductDraftFormState(
  product: SellerProduct | null,
): ProductDraftFormState {
  const defaultValues: ProductDraftValues = {
    title: "",
    priceMode: "request",
    priceAmount: "",
    description: "",
    availabilityStatus: "in_stock",
  };

  return {
    status: "idle",
    message: "",
    values: product
      ? {
          title: product.title,
          priceMode: product.priceMode,
          priceAmount: product.priceAmount?.toString() ?? "",
          description: product.description,
          availabilityStatus: product.availabilityStatus,
        }
      : defaultValues,
    fieldErrors: {},
  };
}
