import { describe, expect, it } from "vitest";
import { site } from "@/lib/site";

describe("site copy", () => {
  it("makes the fictional and simulated nature explicit", () => {
    expect(site.name).toBe("Atelier Serein");
    expect(site.demoNotice).toContain("fictional demonstration");
    expect(site.checkoutNotice).toContain("Nothing will be charged or shipped");
  });
});
