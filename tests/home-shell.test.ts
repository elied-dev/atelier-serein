import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("home shell", () => {
  it("keeps the collection call to action touch friendly", () => {
    const page = HomePage() as { props: { children: Array<{ props: Record<string, string> }> } };
    const [, , callToAction] = page.props.children;

    expect(callToAction.props.className).toContain("inline-flex");
    expect(callToAction.props.className).toContain("min-h-11");
    expect(callToAction.props.className).toContain("items-center");
  });
});
