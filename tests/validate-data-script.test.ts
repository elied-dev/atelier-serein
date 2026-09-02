import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("validate:data script", () => {
  it("reports a valid empty catalog", () => {
    const output = execFileSync(process.execPath, ["scripts/validate-data.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    expect(output).toContain("Validated 0 products");
  });
});
