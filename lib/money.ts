import type { Currency } from "@/lib/products";

export function formatMoney(amountMinor: number, currency: Currency) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amountMinor / 100);
}
