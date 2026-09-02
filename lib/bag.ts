import { findProduct } from "@/lib/catalog";

export const BAG_KEY = "atelier-serein-bag-v1";
export const BAG_VERSION = 1;

export type BagLine = {
  productSlug: string;
  variantId: string;
  quantity: number;
};

export type BagAction =
  | { type: "add"; line: BagLine }
  | { type: "quantity"; productSlug: string; variantId: string; quantity: number }
  | { type: "remove"; productSlug: string; variantId: string }
  | { type: "clear" };

const sameLine = (line: BagLine, productSlug: string, variantId: string) =>
  line.productSlug === productSlug && line.variantId === variantId;

export function bagReducer(lines: BagLine[], action: BagAction): BagLine[] {
  if (action.type === "clear") return [];
  if (action.type === "remove") {
    return lines.filter((line) => !sameLine(line, action.productSlug, action.variantId));
  }
  if (action.type === "quantity") {
    if (action.quantity <= 0) {
      return lines.filter((line) => !sameLine(line, action.productSlug, action.variantId));
    }
    return lines.map((line) =>
      sameLine(line, action.productSlug, action.variantId) ? { ...line, quantity: action.quantity } : line,
    );
  }

  const index = lines.findIndex((line) => sameLine(line, action.line.productSlug, action.line.variantId));
  if (index < 0) return [...lines, action.line];
  return lines.map((line, current) =>
    current === index ? { ...line, quantity: line.quantity + action.line.quantity } : line,
  );
}

export function parseStoredBag(raw: string | null): BagLine[] {
  try {
    const value = JSON.parse(raw || "null");
    if (value?.version !== BAG_VERSION || !Array.isArray(value.lines)) return [];

    return value.lines.filter((line: BagLine) => {
      const product = typeof line?.productSlug === "string" ? findProduct(line.productSlug) : undefined;
      return (
        Boolean(product?.variants.some((variant) => variant.id === line?.variantId))
        && Number.isInteger(line?.quantity)
        && line.quantity > 0
      );
    });
  } catch {
    return [];
  }
}

export function bagSubtotal(lines: BagLine[]) {
  return lines.reduce(
    (total, line) => total + (findProduct(line.productSlug)?.price.amountMinor || 0) * line.quantity,
    0,
  );
}
