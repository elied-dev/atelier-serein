import { bagSubtotal, type BagLine } from "@/lib/bag";
import { filterProducts, findProduct, matchesSearchQuery } from "@/lib/catalog";
import type { DemoOrder } from "@/lib/orders";
import type { Product, ProductVariant } from "@/lib/products";
import { storePolicies } from "@/lib/site";

export type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>) => unknown | Promise<unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
};

type ModelContext = {
  registerTool: (tool: WebMcpTool, options: { signal: AbortSignal }) => void | Promise<void>;
};

export type WebMcpDependencies = {
  navigate: (route: string) => void;
  getBag: () => BagLine[];
  add: (line: BagLine) => void;
  setQuantity: (productSlug: string, variantId: string, quantity: number) => void;
  remove: (productSlug: string, variantId: string) => void;
  clear: () => void;
  getOrders: () => DemoOrder[];
};

const categories = ["bags", "jewelry", "watches", "fragrance"] as const;
const readOnly = { readOnlyHint: true, untrustedContentHint: false };
const changesState = { readOnlyHint: false, untrustedContentHint: false };
const emptySchema = { type: "object", properties: {} };
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const normalize = (value: unknown) => text(value).toLocaleLowerCase();

function productSummary(product: Product) {
  return {
    slug: product.slug,
    name: product.name,
    category: product.category,
    collection: product.collection,
    tagline: product.tagline,
    price: product.price,
    available: product.variants.some(({ availability }) => availability !== "preview"),
    url: `/product/${product.slug}`,
  };
}

function productDetails(product: Product) {
  return {
    ...productSummary(product),
    description: product.description,
    story: product.story,
    variants: product.variants.map(({ id, name, color, size, availability }) => ({ id, name, color, size, availability })),
    materials: product.materials,
    craftsmanship: product.craftsmanship,
    dimensions: product.dimensions,
    origin: product.origin,
    care: product.care,
    features: product.features,
  };
}

function resolveProduct(value: unknown, products: Product[]) {
  const query = normalize(value);
  if (!query) return { error: "Provide a product name or slug.", matches: [] };
  const exact = findProduct(query, products) ?? products.find((product) => normalize(product.name) === query);
  if (exact) return { product: exact };

  const matches = products.filter((product) =>
    normalize(product.slug).includes(query) || normalize(product.name).includes(query),
  );
  return matches.length === 1
    ? { product: matches[0] }
    : { error: "Product is ambiguous or was not found.", matches };
}

function resolveVariant(product: Product, variantValue: unknown, colorValue: unknown) {
  const variant = normalize(variantValue);
  const color = normalize(colorValue);
  const available = product.variants.filter(({ availability }) => availability !== "preview");
  const matches = available.filter((item) =>
    (!variant || normalize(item.id) === variant || normalize(item.name) === variant)
    && (!color || normalize(item.color?.name).includes(color)),
  );
  return matches.length === 1
    ? { variant: matches[0] }
    : {
        error: matches.length ? "Choose one available variant." : "No available variant matches that selection.",
        matches,
      };
}

function cartResult(lines: BagLine[], products: Product[]) {
  return {
    count: lines.reduce((total, line) => total + line.quantity, 0),
    lines: lines.flatMap((line) => {
      const product = findProduct(line.productSlug, products);
      const variant = product?.variants.find(({ id }) => id === line.variantId);
      return product && variant ? [{
        product: productSummary(product),
        variant: { id: variant.id, name: variant.name, color: variant.color, size: variant.size },
        quantity: line.quantity,
        lineTotal: product.price.amountMinor * line.quantity,
      }] : [];
    }),
    subtotal: { amountMinor: bagSubtotal(lines, products), currency: "EUR" },
    cartUrl: "/bag",
  };
}

function variantOptions(variants: ProductVariant[]) {
  return variants.map(({ id, name, color, size, availability }) => ({ id, name, color, size, availability }));
}

export function createWebMcpTools(
  dependencies: WebMcpDependencies,
  products: Product[],
): WebMcpTool[] {
  const getCart = () => cartResult(dependencies.getBag(), products);

  return [
    {
      name: "search_catalog",
      description: "Search this store's products, collections, and information pages. Returns matching products and a link to full product results.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string", description: "Words from the shopper's request." } },
        required: ["query"],
      },
      annotations: readOnly,
      execute: ({ query }) => {
        const q = text(query);
        if (!q) return { status: "error", message: "Provide a search query." };
        const matches = filterProducts({ q }, products);
        const params = new URLSearchParams({ q });
        return {
          total: matches.length,
          products: matches.slice(0, 8).map(productSummary),
          collections: categories.filter((category) => matchesSearchQuery(q, [category])).map((slug) => ({
            slug, name: slug[0].toUpperCase() + slug.slice(1), url: `/collection/${slug}`,
          })),
          articles: [],
          pages: storePolicies.some(({ title, content }) => matchesSearchQuery(q, [title, content]))
            ? [{ title: "Policies and FAQs", url: "/policies" }]
            : [],
          searchUrl: `/collection?${params}`,
        };
      },
    },
    {
      name: "browse_store",
      description: "List store collections or browse products in one collection. Can also display the collection page for the shopper.",
      inputSchema: {
        type: "object",
        properties: {
          collection: { type: "string", enum: categories, description: "Collection to browse." },
          navigate: { type: "boolean", description: "Display the collection page when true." },
        },
      },
      annotations: readOnly,
      execute: ({ collection, navigate }) => {
        const selected = normalize(collection);
        if (!selected) {
          return {
            collections: categories.map((slug) => ({
              slug,
              name: slug[0].toUpperCase() + slug.slice(1),
              productCount: products.filter((product) => product.category === slug).length,
              url: `/collection/${slug}`,
            })),
          };
        }
        if (!categories.includes(selected as (typeof categories)[number])) {
          return { status: "error", message: "Unknown collection. Choose bags, jewelry, watches, or fragrance." };
        }
        const route = `/collection/${selected}`;
        const matches = products.filter((product) => product.category === selected);
        if (navigate === true) dependencies.navigate(route);
        return {
          collection: selected,
          total: matches.length,
          products: matches.slice(0, 8).map(productSummary),
          collectionUrl: route,
        };
      },
    },
    {
      name: "get_product",
      description: "Get full product details, variants, prices, availability, materials, and care. Can also display the product page.",
      inputSchema: {
        type: "object",
        properties: {
          product: { type: "string", description: "Product name or slug." },
          navigate: { type: "boolean", description: "Display the product page when true." },
        },
        required: ["product"],
      },
      annotations: readOnly,
      execute: ({ product, navigate }) => {
        const resolved = resolveProduct(product, products);
        if (!resolved.product) {
          return { status: "clarification_required", message: resolved.error, options: resolved.matches?.map(productSummary) ?? [] };
        }
        if (navigate === true) dependencies.navigate(`/product/${resolved.product.slug}`);
        return productDetails(resolved.product);
      },
    },
    {
      name: "show_variant",
      description: "Display a product page with a matching available variant selected by exact variant or partial color choice.",
      inputSchema: {
        type: "object",
        properties: {
          product: { type: "string", description: "Product name or slug." },
          variant: { type: "string", description: "Exact variant ID or name." },
          color: { type: "string", description: "Full or partial color name." },
        },
        required: ["product"],
      },
      annotations: readOnly,
      execute: ({ product, variant, color }) => {
        const resolved = resolveProduct(product, products);
        if (!resolved.product) {
          return { status: "clarification_required", message: resolved.error, options: resolved.matches?.map(productSummary) ?? [] };
        }
        const selected = resolveVariant(resolved.product, variant, color);
        if (!selected.variant) {
          return { status: "clarification_required", message: selected.error, options: variantOptions(selected.matches) };
        }
        const route = `/product/${resolved.product.slug}?${new URLSearchParams({ variant: selected.variant.id })}`;
        dependencies.navigate(route);
        return { status: "success", product: productSummary(resolved.product), variant: selected.variant, url: route };
      },
    },
    {
      name: "get_cart",
      description: "Get the shopper's live cart with product and variant details, quantities, line totals, and subtotal.",
      inputSchema: emptySchema,
      annotations: readOnly,
      execute: getCart,
    },
    {
      name: "update_cart",
      description: "Add a product variant, set its quantity, or remove it. Ambiguous selections return options without changing the cart.",
      inputSchema: {
        type: "object",
        properties: {
          operation: { type: "string", enum: ["add", "set", "remove"], description: "Cart change to make." },
          product: { type: "string", description: "Product name or slug." },
          variant: { type: "string", description: "Variant ID or name." },
          color: { type: "string", description: "Full or partial color name." },
          quantity: { type: "integer", minimum: 1, description: "Units to add or the new quantity." },
        },
        required: ["operation", "product"],
      },
      annotations: changesState,
      execute: ({ operation, product, variant, color, quantity }) => {
        const nextOperation = text(operation);
        if (!new Set(["add", "set", "remove"]).has(nextOperation)) {
          return { status: "error", message: "Operation must be add, set, or remove." };
        }
        const resolved = resolveProduct(product, products);
        if (!resolved.product) {
          return { status: "clarification_required", message: resolved.error, options: resolved.matches?.map(productSummary) ?? [] };
        }

        let selected = resolveVariant(resolved.product, variant, color);
        if (!variant && !color && nextOperation !== "add") {
          const matchingLines = dependencies.getBag().filter((line) => line.productSlug === resolved.product?.slug);
          if (matchingLines.length === 1) {
            selected = resolveVariant(resolved.product, matchingLines[0].variantId, undefined);
          }
        }
        if (!selected.variant) {
          return { status: "clarification_required", message: selected.error, options: variantOptions(selected.matches) };
        }
        if (
          nextOperation !== "add"
          && !dependencies.getBag().some((line) =>
            line.productSlug === resolved.product?.slug && line.variantId === selected.variant?.id,
          )
        ) {
          return { status: "error", message: "That product variant is not in the cart." };
        }

        if (nextOperation === "remove") dependencies.remove(resolved.product.slug, selected.variant.id);
        else {
          const nextQuantity = quantity === undefined ? 1 : quantity;
          if (!Number.isInteger(nextQuantity) || (nextQuantity as number) < 1) {
            return { status: "error", message: "Quantity must be a positive integer." };
          }
          if (nextOperation === "add") {
            dependencies.add({ productSlug: resolved.product.slug, variantId: selected.variant.id, quantity: nextQuantity as number });
          } else {
            dependencies.setQuantity(resolved.product.slug, selected.variant.id, nextQuantity as number);
          }
        }
        return { status: "success", ...getCart() };
      },
    },
    {
      name: "cancel_cart",
      description: "Remove every item from the shopper's cart.",
      inputSchema: emptySchema,
      annotations: changesState,
      execute: () => {
        dependencies.clear();
        return { status: "success", ...getCart() };
      },
    },
    {
      name: "proceed_to_checkout",
      description: "Display simulated checkout for the shopper after confirming that their cart contains items.",
      inputSchema: emptySchema,
      annotations: changesState,
      execute: () => {
        if (!dependencies.getBag().length) return { status: "error", message: "The cart is empty. Add an item before checkout." };
        dependencies.navigate("/checkout");
        return { status: "success", checkoutUrl: "/checkout" };
      },
    },
    {
      name: "manage_orders",
      description: "Get locally stored simulated orders and display the demo order history page.",
      inputSchema: emptySchema,
      annotations: readOnly,
      execute: () => {
        dependencies.navigate("/orders");
        return { orders: dependencies.getOrders(), ordersUrl: "/orders" };
      },
    },
    {
      name: "search_shop_policies_and_faqs",
      description: "Search this store's fictional policies and service information, including returns, delivery, and opening hours.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string", description: "Policy or service question." } },
        required: ["query"],
      },
      annotations: readOnly,
      execute: ({ query }) => {
        const q = text(query);
        if (!q) return { status: "error", message: "Provide a policy or service question." };
        return {
          results: storePolicies.filter(({ title, content }) => matchesSearchQuery(q, [title, content])),
          pageUrl: "/policies",
        };
      },
    },
  ];
}

export function registerWebMcpTools(context: ModelContext, tools: WebMcpTool[], enabled: boolean) {
  if (!enabled) return () => {};
  const controller = new AbortController();
  tools.forEach((tool) => { void context.registerTool(tool, { signal: controller.signal }); });
  return () => controller.abort();
}
