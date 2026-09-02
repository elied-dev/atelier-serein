import { BAG_VERSION, bagSubtotal, parseStoredBag, type BagLine } from "@/lib/bag";
import type { Product } from "@/lib/products";

export const ORDER_KEY = "atelier-serein-orders-v1";
const ORDER_VERSION = 1;

type OrderStorage = Pick<Storage, "getItem" | "setItem">;

export type DemoOrder = {
  reference: string;
  createdAt: string;
  lines: BagLine[];
  total: number;
};

export function parseStoredOrders(raw: string | null, products: Product[]): DemoOrder[] {
  try {
    const value = JSON.parse(raw || "null");
    if (value?.version !== ORDER_VERSION || !Array.isArray(value.orders)) return [];

    return value.orders.flatMap((order: DemoOrder) => {
      if (typeof order?.reference !== "string" || typeof order?.createdAt !== "string") return [];
      const lines = parseStoredBag(JSON.stringify({ version: BAG_VERSION, lines: order.lines }), products);
      if (!lines.length || lines.length !== order.lines?.length) return [];
      return [{ ...order, lines, total: bagSubtotal(lines, products) }];
    });
  } catch {
    return [];
  }
}

export function readOrders(storage: Pick<OrderStorage, "getItem">, products: Product[]) {
  return parseStoredOrders(storage.getItem(ORDER_KEY), products);
}

export function recordOrder(
  storage: OrderStorage,
  lines: BagLine[],
  products: Product[],
  reference: string,
  now = new Date(),
): DemoOrder {
  const order = { reference, createdAt: now.toISOString(), lines, total: bagSubtotal(lines, products) };
  storage.setItem(ORDER_KEY, JSON.stringify({
    version: ORDER_VERSION,
    orders: [order, ...readOrders(storage, products)],
  }));
  return order;
}
