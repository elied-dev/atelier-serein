import { Children, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import RootLayout from "@/app/layout";

vi.mock("next/font/google", () => ({
  Cormorant_Garamond: () => ({ variable: "display-font" }),
  Inter: () => ({ variable: "sans-font" }),
}));
vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("@/lib/product-repository", () => ({ listProducts: vi.fn().mockResolvedValue([]) }));

const originalSectionId = process.env.SECTION_ID;

afterEach(() => {
  if (originalSectionId === undefined) delete process.env.SECTION_ID;
  else process.env.SECTION_ID = originalSectionId;
});

it("defers the global Dynamic Yield APIs so the page context executes first", async () => {
  process.env.SECTION_ID = "12345";

  const document = await RootLayout({ children: null });
  const head = Children.toArray(document.props.children)[0];
  if (!isValidElement<{ children: ReactNode }>(head)) throw new Error("Missing head");

  const [cdn, staticAssets, recommendations, dynamicScript, staticScript] = Children.toArray(
    head.props.children,
  );
  const headLinks = renderToStaticMarkup(<>{cdn}{staticAssets}{recommendations}</>);
  expect(headLinks).toBe(
    '<link rel="preconnect" href="//cdn.dynamicyield.com"/>' +
      '<link rel="preconnect" href="//st.dynamicyield.com"/>' +
      '<link rel="preconnect" href="//rcom.dynamicyield.com"/>',
  );

  type ScriptProps = { defer?: boolean; src?: string; type?: string };
  if (!isValidElement<ScriptProps>(dynamicScript) || !isValidElement<ScriptProps>(staticScript)) {
    throw new Error("Missing Dynamic Yield scripts");
  }

  expect(dynamicScript.props).toMatchObject({
    defer: true,
    src: "//cdn.dynamicyield.com/api/12345/api_dynamic.js",
    type: "text/javascript",
  });
  expect(staticScript.props).toMatchObject({
    defer: true,
    src: "//cdn.dynamicyield.com/api/12345/api_static.js",
    type: "text/javascript",
  });
});
