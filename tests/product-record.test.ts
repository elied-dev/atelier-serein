import products from "@/data/products.json";
import { describe, expect, it } from "vitest";
import { productFromRecord, productToRecord } from "@/lib/product-record";
import type { Product } from "@/lib/products";
import type { Product as ProductRecord } from "@/generated/prisma/client";

const fixture = products[0] as Product;

describe("product database mapping", () => {
  it("round-trips the complete product without exposing database sort order", () => {
    const record = productToRecord(fixture, 7) as ProductRecord;
    expect(record.sortOrder).toBe(7);
    expect(productFromRecord(record)).toEqual(fixture);
  });
});
