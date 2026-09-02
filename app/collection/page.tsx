import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductBrowser } from "@/components/product-browser";
import { listProducts } from "@/lib/product-repository";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Collection",
  description: "Browse the fictional Atelier Serein collection.",
};

export default async function CollectionPage() {
  const products = await listProducts();

  return (
    <section className="collection-page">
      <header className="collection-header">
        <p className="eyebrow">The full edit</p>
        <h1>Collection</h1>
        <p>Twenty fictional objects shaped around material, proportion, and quiet daily rituals.</p>
      </header>
      <Suspense fallback={<p className="browser-loading">Loading collection…</p>}>
        <ProductBrowser products={products} />
      </Suspense>
      <p className="page-demo-notice">{site.demoNotice}</p>
    </section>
  );
}
