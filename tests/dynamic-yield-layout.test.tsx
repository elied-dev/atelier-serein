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

it("renders the production Dynamic Yield bootstrap in head using SECTION_ID", async () => {
  process.env.SECTION_ID = "12345";

  const document = await RootLayout({ children: null });
  const head = Children.toArray(document.props.children)[0];
  if (!isValidElement<{ children: ReactNode }>(head)) throw new Error("Missing head");

  const [cdn, staticAssets, recommendations, initScript, dynamicScript, staticScript] = Children.toArray(
    head.props.children,
  );
  const headLinks = renderToStaticMarkup(<>{cdn}{staticAssets}{recommendations}</>);
  expect(headLinks).toBe(
    '<link rel="preconnect" href="//cdn.dynamicyield.com"/>' +
      '<link rel="preconnect" href="//st.dynamicyield.com"/>' +
      '<link rel="preconnect" href="//rcom.dynamicyield.com"/>',
  );

  type ScriptProps = { children?: ReactNode; src?: string; strategy?: string; type?: string };
  if (
    !isValidElement<ScriptProps>(initScript) ||
    !isValidElement<ScriptProps>(dynamicScript) ||
    !isValidElement<ScriptProps>(staticScript)
  ) throw new Error("Missing Dynamic Yield scripts");

  expect(initScript.props).toMatchObject({ strategy: "beforeInteractive", type: "text/javascript" });
  expect(initScript.props.children).toContain("window.DY = window.DY || {};");
  expect(dynamicScript.props).toMatchObject({
    src: "//cdn.dynamicyield.com/api/12345/api_dynamic.js",
    strategy: "beforeInteractive",
    type: "text/javascript",
  });
  expect(staticScript.props).toMatchObject({
    src: "//cdn.dynamicyield.com/api/12345/api_static.js",
    strategy: "beforeInteractive",
    type: "text/javascript",
  });
});
