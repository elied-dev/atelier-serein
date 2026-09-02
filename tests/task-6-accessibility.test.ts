import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const chrome = readFileSync("components/site-chrome.tsx", "utf8");
const browser = readFileSync("components/product-browser.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");

function luminance(hex: string) {
  const channels = hex.match(/[\da-f]{2}/gi)!.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function declarationFor(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
}

describe("Task 6 accessibility regressions", () => {
  it("closes the persistent mobile sheet when either kind of navigation link is used", () => {
    expect(chrome.match(/<SheetClose(?:\s|>)/g)).toHaveLength(2);
  });

  it("keeps muted normal text at WCAG AA contrast against ivory", () => {
    const ivory = css.match(/--ivory:\s*(#[\da-f]{6})/i)?.[1];
    const stone = css.match(/--stone:\s*(#[\da-f]{6})/i)?.[1];

    expect(ivory).toBeDefined();
    expect(stone).toBeDefined();
    expect(contrast(stone!, ivory!)).toBeGreaterThanOrEqual(4.5);
  });

  it("does not link to the cancelled credits page", () => {
    expect(chrome).not.toContain('href="/credits"');
  });

  it("provides an h2 before listing-card h3 headings", () => {
    expect(browser).toContain('<h2 className="sr-only">Products</h2>');
  });

  it.each([".product-meta h3 a", ".breadcrumbs a", ".bag-line-copy h2 a", ".site-footer nav a"])(
    "gives %s a rendered 44px touch target",
    (selector) => {
      const declaration = declarationFor(selector);
      expect(declaration).toMatch(/display:\s*inline-flex/);
      expect(declaration).toMatch(/align-items:\s*center/);
      expect(declaration).toMatch(/min-height:\s*44px/);
    },
  );
});
