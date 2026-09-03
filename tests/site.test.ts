import { describe, expect, it } from "vitest";
import { isImprovedVersion, site } from "@/lib/site";

describe("site copy", () => {
  it("makes the fictional and simulated nature explicit", () => {
    expect(site.name).toBe("Vibemart");
    expect(site.demoNotice).toContain("fictional demonstration");
    expect(site.checkoutNotice).toContain("Nothing will be charged or shipped");
  });

  it.each([
    ["true", true],
    ["false", false],
    ["TRUE", false],
    [undefined, false],
  ])("treats WEBMCP_IMPROVED=%s as %s", (value, expected) => {
    expect(isImprovedVersion(value)).toBe(expected);
  });
});
