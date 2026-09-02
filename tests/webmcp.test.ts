import { describe, expect, it } from "vitest";
import { bagReducer, type BagLine } from "@/lib/bag";
import {
  createWebMcpTools,
  registerWebMcpTools,
  type WebMcpDependencies,
  type WebMcpTool,
} from "@/lib/webmcp";
import type { DemoOrder } from "@/lib/orders";

function setup() {
  let lines: BagLine[] = [];
  const routes: string[] = [];
  const orders: DemoOrder[] = [{
    reference: "DEMO-20260411-1234",
    createdAt: "2026-04-11T12:00:00.000Z",
    lines: [{ productSlug: "vesper-tote", variantId: "stone", quantity: 1 }],
    total: 285000,
  }];
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
    clear: () => { lines = bagReducer(lines, { type: "clear" }); },
    getOrders: () => orders,
  };
  const tools = createWebMcpTools(dependencies);
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
      "search_catalog",
      "browse_store",
      "get_product",
      "show_variant",
      "get_cart",
      "update_cart",
      "cancel_cart",
      "proceed_to_checkout",
      "manage_orders",
      "search_shop_policies_and_faqs",
    ]);
    expect(registered.find(({ tool }) => tool.name === "get_cart")?.tool.annotations?.readOnlyHint).toBe(true);

    cleanup();
    expect(registered.every(({ signal }) => signal.aborted)).toBe(true);
  });
});

describe("WebMCP catalog tools", () => {
  it("searches the catalog and exposes a full-results URL", async () => {
    const { call } = setup();
    const result = await call("search_catalog", { query: "Vesper Tote" });

    expect(result.total).toBe(1);
    expect(result.products[0]).toMatchObject({ slug: "vesper-tote", name: "Vesper Tote" });
    expect(result.searchUrl).toBe("/collection?q=Vesper+Tote");

    const naturalQuery = await call("search_catalog", { query: "find me a leather bag" });
    expect(naturalQuery.total).toBeGreaterThan(0);
    expect(naturalQuery.products.every((item: { category: string }) => item.category === "bags")).toBe(true);
  });

  it("lists collections and can browse and display one", async () => {
    const { call, routes } = setup();

    expect((await call("browse_store")).collections.map((item: { slug: string }) => item.slug)).toEqual([
      "bags", "jewelry", "watches", "fragrance",
    ]);
    const result = await call("browse_store", { collection: "bags", navigate: true });
    expect(result.products).toHaveLength(8);
    expect(result.total).toBeGreaterThan(result.products.length);
    expect(result.products.every((item: { category: string }) => item.category === "bags")).toBe(true);
    expect(routes).toEqual(["/collection/bags"]);
  });

  it("returns product details and displays a matching available variant", async () => {
    const { call, routes } = setup();

    expect(await call("get_product", { product: "" })).toMatchObject({
      status: "clarification_required",
      options: [],
    });

    const product = await call("get_product", { product: "vesper-tote" });
    expect(product).toMatchObject({ slug: "vesper-tote", name: "Vesper Tote" });
    expect(product.variants).toHaveLength(2);

    const shown = await call("show_variant", { product: "vesper-tote", color: "Stone" });
    expect(shown).toMatchObject({ status: "success", variant: { id: "stone" } });
    expect(routes).toEqual(["/product/vesper-tote?variant=stone"]);
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

  it("cancels the whole cart", async () => {
    const { call, getLines } = setup();
    await call("update_cart", { operation: "add", product: "vesper-tote", variant: "stone" });

    expect(await call("cancel_cart")).toMatchObject({ status: "success", count: 0 });
    expect(getLines()).toEqual([]);
  });
});

describe("WebMCP checkout, orders, and store tools", () => {
  it("only proceeds to checkout when the cart has items", async () => {
    const { call, routes } = setup();

    expect(await call("proceed_to_checkout")).toMatchObject({ status: "error" });
    expect(routes).toEqual([]);

    await call("update_cart", { operation: "add", product: "vesper-tote", variant: "stone" });
    expect(await call("proceed_to_checkout")).toMatchObject({ status: "success" });
    expect(routes).toEqual(["/checkout"]);
  });

  it("returns local demo orders and displays their page", async () => {
    const { call, routes } = setup();
    const result = await call("manage_orders");

    expect(result.orders[0]).toMatchObject({ reference: "DEMO-20260411-1234", total: 285000 });
    expect(routes).toEqual(["/orders"]);
  });

  it("answers policy questions from storefront content", async () => {
    const { call } = setup();
    const result = await call("search_shop_policies_and_faqs", { query: "What is your returns policy?" });
    const shipping = await call("search_shop_policies_and_faqs", { query: "Do you offer shipping?" });

    expect(result.results[0].title).toBe("Returns");
    expect(shipping.results[0].title).toBe("Delivery");
    expect(result.pageUrl).toBe("/policies");
  });
});
