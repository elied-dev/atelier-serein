import productsJson from "@/data/products.json";
import { describe, expect, it } from "vitest";
import { ORDER_KEY, parseStoredOrders, recordOrder } from "@/lib/orders";
import type { Product } from "@/lib/products";

const products = productsJson as Product[];

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

describe("simulated order history", () => {
  it("stores completed cart lines without delivery details", () => {
    const storage = memoryStorage();
    const order = recordOrder(
      storage,
      [{ productSlug: "vesper-tote", variantId: "stone", quantity: 2 }],
      products,
      "DEMO-20260411-1234",
      new Date("2026-04-11T12:00:00Z"),
    );

    expect(order).toEqual({
      reference: "DEMO-20260411-1234",
      createdAt: "2026-04-11T12:00:00.000Z",
      lines: [{ productSlug: "vesper-tote", variantId: "stone", quantity: 2 }],
      total: 570000,
    });
    expect(parseStoredOrders(storage.getItem(ORDER_KEY), products)).toEqual([order]);
  });

  it("resets malformed or unsupported history", () => {
    expect(parseStoredOrders("not json", products)).toEqual([]);
    expect(parseStoredOrders(JSON.stringify({ version: 2, orders: [] }), products)).toEqual([]);
  });
});
