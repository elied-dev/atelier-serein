import productsJson from "@/data/products.json";
import { describe, expect, it } from "vitest";
import { completeDemoCheckout, confirmationReference, validateDelivery } from "@/lib/checkout";
import { readOrders } from "@/lib/orders";
import type { Product } from "@/lib/products";

const products = productsJson as Product[];

describe("simulated checkout", () => {
  it("requires only delivery-contact fields", () => {
    expect(validateDelivery(new FormData())).toEqual({
      name: "Enter your name",
      email: "Enter a valid email",
      address: "Enter an address",
      city: "Enter a city",
      postalCode: "Enter a postal code",
    });
  });

  it("accepts a complete delivery form", () => {
    const form = new FormData();
    Object.entries({
      name: "Avery Stone",
      email: "avery@example.com",
      address: "1 Demo Way",
      city: "Paris",
      postalCode: "75001",
    }).forEach(([key, value]) => form.set(key, value));
    expect(validateDelivery(form)).toEqual({});
  });

  it("creates a clearly fake deterministic reference", () => {
    expect(confirmationReference(new Date("2026-04-11T12:00:00Z"), () => 0.1234)).toBe("DEMO-20260411-1234");
  });

  it("records a local order when simulated checkout completes", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };

    const reference = completeDemoCheckout(
      storage,
      [{ productSlug: "vesper-tote", variantId: "stone", quantity: 1 }],
      products,
      new Date("2026-04-11T12:00:00Z"),
      () => 0.1234,
    );

    expect(reference).toBe("DEMO-20260411-1234");
    expect(readOrders(storage, products)[0]).toMatchObject({ reference, total: 285000 });
  });
});
