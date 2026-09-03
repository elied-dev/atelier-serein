"use client";

import { useBag } from "@/components/bag-provider";
import { BagEditor } from "@/components/commerce";
import { DynamicYieldContextScript } from "@/components/dynamic-yield-context";
import { useProducts } from "@/components/product-provider";
import { findProduct } from "@/lib/catalog";

export default function BagPage() {
  const { lines } = useBag();
  const products = useProducts();
  const skus = [...new Set(lines.flatMap(({ productSlug }) => {
    const sku = findProduct(productSlug, products)?.sku;
    return sku ? [sku] : [];
  }))];

  return (
    <section className="bag-page">
      <DynamicYieldContextScript type="CART" data={skus.length ? skus : [""]} />
      <p className="eyebrow">Your selection</p>
      <h1>Bag</h1>
      <BagEditor />
    </section>
  );
}
