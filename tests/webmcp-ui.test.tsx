import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderHistory } from "@/app/orders/page";
import PoliciesPage from "@/app/policies/page";
import { BagProvider } from "@/components/bag-provider";
import { AddToBag } from "@/components/commerce";
import { findProduct } from "@/lib/catalog";

describe("WebMCP storefront UI", () => {
  it("renders the variant selected by show_variant", () => {
    const product = findProduct("vesper-tote");
    if (!product) throw new Error("Missing product fixture");

    const html = renderToStaticMarkup(
      <BagProvider><AddToBag product={product} initialVariantId="stone" /></BagProvider>,
    );

    expect(html).toMatch(/checked=""[^>]*value="stone"|value="stone"[^>]*checked=""/);
  });

  it("renders the storefront's policy content", () => {
    const html = renderToStaticMarkup(<PoliciesPage />);

    expect(html).toContain("Returns");
    expect(html).toContain("Delivery");
    expect(html).toContain("Privacy");
  });

  it("renders locally stored simulated orders", () => {
    const html = renderToStaticMarkup(<OrderHistory orders={[{
      reference: "DEMO-20260411-1234",
      createdAt: "2026-04-11T12:00:00.000Z",
      lines: [{ productSlug: "vesper-tote", variantId: "stone", quantity: 2 }],
      total: 570000,
    }]} />);

    expect(html).toContain("DEMO-20260411-1234");
    expect(html).toContain("Vesper Tote");
    expect(html).toContain("Stone");
  });
});
