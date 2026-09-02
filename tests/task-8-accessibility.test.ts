import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const checkoutPage = readFileSync("app/checkout/page.tsx", "utf8");

describe("Task 8 accessibility regressions", () => {
  it("shows the no-charge and no-shipment notice when the bag is empty", () => {
    const emptyState = checkoutPage.match(/if \(lines\.length === 0\) \{([\s\S]*?)\n  \}/)?.[1];
    expect(emptyState).toContain("{site.checkoutNotice}");
  });

  it("moves focus to the programmatically focusable confirmation heading", () => {
    expect(checkoutPage).toContain("confirmationHeading.current?.focus()");
    expect(checkoutPage).toMatch(/<h1 ref=\{confirmationHeading\} tabIndex=\{-1\}>Thank you<\/h1>/);
  });
});
