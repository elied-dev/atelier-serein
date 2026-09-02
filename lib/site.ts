export function isImprovedVersion(value: string | undefined) {
  return value === "true";
}

export const site = {
  name: "Atelier Serein",
  positioning: "Quiet contemporary luxury, shaped by material and craft.",
  demoNotice: "Atelier Serein is a fictional demonstration storefront.",
  checkoutNotice: "Demo only. Nothing will be charged or shipped.",
} as const;
