import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("validate:data script", () => {
  it("runs during scaffold stage", () => {
    const output = execFileSync(process.execPath, ["scripts/validate-data.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    expect(output).toContain("No catalog data to validate yet.");
  });
});
