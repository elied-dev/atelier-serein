export function isImprovedVersion(value: string | undefined) {
  return value === "true";
}

export const site = {
  name: "Atelier Serein",
  positioning: "Quiet contemporary luxury, shaped by material and craft.",
  demoNotice: "Atelier Serein is a fictional demonstration storefront.",
  checkoutNotice: "Demo only. Nothing will be charged or shipped.",
} as const;

export const storePolicies = [
  {
    title: "Returns",
    content: "Because this is a fictional demonstration store, purchases and returns are not processed.",
  },
  {
    title: "Delivery",
    content: "Shipping and delivery are not available. Checkout is simulated and collects no payment information.",
  },
  {
    title: "Privacy",
    content: "Delivery details are used only for the current simulated checkout and are not stored in order history.",
  },
  {
    title: "Opening hours",
    content: "The demonstration storefront is available online at any time and has no physical boutique.",
  },
] as const;
