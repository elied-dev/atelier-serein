import path from "node:path";
import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": path.resolve(rootDir) } },
  test: { environment: "node", exclude: [...configDefaults.exclude, ".worktrees/**"] },
});
