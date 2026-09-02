import { describe, expect, it } from "vitest";
import { confirmationReference, validateDelivery } from "@/lib/checkout";

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
});
