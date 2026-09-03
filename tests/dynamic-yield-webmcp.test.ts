import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import type { WebMcpTool } from "@/lib/webmcp";

type InjectedWindow = {
  registerWebMcpRecommendation?: (config: {
    name: string;
    description: string;
    selector: string;
  }) => boolean;
};

describe("Dynamic Yield recommendation injection", () => {
  it("defines a repeat-safe registrar without registering a tool itself", async () => {
    const script = readFileSync("scripts/dynamic-yield-recommendation.js", "utf8");
    const registered: Array<{ tool: WebMcpTool; signal: AbortSignal }> = [];
    const requests: Array<{ url: string; body: string | undefined }> = [];
    const window: InjectedWindow = {};
    const context = {
      window,
      document: {
        modelContext: {
          registerTool: (tool: WebMcpTool, options: { signal: AbortSignal }) => {
            registered.push({ tool, signal: options.signal });
          },
        },
      },
      AbortController,
      fetch: async (url: string, init?: RequestInit) => {
        requests.push({ url, body: init?.body as string | undefined });
        return { json: async () => ({ choices: [{ name: "test_api_recs" }] }) };
      },
    };

    runInNewContext(script, context);

    expect(registered).toEqual([]);
    expect(window.registerWebMcpRecommendation).toBeTypeOf("function");
    expect(window.registerWebMcpRecommendation?.({
      name: "recommendation",
      description: "Call this tool first.",
      selector: "test_api_recs",
    })).toBe(true);
    expect(await registered[0].tool.execute({})).toEqual({ choices: [{ name: "test_api_recs" }] });
    expect(requests).toEqual([{ url: "/api/recommendations", body: "{\"selector\":\"test_api_recs\"}" }]);

    window.registerWebMcpRecommendation?.({
      name: "recommendation",
      description: "Replacement.",
      selector: "homepage_bag_recs",
    });

    expect(registered[0].signal.aborted).toBe(true);
    expect(registered[1].tool.description).toBe("Replacement.");
    expect(registered[1].signal.aborted).toBe(false);

    const registrar = window.registerWebMcpRecommendation;
    runInNewContext(script, context);
    expect(window.registerWebMcpRecommendation).toBe(registrar);
    expect(registered).toHaveLength(2);
  });
});
