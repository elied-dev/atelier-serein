"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBag } from "@/components/bag-provider";
import { useImprovedVersion } from "@/components/improved-version-provider";
import { useProducts } from "@/components/product-provider";
import { readOrders } from "@/lib/orders";
import {
  createRecommendationRegistrar,
  createWebMcpTools,
  registerWebMcpTools,
  type RecommendationToolConfig,
} from "@/lib/webmcp";

type WebMcpDocument = Document & {
  modelContext?: Parameters<typeof registerWebMcpTools>[0];
};

type WebMcpWindow = Window & {
  webMcp?: { registerRecommendation: (config: RecommendationToolConfig) => boolean };
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

    const cleanupTools = registerWebMcpTools(context, createWebMcpTools({
      navigate: (route) => router.push(route),
      getBag: () => bagRef.current.lines,
      add: (line) => bagRef.current.add(line),
      setQuantity: (productSlug, variantId, quantity) => bagRef.current.setQuantity(productSlug, variantId, quantity),
      remove: (productSlug, variantId) => bagRef.current.remove(productSlug, variantId),
      clear: () => bagRef.current.clear(),
      getOrders: () => readOrders(localStorage, products),
    }, products), true);
    const registrar = createRecommendationRegistrar(context, async (selector) => {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selector }),
      });
      return response.json();
    });
    const target = window as WebMcpWindow;
    const bridge = { registerRecommendation: registrar.registerRecommendation };
    target.webMcp = bridge;
    window.dispatchEvent(new Event("webmcp:ready"));

    return () => {
      cleanupTools();
      registrar.cleanup();
      if (target.webMcp === bridge) delete target.webMcp;
    };
  }, [enabled, products, router]);

  return null;
}
