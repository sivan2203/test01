"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import type { ProductStatus } from "./schema";

type ProductLifecycleContextValue = {
  productStatus: ProductStatus;
  setProductStatus: (status: ProductStatus) => void;
};

const ProductLifecycleContext = createContext<ProductLifecycleContextValue | null>(
  null,
);

export function ProductLifecycleProvider({
  initialStatus,
  children,
}: {
  initialStatus: ProductStatus;
  children: ReactNode;
}) {
  const [productStatus, setProductStatus] = useState(initialStatus);

  return (
    <ProductLifecycleContext.Provider value={{ productStatus, setProductStatus }}>
      {children}
    </ProductLifecycleContext.Provider>
  );
}

export function useProductLifecycleStatus(fallback: ProductStatus) {
  return useContext(ProductLifecycleContext) ?? {
    productStatus: fallback,
    setProductStatus: () => undefined,
  };
}
