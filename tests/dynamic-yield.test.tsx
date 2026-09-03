import productsJson from "@/data/products.json";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import BagPage from "@/app/bag/page";
import { BagProvider } from "@/components/bag-provider";
import { ProductProvider } from "@/components/product-provider";
import type { Product } from "@/lib/products";

const products = productsJson as Product[];

it("sets an empty cart context when the bag has no products", () => {
  const html = renderToStaticMarkup(
    <ProductProvider products={products}>
      <BagProvider><BagPage /></BagProvider>
    </ProductProvider>,
  );

  expect(html).toContain('DY.recommendationContext = {"type":"CART","data":[""]};');
});
