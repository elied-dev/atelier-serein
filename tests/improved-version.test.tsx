import productsJson from "@/data/products.json";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BagProvider } from "@/components/bag-provider";
import {
  ImprovedVersionProvider,
  useImprovedVersion,
} from "@/components/improved-version-provider";
import { ProductProvider } from "@/components/product-provider";
import { SiteHeader } from "@/components/site-chrome";
import type { Product } from "@/lib/products";

const products = productsJson as Product[];

function VersionStatus() {
  return <span>{useImprovedVersion() ? "improved" : "standard"}</span>;
}

describe("improved version", () => {
  it.each([
    [true, "improved"],
    [false, "standard"],
  ])("exposes enabled=%s to descendants", (enabled, expected) => {
    const html = renderToStaticMarkup(
      <ImprovedVersionProvider enabled={enabled}>
        <VersionStatus />
      </ImprovedVersionProvider>,
    );

    expect(html).toBe(`<span>${expected}</span>`);
  });

  it("shows the improved badge in the header only when enabled", () => {
    const renderHeader = (enabled: boolean) =>
      renderToStaticMarkup(
        <ImprovedVersionProvider enabled={enabled}>
          <ProductProvider products={products}>
            <BagProvider>
              <SiteHeader />
            </BagProvider>
          </ProductProvider>
        </ImprovedVersionProvider>,
      );

    expect(renderHeader(true)).toContain(">Improved</span>");
    expect(renderHeader(false)).not.toContain(">Improved</span>");
  });
});
