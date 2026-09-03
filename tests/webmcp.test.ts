import productsJson from "@/data/products.json";
import { describe, expect, it } from "vitest";
import { bagReducer, type BagLine } from "@/lib/bag";
import {
  createWebMcpTools,
  registerWebMcpTools,
  type WebMcpDependencies,
  type WebMcpTool,
} from "@/lib/webmcp";
import type { Product } from "@/lib/products";

const products = productsJson as Product[];

function setup() {
  let lines: BagLine[] = [];
  const routes: string[] = [];
  const dependencies: WebMcpDependencies = {
    navigate: (route) => routes.push(route),
    getBag: () => lines,
    add: (line) => { lines = bagReducer(lines, { type: "add", line }); },
    setQuantity: (productSlug, variantId, quantity) => {
      lines = bagReducer(lines, { type: "quantity", productSlug, variantId, quantity });
    },
    remove: (productSlug, variantId) => {
      lines = bagReducer(lines, { type: "remove", productSlug, variantId });
    },
  };
  const tools = createWebMcpTools(dependencies, products);
  const call = async (name: string, input: Record<string, unknown> = {}) => {
    const tool = tools.find((item) => item.name === name);
    if (!tool) throw new Error(`Missing tool ${name}`);
    // Tool results intentionally have different shapes under one browser API.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await tool.execute(input) as Record<string, any>;
  };

  return { call, dependencies, getLines: () => lines, routes, tools };
}

describe("WebMCP registration", () => {
  it("registers the Shopify tool surface only for the improved version and cleans it up", () => {
    const registered: Array<{ tool: WebMcpTool; signal: AbortSignal }> = [];
    const context = {
      registerTool: (tool: WebMcpTool, options: { signal: AbortSignal }) => {
        registered.push({ tool, signal: options.signal });
      },
    };
    const { tools } = setup();

    registerWebMcpTools(context, tools, false);
    expect(registered).toEqual([]);

    const cleanup = registerWebMcpTools(context, tools, true);
    expect(registered.map(({ tool }) => tool.name)).toEqual([
      "get_product",
      "get_cart",
      "update_cart",
    ]);
    expect(registered.find(({ tool }) => tool.name === "get_cart")?.tool.annotations?.readOnlyHint).toBe(true);

    cleanup();
    expect(registered.every(({ signal }) => signal.aborted)).toBe(true);
  });
});

describe("WebMCP product tool", () => {
  it("returns product details and can display the product", async () => {
    const { call, routes } = setup();

    expect(await call("get_product", { product: "" })).toMatchObject({
      status: "clarification_required",
      options: [],
    });

    const product = await call("get_product", { product: "vesper-tote", navigate: true });
    expect(product).toMatchObject({ slug: "vesper-tote", name: "Vesper Tote" });
    expect(product.variants).toHaveLength(2);
    expect(routes).toEqual(["/product/vesper-tote"]);
  });
});

describe("WebMCP cart tools", () => {
  it("asks for clarification instead of guessing an ambiguous variant", async () => {
    const { call, getLines } = setup();
    const result = await call("update_cart", { operation: "add", product: "vesper-tote" });

    expect(result.status).toBe("clarification_required");
    expect(result.options.map((item: { id: string }) => item.id)).toEqual(["oxblood", "stone"]);
    expect(getLines()).toEqual([]);
  });

  it("adds, reads, changes, and removes cart lines", async () => {
    const { call, getLines } = setup();

    expect(await call("update_cart", {
      operation: "set", product: "vesper-tote", variant: "stone", quantity: 2,
    })).toMatchObject({ status: "error" });

    expect(await call("update_cart", {
      operation: "add", product: "vesper-tote", variant: "stone", quantity: 2,
    })).toMatchObject({ status: "success", count: 2 });
    expect(await call("get_cart")).toMatchObject({ count: 2, subtotal: { amountMinor: 570000, currency: "EUR" } });

    await call("update_cart", {
      operation: "set", product: "vesper-tote", variant: "stone", quantity: 1,
    });
    expect(getLines()[0].quantity).toBe(1);

    await call("update_cart", { operation: "remove", product: "vesper-tote", variant: "stone" });
    expect(getLines()).toEqual([]);
  });

});
