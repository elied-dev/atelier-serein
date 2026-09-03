# Database-Backed Products Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all 95 fixture products into Neon PostgreSQL and make the storefront, read-only API, cart/order calculations, and WebMCP consume database-loaded products.

**Architecture:** Prisma maps one hybrid `Product` table to the existing serializable `Product` domain type. Server Components and Route Handlers read through a server-only repository; the root layout passes the catalog into a client context for browser-only cart, order, comparison, and WebMCP behavior. `data/products.json` remains only as validated seed input.

**Tech Stack:** Next.js 16.3.3 App Router, React 19.2.8, TypeScript 5, Prisma ORM 7.10.0, `@prisma/adapter-pg` 7.10.0, Neon PostgreSQL, Vitest 4.1.11

**Spec:** `docs/superpowers/specs/2026-09-02-database-products-design.md`

## Global Constraints

- Continue in the current checkout; do not create a worktree.
- Preserve the pre-existing executable-bit-only change on `components/product-browser.tsx`; do not include that mode change in a commit.
- Preserve unrelated untracked files under `docs/superpowers/plans/`.
- Never stage, commit, print, or copy `.env` credentials into tracked files.
- Keep `data/products.json` as seed/test data, but remove every runtime application import of it.
- Keep existing product and WebMCP response shapes unchanged.
- Use `DATABASE_URL` for application traffic and `DATABASE_URL_UNPOOLED` for migrations and seeding.
- Do not add CRUD endpoints, authentication, normalized child tables, pagination, persistent caching, or database-backed orders.
- Do not delete database-only product records during seeding.
- Run database mutation commands only while the VPN is disabled and direct Neon port 5432 is reachable.
- Do not add a Mastercard CA override: the observed failure is a pre-TLS TCP timeout and the supplied URLs already require TLS.

---

### Task 1: Prisma Product Model and Row Mapping

**Files:**
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `prisma/schema.prisma`
- Modify: `prisma.config.ts`
- Create: `lib/db.ts`
- Create: `lib/product-record.ts`
- Create: `tests/product-record.test.ts`
- Generated but ignored: `generated/prisma/`

**Interfaces:**
- Produces: `prisma` singleton; `productToRecord(product: Product, sortOrder: number): Prisma.ProductCreateInput`; `productFromRecord(row: ProductRecord): Product`.
- Consumes: existing `Product`, `ProductVariant`, and `ProductImage` types from `lib/products.ts`.

- [ ] **Step 1: Install exact runtime and seed dependencies**

```bash
npm install --save-exact @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0
npm install --save-dev --save-exact tsx@4.23.13
```

Expected: Prisma Client and the PostgreSQL adapter are production dependencies; `tsx` is a development dependency.

- [ ] **Step 2: Write the failing row-mapping test**

Create `tests/product-record.test.ts`:

```ts
import products from "@/data/products.json";
import { describe, expect, it } from "vitest";
import { productFromRecord, productToRecord } from "@/lib/product-record";
import type { Product } from "@/lib/products";
import type { Product as ProductRecord } from "@/generated/prisma/client";

const fixture = products[0] as Product;

describe("product database mapping", () => {
  it("round-trips the complete product without exposing database sort order", () => {
    const record = productToRecord(fixture, 7) as ProductRecord;
    expect(record.sortOrder).toBe(7);
    expect(productFromRecord(record)).toEqual(fixture);
  });
});
```

- [ ] **Step 3: Run the mapping test and verify RED**

```bash
npm test -- tests/product-record.test.ts
```

Expected: FAIL because the mapper and generated Prisma client do not exist.

- [ ] **Step 4: Define the Prisma generator and hybrid product model**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum ProductCategory {
  bags
  jewelry
  watches
  fragrance
}

enum Currency {
  EUR
}

enum ProductBadge {
  new
  exclusive
  limited
}

model Product {
  id             String          @id
  slug           String          @unique
  sku            String          @unique
  sortOrder      Int
  name           String
  category       ProductCategory
  collection     String
  tagline        String
  description    String          @db.Text
  story          String          @db.Text
  amountMinor    Int
  currency       Currency        @default(EUR)
  variants       Json
  materials      String[]
  craftsmanship String[]
  dimensions     Json
  weightGrams    Int?
  origin         String
  care           String[]
  styleTags      String[]
  occasions      String[]
  features       String[]
  badges         ProductBadge[]
  featured       Boolean         @default(false)
  images         Json
  relatedSlugs   String[]
}
```

`sortOrder` preserves fixture order used by the homepage and catalog.

- [ ] **Step 5: Configure generation and seeding**

In `prisma.config.ts`, replace the one-line migrations value with:

```ts
migrations: {
  path: "prisma/migrations",
  seed: "tsx prisma/seed.ts",
},
```

Add these `package.json` scripts without replacing existing scripts:

```json
"postinstall": "prisma generate",
"db:generate": "prisma generate",
"db:seed": "prisma db seed"
```

Add to `.gitignore`:

```gitignore
/generated/prisma/
```

- [ ] **Step 6: Generate Prisma Client**

```bash
npm run db:generate
git check-ignore -v generated/prisma/client.ts
```

Expected: client generation succeeds and the generated output is ignored.

- [ ] **Step 7: Implement the pure row mapper**

Create `lib/product-record.ts`:

```ts
import type { Prisma, Product as ProductRecord } from "@/generated/prisma/client";
import type { Product, ProductImage, ProductVariant } from "@/lib/products";

export function productToRecord(product: Product, sortOrder: number): Prisma.ProductCreateInput {
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    sortOrder,
    name: product.name,
    category: product.category,
    collection: product.collection,
    tagline: product.tagline,
    description: product.description,
    story: product.story,
    amountMinor: product.price.amountMinor,
    currency: product.price.currency,
    variants: product.variants as unknown as Prisma.InputJsonValue,
    materials: product.materials,
    craftsmanship: product.craftsmanship,
    dimensions: product.dimensions as unknown as Prisma.InputJsonValue,
    weightGrams: product.weightGrams,
    origin: product.origin,
    care: product.care,
    styleTags: product.styleTags,
    occasions: product.occasions,
    features: product.features,
    badges: product.badges,
    featured: product.featured,
    images: product.images as unknown as Prisma.InputJsonValue,
    relatedSlugs: product.relatedSlugs,
  };
}

export function productFromRecord(record: ProductRecord): Product {
  return {
    id: record.id,
    slug: record.slug,
    sku: record.sku,
    name: record.name,
    category: record.category,
    collection: record.collection,
    tagline: record.tagline,
    description: record.description,
    story: record.story,
    price: { amountMinor: record.amountMinor, currency: record.currency },
    variants: record.variants as unknown as ProductVariant[],
    materials: record.materials,
    craftsmanship: record.craftsmanship,
    dimensions: record.dimensions as unknown as Product["dimensions"],
    ...(record.weightGrams === null ? {} : { weightGrams: record.weightGrams }),
    origin: record.origin,
    care: record.care,
    styleTags: record.styleTags,
    occasions: record.occasions,
    features: record.features,
    badges: record.badges,
    featured: record.featured,
    images: record.images as unknown as ProductImage[],
    relatedSlugs: record.relatedSlugs,
  };
}
```

- [ ] **Step 8: Add the server-only Prisma singleton**

Create `lib/db.ts`:

```ts
import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 9: Verify GREEN and commit**

```bash
npm test -- tests/product-record.test.ts
npm run db:validate
npm run typecheck
git add .gitignore package.json package-lock.json prisma/schema.prisma prisma.config.ts lib/db.ts lib/product-record.ts tests/product-record.test.ts
git diff --cached --check
! git diff --cached | rg 'npg_|postgresql://|PGPASSWORD=|POSTGRES_PASSWORD='
git commit -m "feat: add Prisma product model"
```

Expected: mapping, schema validation, and type checking pass; the commit contains no generated client or credentials.

---

### Task 2: Initial Migration and Idempotent Seed

**Files:**
- Create: `prisma/seed.ts`
- Create: `prisma/migrations/20260902170000_create_products/migration.sql`
- Seed/test input: `data/products.json`

**Interfaces:**
- Consumes: `productToRecord`, `productFromRecord`, `DATABASE_URL_UNPOOLED`, and validated product JSON.
- Produces: applied initial schema and repeatable `npm run db:seed` upserts.

- [ ] **Step 1: Verify fixture validation and direct connectivity before mutation**

```bash
npm run validate:data
printf 'SELECT 1;' | npx prisma db execute --stdin
```

Expected: `Validated 95 products` and `Script executed successfully`. Stop if either fails.

- [ ] **Step 2: Create the transactional seed**

Create `prisma/seed.ts`:

```ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import productsJson from "../data/products.json";
import { PrismaClient } from "../generated/prisma/client";
import { productFromRecord, productToRecord } from "../lib/product-record";
import type { Product } from "../lib/products";

const connectionString = process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) throw new Error("DATABASE_URL_UNPOOLED is required");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const products = productsJson as Product[];

async function main() {
  await prisma.$transaction(products.map((product, sortOrder) => {
    const data = productToRecord(product, sortOrder);
    return prisma.product.upsert({ where: { id: product.id }, create: data, update: data });
  }));

  const stored = await prisma.product.findMany({
    where: { id: { in: products.map(({ id }) => id) } },
    orderBy: { sortOrder: "asc" },
  });

  if (stored.length !== products.length) {
    throw new Error(`Expected ${products.length} seeded products, found ${stored.length}`);
  }
  if (JSON.stringify(stored.map(productFromRecord)) !== JSON.stringify(products)) {
    throw new Error("Seeded products do not match data/products.json");
  }

  console.log(`Seeded and verified ${stored.length} products`);
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
```

- [ ] **Step 3: Generate and inspect the initial migration**

```bash
mkdir -p prisma/migrations/20260902170000_create_products
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > prisma/migrations/20260902170000_create_products/migration.sql
test -s prisma/migrations/20260902170000_create_products/migration.sql
! rg -n 'DROP|TRUNCATE|DELETE' prisma/migrations/20260902170000_create_products/migration.sql
```

Expected: non-empty SQL containing only enum, table, and unique-index creation. Read the complete SQL before applying it.

- [ ] **Step 4: Apply, seed twice, and verify migration status**

```bash
npm run db:deploy
npm run db:seed
npm run db:seed
npm run db:status
```

Expected: migration status is current and both seed runs print `Seeded and verified 95 products`, proving idempotency without duplicates.

- [ ] **Step 5: Commit migration and seed**

```bash
git add prisma/seed.ts prisma/migrations/20260902170000_create_products/migration.sql
git diff --cached --check
git commit -m "feat: migrate product catalog to Neon"
```

---

### Task 3: Cut Every Runtime Consumer Over to Database Products

**Files:**
- Create: `lib/product-repository.ts`
- Create: `components/product-provider.tsx`
- Create: `app/api/products/route.ts`
- Create: `app/api/products/[slug]/route.ts`
- Create: `tests/products-api.test.ts`
- Modify: `lib/catalog.ts`
- Modify: `lib/bag.ts`
- Modify: `lib/orders.ts`
- Modify: `lib/checkout.ts`
- Modify: `lib/webmcp.ts`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/collection/page.tsx`
- Modify: `app/collection/[category]/page.tsx`
- Modify: `app/product/[slug]/page.tsx`
- Modify: `app/checkout/page.tsx`
- Modify: `app/orders/page.tsx`
- Modify: `components/bag-provider.tsx`
- Modify: `components/commerce.tsx`
- Modify: `components/product-browser.tsx`
- Modify: `components/webmcp-tools.tsx`
- Modify: `tests/catalog.test.ts`
- Modify: `tests/bag.test.ts`
- Modify: `tests/orders.test.ts`
- Modify: `tests/checkout.test.ts`
- Modify: `tests/webmcp.test.ts`
- Modify: `tests/webmcp-ui.test.tsx`

**Interfaces:**
- Produces: `listProducts(): Promise<Product[]>`, `getProductBySlug(slug: string): Promise<Product | undefined>`, `ProductProvider`, `useProducts(): Product[]`, `GET /api/products`, and `GET /api/products/[slug]`.
- Changes: catalog/bag/order/checkout functions require an explicit product array; `createWebMcpTools(dependencies, products)` receives database-loaded products.
- Removes: runtime imports of `data/products.json` and module-level `allProducts`.

- [ ] **Step 1: Change tests first to require explicit product sources**

Use `data/products.json` only in tests as `Product[]`. Update assertions and calls:

```ts
findProduct("vesper-tote", products)
filterProducts(query, products)
compareProducts(slugs, products)
relatedProducts(product, products)
productPageModel(slug, products)
imageCredits(products)
parseStoredBag(raw, products)
bagSubtotal(lines, products)
parseStoredOrders(raw, products)
readOrders(storage, products)
recordOrder(storage, lines, products, reference, now)
completeDemoCheckout(storage, lines, products, now, random)
createWebMcpTools(dependencies, products)
```

Create `tests/products-api.test.ts`:

```ts
import productsJson from "@/data/products.json";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/lib/products";

const mocks = vi.hoisted(() => ({ listProducts: vi.fn(), getProductBySlug: vi.fn() }));
vi.mock("@/lib/product-repository", () => mocks);

import { GET as list } from "@/app/api/products/route";
import { GET as getOne } from "@/app/api/products/[slug]/route";

const fixture = productsJson[0] as Product;

describe("product API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the database catalog", async () => {
    mocks.listProducts.mockResolvedValue([fixture]);
    const response = await list();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([fixture]);
  });

  it("returns one product or 404", async () => {
    mocks.getProductBySlug.mockResolvedValueOnce(fixture).mockResolvedValueOnce(undefined);
    const found = await getOne(new Request("http://test"), { params: Promise.resolve({ slug: fixture.slug }) });
    expect(await found.json()).toEqual(fixture);
    const missing = await getOne(new Request("http://test"), { params: Promise.resolve({ slug: "missing" }) });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "Product not found" });
  });
});
```

Wrap client UI test subjects with `<ProductProvider products={products}>` where they consume product context.

- [ ] **Step 2: Run the changed tests and verify RED**

```bash
npm test -- tests/catalog.test.ts tests/bag.test.ts tests/orders.test.ts tests/checkout.test.ts tests/products-api.test.ts tests/webmcp.test.ts tests/webmcp-ui.test.tsx
```

Expected: FAIL because explicit signatures, repository, API routes, and provider are not implemented.

- [ ] **Step 3: Make catalog and client calculations require products**

In `lib/catalog.ts`, remove the JSON import, `allProducts`, and module slug map. Require `source: Product[]` in:

```ts
findProduct(slug: string, source: Product[]): Product | undefined
filterProducts(query: CatalogQuery, source: Product[]): Product[]
compareProducts(slugs: string[], source: Product[]): Product[]
relatedProducts(product: Product, source: Product[]): Product[]
productPageModel(slug: string, source: Product[]): { product: Product; related: Product[] } | undefined
imageCredits(source: Product[]): ImageCredit[]
```

Use `source.find(...)` for slug lookup and pass `source` through all nested calls.

Change these signatures and pass products through every lookup/subtotal:

```ts
parseStoredBag(raw: string | null, products: Product[]): BagLine[]
bagSubtotal(lines: BagLine[], products: Product[]): number
parseStoredOrders(raw: string | null, products: Product[]): DemoOrder[]
readOrders(storage: Pick<OrderStorage, "getItem">, products: Product[]): DemoOrder[]
recordOrder(storage: OrderStorage, lines: BagLine[], products: Product[], reference: string, now?: Date): DemoOrder
completeDemoCheckout(storage, lines: BagLine[], products: Product[], now?: Date, random?: () => number): string
```

- [ ] **Step 4: Implement the server-only repository**

Create `lib/product-repository.ts`:

```ts
import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { productFromRecord } from "@/lib/product-record";

export const listProducts = cache(async () => {
  const rows = await prisma.product.findMany({ orderBy: { sortOrder: "asc" } });
  if (!rows.length) throw new Error("Product catalog is empty; run npm run db:seed");
  return rows.map(productFromRecord);
});

export const getProductBySlug = cache(async (slug: string) => {
  const row = await prisma.product.findUnique({ where: { slug } });
  return row ? productFromRecord(row) : undefined;
});
```

- [ ] **Step 5: Implement the read-only Route Handlers**

Create `app/api/products/route.ts`:

```ts
import { listProducts } from "@/lib/product-repository";

export async function GET() {
  return Response.json(await listProducts());
}
```

Create `app/api/products/[slug]/route.ts`:

```ts
import { getProductBySlug } from "@/lib/product-repository";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const product = await getProductBySlug((await params).slug);
  return product
    ? Response.json(product)
    : Response.json({ error: "Product not found" }, { status: 404 });
}
```

GET Route Handlers are dynamic by default in installed Next.js 16.3.

- [ ] **Step 6: Add the serializable client product context**

Create `components/product-provider.tsx`:

```tsx
"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Product } from "@/lib/products";

const ProductContext = createContext<Product[] | undefined>(undefined);

export function ProductProvider({ products, children }: { products: Product[]; children: ReactNode }) {
  return <ProductContext value={products}>{children}</ProductContext>;
}

export function useProducts() {
  const products = useContext(ProductContext);
  if (!products) throw new Error("useProducts must be used inside ProductProvider");
  return products;
}
```

- [ ] **Step 7: Load products at request time and update server pages**

Make `RootLayout` async, call `await connection()` from `next/server`, load `await listProducts()`, and wrap the current `BagProvider` subtree in `<ProductProvider products={products}>`.

Update server pages:

- `app/page.tsx`: async page using `await listProducts()`.
- `app/collection/page.tsx`: async page passing `await listProducts()` to `ProductBrowser`.
- `app/collection/[category]/page.tsx`: `filterProducts({ category }, await listProducts())`.
- `app/product/[slug]/page.tsx`: remove `generateStaticParams`; use `getProductBySlug` in metadata and `productPageModel(slug, await listProducts())` in the page.

Server pages call the repository directly, never their own HTTP API.

- [ ] **Step 8: Update browser consumers to use context products**

Call `useProducts()` in:

- `BagProvider` for storage validation;
- `BagEditor` for lookup and subtotal;
- checkout for subtotal and completed order totals;
- orders for stored-order validation and display;
- `CompareView` for selected product lookup;
- `WebMcpTools` for tool creation and local-order parsing.

Pass the product array to every function changed in Step 3.

- [ ] **Step 9: Inject products into WebMCP without changing tool behavior**

Change:

```ts
export function createWebMcpTools(
  dependencies: WebMcpDependencies,
  products: Product[],
): WebMcpTool[]
```

Remove `allProducts` from `lib/webmcp.ts`. Make `resolveProduct(value, products)` and `cartResult(lines, products)` use the supplied array. Pass the array to `findProduct` and `filterProducts`, and replace every `allProducts.filter(...)` with `products.filter(...)`.

In `components/webmcp-tools.tsx`, register `createWebMcpTools(dependencies, products)` and implement `getOrders` as `readOrders(localStorage, products)`. Include `products` in the effect dependencies. Keep all tools synchronous and preserve all ten names, schemas, annotations, result shapes, and navigation behavior.

- [ ] **Step 10: Verify the complete cutover is GREEN**

```bash
npm test -- tests/catalog.test.ts tests/bag.test.ts tests/orders.test.ts tests/checkout.test.ts tests/products-api.test.ts tests/webmcp.test.ts tests/webmcp-ui.test.tsx
npm run typecheck
npm test
! rg -n 'data/products\.json' app components lib
```

Expected: focused tests, typecheck, and full suite pass; no runtime file imports the JSON fixture.

- [ ] **Step 11: Commit all runtime cutover files while preserving the mode-only change**

Stage every Task 3 path. After staging `components/product-browser.tsx`, reset only its index mode so the earlier working-tree mode change remains uncommitted:

```bash
git update-index --chmod=-x components/product-browser.tsx
git diff --cached --check
! git diff --cached | rg 'npg_|postgresql://|PGPASSWORD=|POSTGRES_PASSWORD='
git commit -m "feat: serve product catalog from Neon"
```

Expected: the commit includes content changes but not the pre-existing executable-bit change.

---

### Task 4: Live Database, API, and Browser Verification

**Files:**
- No production changes expected.

**Interfaces:**
- Verifies: migration history, seeded data, both APIs, storefront pages, cart math, and DB-backed WebMCP inputs.

- [ ] **Step 1: Run all repository checks**

```bash
npm run db:validate
npm run db:status
npm run validate:data
npm run typecheck
npm test
npm run lint
npm run build
```

Expected: every command exits zero.

- [ ] **Step 2: Start the built application**

```bash
npm start
```

Use the port reported by Next.js. Do not expose `.env` values in logs.

- [ ] **Step 3: Smoke-test the read-only API**

Verify:

```text
GET /api/products                 -> 200, array length at least 95
GET /api/products/vesper-tote     -> 200, SKU AS-BAG-001, two variants
GET /api/products/not-a-product   -> 404, {"error":"Product not found"}
```

- [ ] **Step 4: Smoke-test storefront behavior**

Verify `/`, `/collection`, `/collection/bags`, `/product/vesper-tote`, `/compare?products=vesper-tote,serein-mini`, `/bag`, `/checkout`, and `/orders` render without console or network errors. Add Vesper Tote/Stone to the bag and confirm the subtotal remains EUR 2,850.00.

- [ ] **Step 5: Verify source and secret boundaries**

```bash
! rg -n 'data/products\.json' app components lib
! git grep -n -E 'npg_|postgresql://|PGPASSWORD=|POSTGRES_PASSWORD='
git check-ignore -v .env
git diff --check
git status --short
```

Expected: runtime code has no JSON catalog imports, tracked files have no credentials, `.env` is ignored, and only the pre-existing product-browser mode change plus plan artifacts remain outside feature commits.
