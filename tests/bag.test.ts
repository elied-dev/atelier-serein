import { describe, expect, it } from "vitest";
import { BAG_KEY, BAG_VERSION, bagReducer, bagSubtotal, parseStoredBag } from "@/lib/bag";

describe("bag", () => {
  it("uses the required versioned storage key", () => {
    expect(BAG_KEY).toBe("atelier-serein-bag-v1");
  });

  it("merges identical variants and keeps distinct variants separate", () => {
    let state = bagReducer([], {
      type: "add",
      line: { productSlug: "vesper-tote", variantId: "oxblood", quantity: 1 },
    });
    state = bagReducer(state, {
      type: "add",
      line: { productSlug: "vesper-tote", variantId: "oxblood", quantity: 1 },
    });
    state = bagReducer(state, {
      type: "add",
      line: { productSlug: "vesper-tote", variantId: "stone", quantity: 1 },
    });

    expect(state).toEqual([
      { productSlug: "vesper-tote", variantId: "oxblood", quantity: 2 },
      { productSlug: "vesper-tote", variantId: "stone", quantity: 1 },
    ]);
  });

  it("removes zero quantities", () => {
    expect(
      bagReducer([{ productSlug: "vesper-tote", variantId: "oxblood", quantity: 1 }], {
        type: "quantity",
        productSlug: "vesper-tote",
        variantId: "oxblood",
        quantity: 0,
      }),
    ).toEqual([]);
  });

  it("resets malformed and unsupported storage", () => {
    expect(parseStoredBag("not json")).toEqual([]);
    expect(parseStoredBag(JSON.stringify({ version: BAG_VERSION + 1, lines: [] }))).toEqual([]);
  });

  it("rejects stored lines for unknown products and variants", () => {
    expect(
      parseStoredBag(
        JSON.stringify({
          version: BAG_VERSION,
          lines: [
            { productSlug: "missing-product", variantId: "oxblood", quantity: 1 },
            { productSlug: "vesper-tote", variantId: "missing-variant", quantity: 1 },
            { productSlug: "vesper-tote", variantId: "oxblood", quantity: 1 },
          ],
        }),
      ),
    ).toEqual([{ productSlug: "vesper-tote", variantId: "oxblood", quantity: 1 }]);
  });

  it("calculates integer subtotals", () => {
    expect(bagSubtotal([{ productSlug: "vesper-tote", variantId: "oxblood", quantity: 2 }])).toBe(570000);
  });
});
