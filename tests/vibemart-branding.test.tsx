import productsJson from "@/data/products.json";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Product } from "@/lib/products";

const products = productsJson as Product[];

vi.mock("@/lib/product-repository", () => ({
  listProducts: async () => products,
}));

import HomePage from "@/app/page";

describe("Vibemart homepage", () => {
  it("presents a broad store with all eight departments", async () => {
    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("Something for Every Vibe");
    for (const department of [
      "Travel",
      "Electronics",
      "Home",
      "Clothing",
      "Outdoor",
      "Beauty",
      "Kids",
      "Office",
    ]) {
      expect(html).toContain(`>${department}<`);
    }
  });
});
