import productsJson from "@/data/products.json";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/lib/products";

const mocks = vi.hoisted(() => ({ listProducts: vi.fn(), getProductBySlug: vi.fn() }));
vi.mock("@/lib/product-repository", () => mocks);

import { GET as list } from "@/app/api/products/route";
import { GET as getOne } from "@/app/api/products/[slug]/route";

const fixture = productsJson[0] as Product;

describe("product API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the database catalog", async () => {
    mocks.listProducts.mockResolvedValue([fixture]);
    const response = await list();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([fixture]);
  });

  it("returns one product or 404", async () => {
    mocks.getProductBySlug.mockResolvedValueOnce(fixture).mockResolvedValueOnce(undefined);
    const found = await getOne(new Request("http://test"), { params: Promise.resolve({ slug: fixture.slug }) });
    expect(await found.json()).toEqual(fixture);
    const missing = await getOne(new Request("http://test"), { params: Promise.resolve({ slug: "missing" }) });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "Product not found" });
  });
});
