"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBag } from "@/components/bag-provider";
import { useImprovedVersion } from "@/components/improved-version-provider";
import { useProducts } from "@/components/product-provider";
import { readOrders } from "@/lib/orders";
import { createWebMcpTools, registerWebMcpTools } from "@/lib/webmcp";

type WebMcpDocument = Document & {
  modelContext?: Parameters<typeof registerWebMcpTools>[0];
};

export function WebMcpTools() {
  const enabled = useImprovedVersion();
  const bag = useBag();
  const products = useProducts();
  const bagRef = useRef(bag);
  const router = useRouter();

  useEffect(() => {
    bagRef.current = bag;
  }, [bag]);

  useEffect(() => {
    if (!enabled) return;
    const context = (document as WebMcpDocument).modelContext;
    if (!context) return;

    return registerWebMcpTools(context, createWebMcpTools({
      navigate: (route) => router.push(route),
      getBag: () => bagRef.current.lines,
      add: (line) => bagRef.current.add(line),
      setQuantity: (productSlug, variantId, quantity) => bagRef.current.setQuantity(productSlug, variantId, quantity),
      remove: (productSlug, variantId) => bagRef.current.remove(productSlug, variantId),
      clear: () => bagRef.current.clear(),
      getOrders: () => readOrders(localStorage, products),
    }, products), true);
  }, [enabled, products, router]);

  return null;
}
