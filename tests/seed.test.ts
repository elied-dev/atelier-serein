import productsJson from "../data/products_vibemart.json";
import { describe, expect, it, vi } from "vitest";
import { productToRecord } from "../lib/product-record";
import type { Product } from "../lib/products";
import { seedProducts } from "../prisma/seed";

const products = productsJson as Product[];

describe("seedProducts", () => {
  it("rejects malformed fixture data before starting a database transaction", async () => {
    const transaction = vi.fn();

    await expect(seedProducts([{}], { $transaction: transaction } as never))
      .rejects.toThrow("Invalid product seed fixture");
    expect(transaction).not.toHaveBeenCalled();
  });

  it("deletes old products before inserting and verifying the complete fixture", async () => {
    const calls: string[] = [];
    const deleteMany = vi.fn(async () => { calls.push("delete"); });
    const createMany = vi.fn(async ({ data }: { data: unknown[] }) => {
      calls.push("create");
      expect(data).toHaveLength(160);
    });
    const records = products.map((product, sortOrder) => ({
      ...productToRecord(product, sortOrder),
      weightGrams: product.weightGrams ?? null,
    }));
    const prisma = {
      $transaction: vi.fn(async (operation: (tx: unknown) => Promise<void>) => operation({ product: { deleteMany, createMany } })),
      product: { findMany: vi.fn(async () => records) },
    };

    await expect(seedProducts(products, prisma as never)).resolves.toBe(160);
    expect(calls).toEqual(["delete", "create"]);
  });
});
