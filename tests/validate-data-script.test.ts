import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("validate:data script", () => {
  it("reports the valid catalog size", () => {
    const output = execFileSync(process.execPath, ["scripts/validate-data.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    expect(output).toContain("Validated 95 products");
  });

  it("fails gracefully on malformed JSON", () => {
    const root = mkdtempSync(join(tmpdir(), "atelier-validate-"));
    mkdirSync(join(root, "scripts"), { recursive: true });
    mkdirSync(join(root, "data"), { recursive: true });
    writeFileSync(
      join(root, "scripts/validate-data.mjs"),
      readFileSync(new URL("../scripts/validate-data.mjs", import.meta.url), "utf8")
    );
    writeFileSync(join(root, "data/products.json"), "{");

    const result = spawnSync(process.execPath, [realpathSync(join(root, "scripts/validate-data.mjs"))], {
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("invalid catalog JSON:");
  });
});
