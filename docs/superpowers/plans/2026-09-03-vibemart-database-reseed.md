# Vibemart Database Reseed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the PostgreSQL product catalog with the 160 products in `data/products_vibemart.json` and make future seeds perform the same exact replacement.

**Architecture:** Expand the validated product contract and Prisma schema only where the Vibemart fixture requires it. The seed validates first, then atomically deletes and recreates all product rows; a post-commit read verifies exact fixture equality.

**Tech Stack:** TypeScript 5, Vitest 4, Prisma ORM 7.10, PostgreSQL/Neon, `@prisma/adapter-pg`

**Spec:** `docs/superpowers/specs/2026-09-03-vibemart-database-reseed-design.md`

## Global Constraints

- Preserve the Prisma schema, `_prisma_migrations`, and all non-product database metadata.
- Use `data/products_vibemart.json` as the repeatable seed source.
- Validate the entire fixture before any database write.
- Delete and recreate all `Product` rows in one transaction.
- Do not print or commit database credentials.
- Do not update storefront navigation, category copy, or Dynamic Yield configuration except where compilation requires a type adjustment.

---

## File map

- `data/products_vibemart.json`: authoritative 160-product seed fixture.
- `lib/products.ts`: product-domain unions shared by database mapping and UI code.
- `scripts/validate-data.mjs`: trust-boundary validation for both legacy and Vibemart fixtures.
- `prisma/schema.prisma`: database-supported categories, currencies, and badge storage.
- `prisma/migrations/20260903_vibemart_catalog/migration.sql`: non-destructive schema conversion.
- `lib/product-record.ts`: conversion between the domain object and Prisma row.
- `lib/money.ts`: formatting for both EUR and USD product prices.
- `app/collection/[category]/page.tsx`: keep the existing four collection-story keys type-safe after widening `ProductCategory`.
- `prisma/seed.ts`: atomic full-catalog replacement and equality verification.
- `tests/validate-data.test.mjs`, `tests/product-record.test.ts`, `tests/catalog.test.ts`, `tests/seed.test.ts`: focused regression coverage.

---

### Task 1: Support the Vibemart catalog contract

**Files:**
- Modify: `lib/products.ts`
- Modify: `scripts/validate-data.mjs`
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260903_vibemart_catalog/migration.sql`
- Modify: `lib/product-record.ts`
- Modify: `lib/money.ts`
- Modify: `app/collection/[category]/page.tsx`
- Modify: `tests/validate-data.test.mjs`
- Modify: `tests/product-record.test.ts`
- Modify: `tests/catalog.test.ts`
- Add to version control: `data/products_vibemart.json`

**Interfaces:**
- Consumes: existing `Product`, `validateProducts`, `productToRecord`, `productFromRecord`, and `formatMoney` APIs.
- Produces: `ProductCategory`, `Currency`, `DimensionUnit`, and `ProductBadge` unions that include both legacy and Vibemart values; a Prisma `Product` model able to persist the new fixture.

- [ ] **Step 1: Write failing catalog-contract tests**

Add this import to `tests/validate-data.test.mjs`:

```js
const vibemartProducts = JSON.parse(
  readFileSync(new URL("../data/products_vibemart.json", import.meta.url), "utf8"),
);
```

Add this test:

```js
it("accepts the complete Vibemart catalog", () => {
  expect(vibemartProducts).toHaveLength(160);
  expect(validateProducts(vibemartProducts)).toEqual([]);
});
```

Change the malformed contract expectations to the new stable messages:

```js
"vesper-tote: dimensions must use cm or in with positive numeric values",
"vesper-tote: invalid badge sale",
```

In `tests/product-record.test.ts`, change the fixture import to:

```ts
import products from "@/data/products_vibemart.json";
```

In `tests/catalog.test.ts`, extend the existing money-formatting test with:

```ts
expect(formatMoney(37900, "USD")).toBe(
  new Intl.NumberFormat("en", { style: "currency", currency: "USD" }).format(379),
);
```

- [ ] **Step 2: Run the focused tests and confirm the expected failures**

Run:

```bash
npm test -- tests/validate-data.test.mjs tests/product-record.test.ts tests/catalog.test.ts
```

Expected: `accepts the complete Vibemart catalog` fails on category, USD, inch, and badge validation; TypeScript-facing tests cannot yet represent all new values.

- [ ] **Step 3: Extend the product-domain unions**

Replace the narrow unions in `lib/products.ts` with:

```ts
export type ProductCategory =
  | "bags" | "jewelry" | "watches" | "fragrance"
  | "travel" | "electronics" | "home" | "clothing"
  | "outdoor" | "beauty" | "kids" | "office";
export type Currency = "EUR" | "USD";
export type DimensionUnit = "cm" | "in";
export type ProductBadge =
  | "new" | "exclusive" | "limited"
  | "best-seller" | "best-value" | "business-travel-pick"
  | "category-pick" | "extra-capacity" | "family-favorite"
  | "premium-choice" | "premium-pick" | "vibemart-exclusive";
```

Use those aliases in `Product`:

```ts
price: { amountMinor: number; currency: Currency };
dimensions: { width?: number; height?: number; depth?: number; unit: DimensionUnit };
badges: ProductBadge[];
```

- [ ] **Step 4: Extend validation without weakening unknown-value rejection**

In `scripts/validate-data.mjs`, replace the value sets with:

```js
const categories = new Set([
  "bags", "jewelry", "watches", "fragrance",
  "travel", "electronics", "home", "clothing",
  "outdoor", "beauty", "kids", "office",
]);
const currencies = new Set(["EUR", "USD"]);
const units = new Set(["cm", "in"]);
const badges = new Set([
  "new", "exclusive", "limited",
  "best-seller", "best-value", "business-travel-pick",
  "category-pick", "extra-capacity", "family-favorite",
  "premium-choice", "premium-pick", "vibemart-exclusive",
]);
```

Update the two checks and messages:

```js
function validDimensions(value) {
  return record(value)
    && units.has(value.unit)
    && ["width", "height", "depth"].every((key) => value[key] === undefined || positiveNumber(value[key]));
}

if (!record(product.price) || !Number.isInteger(product.price.amountMinor) || product.price.amountMinor <= 0 || !currencies.has(product.price.currency)) {
  errors.push(`${label}: price must be a positive integer in EUR or USD`);
}

if (!validDimensions(product.dimensions)) errors.push(`${label}: dimensions must use cm or in with positive numeric values`);
if (!Array.isArray(product.badges)) errors.push(`${label}: badges must be an array`);
else for (const badge of product.badges) if (!badges.has(badge)) errors.push(`${label}: invalid badge ${badge}`);
```

- [ ] **Step 5: Update Prisma schema and add the migration**

Extend the Prisma enums and use strings for validated badge values:

```prisma
enum ProductCategory {
  bags
  jewelry
  watches
  fragrance
  travel
  electronics
  home
  clothing
  outdoor
  beauty
  kids
  office
}

enum Currency {
  EUR
  USD
}
```

Delete the `ProductBadge` enum and change the model field to:

```prisma
badges String[]
```

Create `prisma/migrations/20260903_vibemart_catalog/migration.sql`:

```sql
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'travel';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'electronics';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'home';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'clothing';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'outdoor';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'beauty';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'kids';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'office';
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'USD';
ALTER TABLE "Product"
  ALTER COLUMN "badges" TYPE TEXT[]
  USING "badges"::TEXT::TEXT[];
DROP TYPE "ProductBadge";
```

- [ ] **Step 6: Make the database mapping and existing collection page type-safe**

In `lib/product-record.ts`, change the return type and badge read:

```ts
export function productToRecord(product: Product, sortOrder: number): Prisma.ProductCreateManyInput {
```

```ts
badges: record.badges as Product["badges"],
```

In `lib/money.ts`:

```ts
import type { Currency } from "@/lib/products";

export function formatMoney(amountMinor: number, currency: Currency) {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amountMinor / 100);
}
```

In `app/collection/[category]/page.tsx`, keep the existing page scope narrow:

```ts
type CollectionCategory = (typeof categories)[number];
const stories: Record<CollectionCategory, { eyebrow: string; title: string; copy: string }> = {
```

Use `CollectionCategory` rather than `ProductCategory` for all `categories.includes(...)`, `stories[...]`, and `selectedCategory` assertions. The final `filterProducts` call remains valid because `CollectionCategory` is a subset of `ProductCategory`.

- [ ] **Step 7: Generate the client and verify Task 1**

Run:

```bash
npm run db:generate
npm run db:validate
npm test -- tests/validate-data.test.mjs tests/product-record.test.ts tests/catalog.test.ts
npm run typecheck
```

Expected: Prisma reports a valid schema; all focused tests pass; TypeScript exits successfully.

- [ ] **Step 8: Commit the compatible catalog contract**

```bash
git add data/products_vibemart.json lib/products.ts scripts/validate-data.mjs prisma/schema.prisma prisma/migrations/20260903_vibemart_catalog/migration.sql lib/product-record.ts lib/money.ts 'app/collection/[category]/page.tsx' tests/validate-data.test.mjs tests/product-record.test.ts tests/catalog.test.ts
git commit -m "feat: support Vibemart product catalog"
```

---

### Task 2: Replace the complete product table during seeding

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `tests/seed.test.ts`

**Interfaces:**
- Consumes: `productToRecord(product: Product, sortOrder: number): Prisma.ProductCreateManyInput`, `validateProducts(fixture: unknown): string[]`, and `data/products_vibemart.json`.
- Produces: `seedProducts(fixture: unknown, prisma: PrismaClient): Promise<number>`, which validates before writes and atomically replaces the `Product` table.

- [ ] **Step 1: Write the failing replacement test**

Replace `tests/seed.test.ts` with:

```ts
import productsJson from "../data/products_vibemart.json";
import { describe, expect, it, vi } from "vitest";
import { productToRecord } from "../lib/product-record";
import type { Product } from "../lib/products";
import { seedProducts } from "../prisma/seed";

const products = productsJson as Product[];

describe("seedProducts", () => {
  it("rejects malformed fixture data before starting a database transaction", async () => {
    const transaction = vi.fn();

    await expect(seedProducts([{}], { $transaction: transaction } as never))
      .rejects.toThrow("Invalid product seed fixture");
    expect(transaction).not.toHaveBeenCalled();
  });

  it("deletes old products before inserting and verifying the complete fixture", async () => {
    const calls: string[] = [];
    const deleteMany = vi.fn(async () => { calls.push("delete"); });
    const createMany = vi.fn(async ({ data }: { data: unknown[] }) => {
      calls.push("create");
      expect(data).toHaveLength(160);
    });
    const records = products.map(productToRecord);
    const prisma = {
      $transaction: vi.fn(async (operation: (tx: unknown) => Promise<void>) => operation({ product: { deleteMany, createMany } })),
      product: { findMany: vi.fn(async () => records) },
    };

    await expect(seedProducts(products, prisma as never)).resolves.toBe(160);
    expect(calls).toEqual(["delete", "create"]);
  });
});
```

- [ ] **Step 2: Run the seed test and confirm it fails for the missing callback transaction**

Run:

```bash
npm test -- tests/seed.test.ts
```

Expected: the replacement test fails because the current seed passes an array of upserts and never calls `deleteMany` or `createMany`.

- [ ] **Step 3: Implement the minimal atomic replacement**

Change the fixture import in `prisma/seed.ts`:

```ts
import productsJson from "../data/products_vibemart.json";
```

Replace the upsert transaction with:

```ts
const products = fixture as Product[];
const records = products.map(productToRecord);
await prisma.$transaction(async (tx) => {
  await tx.product.deleteMany();
  await tx.product.createMany({ data: records });
}, { timeout: 30_000 });
```

Verify all rows rather than filtering fixture IDs:

```ts
const stored = await prisma.product.findMany({ orderBy: { sortOrder: "asc" } });
```

Update the mismatch message:

```ts
throw new Error("Seeded products do not match data/products_vibemart.json");
```

- [ ] **Step 4: Run focused and full local verification**

Run:

```bash
npm test -- tests/seed.test.ts tests/product-record.test.ts tests/validate-data.test.mjs
npm test
npm run typecheck
npm run lint
```

Expected: all commands exit successfully with zero failed tests and zero lint/type errors.

- [ ] **Step 5: Commit the replacement seed**

```bash
git add prisma/seed.ts tests/seed.test.ts
git commit -m "feat: replace products during database seed"
```

---

### Task 3: Migrate, reseed, and verify the configured database

**Files:**
- No source changes expected.

**Interfaces:**
- Consumes: `DATABASE_URL_UNPOOLED`, committed Prisma migrations, and `npm run db:seed`.
- Produces: a current database containing exactly the 160 Vibemart fixture products.

- [ ] **Step 1: Confirm the target and pending migration without exposing credentials**

Run:

```bash
npm run db:status
```

Expected: output identifies the PostgreSQL database and reports `20260903_vibemart_catalog` as pending; no connection URL is printed.

- [ ] **Step 2: Apply the schema migration**

Run:

```bash
npm run db:deploy
```

Expected: Prisma applies `20260903_vibemart_catalog` successfully.

- [ ] **Step 3: Replace and verify the product catalog through the seed command**

Run:

```bash
npm run db:seed
```

Expected:

```text
Seeded and verified 160 products
```

- [ ] **Step 4: Independently compare database rows with the fixture**

Run:

```bash
npx tsx - <<'TS'
import "dotenv/config";
import { isDeepStrictEqual } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import productsJson from "./data/products_vibemart.json";
import { PrismaClient } from "./generated/prisma/client";
import { productFromRecord } from "./lib/product-record";

const connectionString = process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) throw new Error("DATABASE_URL_UNPOOLED is required");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
try {
  const rows = await prisma.product.findMany({ orderBy: { sortOrder: "asc" } });
  const products = rows.map(productFromRecord);
  if (rows.length !== 160) throw new Error(`Expected 160 rows, found ${rows.length}`);
  if (!isDeepStrictEqual(products, productsJson)) throw new Error("Database catalog differs from products_vibemart.json");
  if (rows.some(({ sku }) => sku.startsWith("AS-"))) throw new Error("Old Atelier Serein products remain");
  if (new Set(rows.map(({ sku }) => sku)).size !== 160) throw new Error("Duplicate SKUs found");
  console.log("Verified 160 Vibemart products and no Atelier Serein products");
} finally {
  await prisma.$disconnect();
}
TS
```

Expected:

```text
Verified 160 Vibemart products and no Atelier Serein products
```

- [ ] **Step 5: Confirm migration history is current**

Run:

```bash
npm run db:status
git status --short
```

Expected: Prisma reports the database schema is up to date. Git shows no unexpected generated or credential files; `data/products_vibemart_dy.json` may remain untracked from the preceding catalog-export task.
