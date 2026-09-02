"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Product } from "@/lib/products";

const ProductContext = createContext<Product[] | undefined>(undefined);

export function ProductProvider({ products, children }: { products: Product[]; children: ReactNode }) {
  return <ProductContext value={products}>{children}</ProductContext>;
}

export function useProducts() {
  const products = useContext(ProductContext);
  if (!products) throw new Error("useProducts must be used inside ProductProvider");
  return products;
}
