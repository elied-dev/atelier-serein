import productsJson from "@/data/products.json";
import { ServerInsertedHTMLContext } from "next/navigation";
import { type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import BagPage from "@/app/bag/page";
import { BagProvider } from "@/components/bag-provider";
import { ProductProvider } from "@/components/product-provider";
import type { Product } from "@/lib/products";

const products = productsJson as Product[];

it("inserts the empty cart context into head instead of the page body", () => {
  let renderHead: (() => ReactNode) | undefined;
  const body = renderToStaticMarkup(
    <ServerInsertedHTMLContext.Provider value={(callback) => { renderHead = callback; }}>
      <ProductProvider products={products}>
        <BagProvider><BagPage /></BagProvider>
      </ProductProvider>
    </ServerInsertedHTMLContext.Provider>,
  );

  expect(body).not.toContain("DY.recommendationContext");
  expect(renderHead).toBeTypeOf("function");
  expect(renderToStaticMarkup(<>{renderHead?.()}</>)).toContain(
    'DY.recommendationContext = {"type":"CART","data":[""]};',
  );
});
