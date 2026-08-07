"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import type { ProductStatus } from "./schema";

type ProductLifecycleContextValue = {
  productStatus: ProductStatus;
  setProductStatus: (status: ProductStatus) => void;
  mediaCount: number | null;
  setMediaCount: (count: number) => void;
};

const ProductLifecycleContext = createContext<ProductLifecycleContextValue | null>(
  null,
);

const ignoreLifecycleUpdate = () => undefined;

export function ProductLifecycleProvider({
  initialStatus,
  initialMediaCount = null,
  children,
}: {
  initialStatus: ProductStatus;
  initialMediaCount?: number | null;
  children: ReactNode;
}) {
  const [productStatus, setProductStatus] = useState(initialStatus);
  const [mediaCount, setMediaCount] = useState<number | null>(initialMediaCount);

  return (
    <ProductLifecycleContext.Provider
      value={{ productStatus, setProductStatus, mediaCount, setMediaCount }}
    >
      {children}
    </ProductLifecycleContext.Provider>
  );
}

export function useProductLifecycleStatus(fallback: ProductStatus) {
  return useContext(ProductLifecycleContext) ?? {
    productStatus: fallback,
    setProductStatus: ignoreLifecycleUpdate,
    mediaCount: null,
    setMediaCount: ignoreLifecycleUpdate,
  };
}
