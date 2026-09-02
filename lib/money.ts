export function formatMoney(amountMinor: number, currency: "EUR") {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amountMinor / 100);
}
