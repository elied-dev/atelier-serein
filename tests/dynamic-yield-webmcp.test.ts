import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

describe("Dynamic Yield recommendation injection", () => {
  it("waits for the website bridge and can run repeatedly", () => {
    const script = readFileSync("scripts/dynamic-yield-recommendation.js", "utf8");
    const listeners: Record<string, () => void> = {};
    const registrations: unknown[] = [];
    const window: Record<string, unknown> = {
      addEventListener: (name: string, listener: () => void) => { listeners[name] = listener; },
    };

    runInNewContext(script, { window });
    expect(listeners["webmcp:ready"]).toBeTypeOf("function");

    window.webMcp = {
      registerRecommendation: (config: unknown) => {
        registrations.push(config);
        return true;
      },
    };
    listeners["webmcp:ready"]();
    runInNewContext(script, { window });

    expect(registrations).toEqual([
      {
        name: "recommendation",
        description: "Call this tool first when the shopper asks to buy, choose, discover, or get product recommendations.",
        selector: "test_api_recs",
      },
      {
        name: "recommendation",
        description: "Call this tool first when the shopper asks to buy, choose, discover, or get product recommendations.",
        selector: "test_api_recs",
      },
    ]);
  });
});
