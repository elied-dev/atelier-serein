# Atelier Serein Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one polished fictional luxury storefront and deploy the same static website to three Vercel projects for a hackathon demonstration.

**Architecture:** Use a statically rendered Next.js App Router application backed by directly imported JSON. Keep catalog operations in `lib/catalog.ts`, local bag behavior in one guarded React context/reducer, and client code limited to filters, gallery controls, bag state, and checkout interaction. Use local licensed images and generate the credits page from the product metadata.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Vitest, Vercel

**Spec:** `FIRST_PLAN.md` (this self-contained rewrite preserves the original source requirements in the global constraints, task acceptance criteria, and release checklist below)

## Global Constraints

- The brand name is **Atelier Serein**, positioned as quiet contemporary luxury focused on material and craft.
- The four categories are exactly `bags`, `jewelry`, `watches`, and `fragrance`.
- All company names, products, SKUs, prices, descriptions, collections, and claims must be fictional.
- Every page must discreetly identify the website as a demonstration.
- Checkout must clearly state that nothing will be charged or shipped and must contain no payment fields.
- Build exactly 20 products: five products in each category.
- Product prices use integer EUR minor units and display through `Intl.NumberFormat`.
- Catalog pages are statically rendered; do not add API routes, Server Actions, middleware, or a runtime backend.
- Do not add authentication, accounts, real checkout, tax, shipping rates, inventory reservation, admin, CMS, ORM, database, reviews, wish lists, email, analytics, live search, live exchange rates, AI, chat, agents, recommendations, or model calls.
- Store local product search, category filters, other filters, and sorting in URL query parameters; do not add a search service.
- Store the bag in guarded, versioned local storage under `atelier-serein-bag-v1`; malformed or unsupported data resets safely.
- Use native HTML inputs and browser validation where sufficient.
- Use only the shadcn/ui components named in Task 1 and the icon package they install.
- Use local images only; no hotlinked product or editorial assets.
- Every image needs source, creator, license, review date, dimensions, alt text, and modification metadata.
- Reject logos, watermarks, recognizable protected designs, editorial-only restrictions, unclear authorship, and identifiable people without clear usage rights.
- Styling uses warm ivory, near-black, muted stone, oxblood, and restrained champagne; typography uses a display serif and readable sans-serif loaded through `next/font`.
- Respect `prefers-reduced-motion`; provide visible focus, semantic headings, labelled swatches, adequate contrast, keyboard operation, and 44px touch targets.
- Do not use fake scarcity timers, misleading sustainability claims, or a real brand’s visual identity.
- Publish the completed website to the private GitHub repository `elied-dev/atelier-serein` before any Vercel work.
- Deploy the same repository branch and commit to three Vercel projects; do not create market branches, market-specific content, or storefront copies.
- Three Vercel URLs do not prove region-pinned static hosting; do not add a meaningless regional server function.
- Do not add an end-to-end test framework unless one is already present.

## Execution Gates

1. **Documentation only now:** do not scaffold, install dependencies, create repositories, write website code, or configure deployments while this plan is being reviewed.
2. **Implementation gate:** begin Task 1 only after the owner explicitly says to start implementation.
3. **GitHub handoff:** after Tasks 1–9 pass, create or connect `elied-dev/atelier-serein` as a private GitHub repository and push the reviewed website code.
4. **Vercel gate:** do not open or configure Vercel until the owner gives a separate explicit go after the private GitHub handoff is complete.

## Required Customer Pages

- `/`: editorial home page.
- `/collection` and `/collection/[category]`: product listing with categories, local text search, filtering, sorting, result count, clear-all, and no-results state.
- `/product/[slug]`: product data, detailed description, variants, gallery, and related-product recommendations.
- `/bag`: local cart with variants, quantities, removal, subtotal, and empty state.
- `/checkout`: clearly simulated checkout with delivery fields and no payment processing.

## File Map

```text
app/
  bag/page.tsx                    # local bag editor
  checkout/page.tsx               # simulated delivery form and confirmation
  collection/[category]/page.tsx  # static category landing pages
  collection/page.tsx             # URL-backed catalog browser
  compare/page.tsx                # two- or three-product comparison
  credits/page.tsx                # image provenance generated from catalog data
  product/[slug]/page.tsx         # static product detail pages and 404 handling
  globals.css                     # palette, typography, focus, layout, reduced motion
  layout.tsx                      # fonts, metadata, providers, shared chrome
  page.tsx                        # editorial home page
components/
  bag-provider.tsx                # bag reducer, guarded persistence, context API
  commerce.tsx                    # product card/grid, gallery, variant and bag controls
  product-browser.tsx             # client-side filter/sort UI backed by URL state
  site-chrome.tsx                 # header, footer, demo disclaimer, bag count
  ui/                             # only installed shadcn/ui primitives
context/
  image-shot-list.md              # acquisition log and image acceptance evidence
  product-matrix.md               # fixed 20-product content matrix
  release-checklist.md            # manual accessibility and deployment evidence
data/
  products.json                   # catalog and image provenance
lib/
  bag.ts                          # bag types, reducer, parsing, subtotal
  catalog.ts                      # lookup, filtering, sorting, comparison, credits
  checkout.ts                     # delivery validation and fake confirmation reference
  money.ts                        # EUR formatting
  products.ts                     # Product and ProductImage types
  site.ts                         # immutable brand and disclaimer copy
public/images/
  editorial/                      # approved shared editorial images
  products/                       # approved product images
scripts/
  validate-data.mjs               # build-time catalog and image validation
tests/
  bag.test.ts
  catalog.test.ts
  checkout.test.ts
  site.test.ts
  validate-data.test.mjs
```

---

### Task 1: Scaffold the Application and Freeze Brand Copy

**Files:**
- Modify: `package.json`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `lib/site.ts`
- Create: `tests/site.test.ts`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `.gitignore`
- Create: `vitest.config.ts`
- Create: `components/ui/*` through the shadcn CLI

**Interfaces:**
- Produces: `site.name`, `site.positioning`, `site.demoNotice`, and `site.checkoutNotice` as immutable strings.
- Produces: npm scripts `dev`, `build`, `lint`, `typecheck`, `test`, and `validate:data`.

- [ ] **Step 1: Initialize version control**

Run:

```bash
git init
```

Expected: `.git/` exists and `git status --short` shows only the existing plan.

- [ ] **Step 2: Scaffold Next.js and install only the required dependencies**

Run:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
npm install lucide-react sonner
npm install --save-dev vitest
npm pkg set scripts.lint="eslint ." scripts.typecheck="tsc --noEmit" scripts.test="vitest run" scripts.validate:data="node scripts/validate-data.mjs"
npx shadcn@latest init -d
npx shadcn@latest add button badge breadcrumb checkbox select sheet accordion separator skeleton sonner
```

Expected: installation succeeds, `npm run` lists `dev`, `build`, `lint`, `typecheck`, `test`, and `validate:data`, and no Redux, Zustand, form library, carousel, CMS, ORM, database client, or end-to-end framework is installed.

- [ ] **Step 3: Write the failing immutable-copy test**

Create `tests/site.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { site } from "@/lib/site";

describe("site copy", () => {
  it("makes the fictional and simulated nature explicit", () => {
    expect(site.name).toBe("Atelier Serein");
    expect(site.demoNotice).toContain("fictional demonstration");
    expect(site.checkoutNotice).toContain("Nothing will be charged or shipped");
  });
});
```

- [ ] **Step 4: Run the test and verify the expected failure**

Run: `npm test -- tests/site.test.ts`

Expected: FAIL because `@/lib/site` does not exist.

- [ ] **Step 5: Add the minimum shared brand contract**

Create `lib/site.ts`:

```ts
export const site = {
  name: "Atelier Serein",
  positioning: "Quiet contemporary luxury, shaped by material and craft.",
  demoNotice: "Atelier Serein is a fictional demonstration storefront.",
  checkoutNotice: "Demo only. Nothing will be charged or shipped.",
} as const;
```

Create `vitest.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: { environment: "node" },
});
```

- [ ] **Step 6: Add the static Next.js shell**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { site } from "@/lib/site";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-display" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.positioning,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <header><a href="/">{site.name}</a></header>
        <main>{children}</main>
        <footer><p>{site.demoNotice}</p><a href="/credits">Image credits</a></footer>
      </body>
    </html>
  );
}
```

Create `app/page.tsx`:

```tsx
import { site } from "@/lib/site";

export default function HomePage() {
  return <section><p>Atelier Serein</p><h1>{site.positioning}</h1><a href="/collection">Shop the collection</a></section>;
}
```

Create `app/globals.css` with these exact tokens and baseline rules, then retain the shadcn-generated Tailwind import above them:

```css
@import "tailwindcss";

:root {
  --ivory: #f5f0e7;
  --ink: #171412;
  --stone: #82786d;
  --oxblood: #651c2a;
  --champagne: #c8aa72;
}

* { box-sizing: border-box; }
html { background: var(--ivory); color: var(--ink); }
body { margin: 0; font-family: var(--font-sans), sans-serif; }
h1, h2, h3 { font-family: var(--font-display), serif; font-weight: 500; }
a { color: inherit; }
:focus-visible { outline: 2px solid var(--oxblood); outline-offset: 4px; }
button, input, select, a { min-height: 44px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
}
```

Keep the `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, and ESLint configuration generated by `create-next-app` and shadcn without adding runtime behavior.

- [ ] **Step 7: Verify the shell**

Run:

```bash
npm test -- tests/site.test.ts
npm run typecheck
npm run lint
npm run build
```

Expected: all four commands pass and Next.js reports `/` as static.

- [ ] **Step 8: Commit the foundation**

```bash
git add .
git commit -m "chore: scaffold Atelier Serein storefront"
```

---

### Task 2: Define and Validate the Catalog Contract

**Files:**
- Create: `lib/products.ts`
- Create: `data/products.json`
- Create: `scripts/validate-data.mjs`
- Create: `tests/validate-data.test.mjs`

**Interfaces:**
- Produces: `Product`, `ProductImage`, `ProductCategory`, and `ProductVariant` types.
- Produces: `validateProducts(products, rootDir): string[]`; an empty array means valid data.
- Produces: `npm run validate:data`, which exits nonzero and prints every catalog error.

- [ ] **Step 1: Define the compile-time product interfaces**

Create `lib/products.ts`:

```ts
export type ProductCategory = "bags" | "jewelry" | "watches" | "fragrance";
export type Availability = "available" | "limited" | "preview";

export type ProductImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  role: "hero" | "detail" | "lifestyle";
  sourcePage: string;
  creator: string;
  creatorUrl?: string;
  licenseName: string;
  licenseUrl: string;
  attributionRequired: boolean;
  attributionText: string;
  reviewedAt: string;
  modifications: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  color?: { name: string; hex: string };
  size?: string;
  availability: Availability;
};

export type Product = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  category: ProductCategory;
  collection: string;
  tagline: string;
  description: string;
  story: string;
  price: { amountMinor: number; currency: "EUR" };
  variants: ProductVariant[];
  materials: string[];
  craftsmanship: string[];
  dimensions: { width?: number; height?: number; depth?: number; unit: "cm" };
  weightGrams?: number;
  origin: string;
  care: string[];
  styleTags: string[];
  occasions: string[];
  features: string[];
  badges: Array<"new" | "exclusive" | "limited">;
  featured: boolean;
  images: ProductImage[];
  relatedSlugs: string[];
};
```

Create `data/products.json` containing an empty JSON array so the validator has valid JSON to load:

```json
[]
```

- [ ] **Step 2: Write failing validator tests at the trust boundary**

Create `tests/validate-data.test.mjs`:

```js
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateProducts } from "../scripts/validate-data.mjs";

const image = {
  src: "/images/products/item.webp", alt: "Black leather bag on ivory",
  width: 1200, height: 1500, role: "hero", sourcePage: "https://example.com/item",
  creator: "Example Creator", licenseName: "Example License",
  licenseUrl: "https://example.com/license", attributionRequired: false,
  attributionText: "Example Creator", reviewedAt: "2026-04-11", modifications: "Cropped and color graded"
};

const product = {
  id: "bag-01", slug: "vesper-tote", sku: "AS-BAG-001", name: "Vesper Tote",
  category: "bags", collection: "Nocturne", tagline: "A composed daily carry.",
  description: "A structured fictional tote.", story: "Designed for the Atelier Serein demonstration.",
  price: { amountMinor: 285000, currency: "EUR" },
  variants: [{ id: "black", name: "Black", color: { name: "Black", hex: "#171412" }, availability: "available" }],
  materials: ["Leather"], craftsmanship: ["Edge painted"], dimensions: { width: 34, height: 26, depth: 13, unit: "cm" },
  origin: "Fictional atelier, France", care: ["Wipe with a dry cloth"], styleTags: ["structured"],
  occasions: ["daily"], features: ["Interior pocket"], badges: ["new"], featured: true,
  images: [image], relatedSlugs: []
};

function rootWithImage() {
  const root = mkdtempSync(join(tmpdir(), "atelier-"));
  mkdirSync(join(root, "public/images/products"), { recursive: true });
  writeFileSync(join(root, "public/images/products/item.webp"), "image");
  return root;
}

describe("validateProducts", () => {
  it("accepts a complete local-image record", () => {
    expect(validateProducts([product], rootWithImage())).toEqual([]);
  });

  it("reports duplicate identity, bad relationships, colors, and missing files", () => {
    const bad = structuredClone(product);
    bad.variants[0].color.hex = "black";
    bad.relatedSlugs = [bad.slug, "missing"];
    const errors = validateProducts([bad, structuredClone(bad)], rootWithImage());
    expect(errors).toEqual(expect.arrayContaining([
      "duplicate id: bag-01", "duplicate slug: vesper-tote", "duplicate sku: AS-BAG-001",
      "vesper-tote: invalid color black", "vesper-tote: related product cannot reference itself",
      "vesper-tote: unknown related slug missing"
    ]));
  });
});
```

- [ ] **Step 3: Run the validator tests and verify they fail**

Run: `npm test -- tests/validate-data.test.mjs`

Expected: FAIL because `scripts/validate-data.mjs` does not exist.

- [ ] **Step 4: Implement the build-time validator**

Create `scripts/validate-data.mjs` with one exported `validateProducts` function. It must perform these checks in one pass plus a relationship pass:

```js
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const categories = new Set(["bags", "jewelry", "watches", "fragrance"]);
const roles = new Set(["hero", "detail", "lifestyle"]);
const availability = new Set(["available", "limited", "preview"]);
const color = /^#[0-9a-f]{6}$/i;
const text = (value) => typeof value === "string" && value.trim().length > 0;

export function validateProducts(products, rootDir = process.cwd()) {
  const errors = [];
  if (!Array.isArray(products)) return ["catalog must be an array"];
  const seen = { id: new Set(), slug: new Set(), sku: new Set() };

  for (const product of products) {
    for (const key of ["id", "slug", "sku"]) {
      if (!text(product[key])) errors.push(`product missing ${key}`);
      else if (seen[key].has(product[key])) errors.push(`duplicate ${key}: ${product[key]}`);
      else seen[key].add(product[key]);
    }
    const label = product.slug || product.id || "unknown product";
    for (const key of ["name", "collection", "tagline", "description", "story", "origin"]) {
      if (!text(product[key])) errors.push(`${label}: missing ${key}`);
    }
    if (!categories.has(product.category)) errors.push(`${label}: invalid category ${product.category}`);
    if (!Number.isInteger(product.price?.amountMinor) || product.price.amountMinor <= 0 || product.price.currency !== "EUR") {
      errors.push(`${label}: price must be a positive integer in EUR`);
    }
    if (!Array.isArray(product.variants) || product.variants.length === 0) errors.push(`${label}: missing variants`);
    for (const variant of product.variants || []) {
      if (!text(variant.id) || !text(variant.name) || !availability.has(variant.availability)) errors.push(`${label}: invalid variant`);
      if (variant.color && !color.test(variant.color.hex)) errors.push(`${label}: invalid color ${variant.color.hex}`);
    }
    const images = Array.isArray(product.images) ? product.images : [];
    if (!images.some((item) => item.role === "hero")) errors.push(`${label}: missing hero image`);
    for (const image of images) {
      if (!text(image.src) || !image.src.startsWith("/images/") || /^https?:/i.test(image.src)) errors.push(`${label}: image must use a local /images path`);
      if (!existsSync(resolve(rootDir, "public", String(image.src || "").replace(/^\//, "")))) errors.push(`${label}: missing image file ${image.src}`);
      if (!text(image.alt) || !Number.isInteger(image.width) || image.width <= 0 || !Number.isInteger(image.height) || image.height <= 0) errors.push(`${label}: invalid image dimensions or alt text`);
      for (const key of ["sourcePage", "creator", "licenseName", "licenseUrl", "attributionText", "reviewedAt", "modifications"]) {
        if (!text(image[key])) errors.push(`${label}: image missing ${key}`);
      }
      if (!roles.has(image.role)) errors.push(`${label}: invalid image role ${image.role}`);
    }
  }

  for (const product of products) {
    for (const slug of product.relatedSlugs || []) {
      if (slug === product.slug) errors.push(`${product.slug}: related product cannot reference itself`);
      else if (!seen.slug.has(slug)) errors.push(`${product.slug}: unknown related slug ${slug}`);
    }
  }
  return errors;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const products = JSON.parse(readFileSync(new URL("../data/products.json", import.meta.url), "utf8"));
  const errors = validateProducts(products);
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Validated ${products.length} products`);
  }
}
```

- [ ] **Step 5: Run the focused tests**

Run: `npm test -- tests/validate-data.test.mjs`

Expected: PASS with two passing tests.

- [ ] **Step 6: Commit the product contract**

```bash
git add lib/products.ts data/products.json scripts/validate-data.mjs tests/validate-data.test.mjs
git commit -m "feat: validate product catalog data"
```

---

### Task 3: Acquire Images and Populate the 20-Product Catalog

**Files:**
- Create: `context/product-matrix.md`
- Create: `context/image-shot-list.md`
- Modify: `data/products.json`
- Create: `public/images/products/*.webp`
- Create: `public/images/editorial/*.webp`
- Modify: `tests/validate-data.test.mjs`

**Interfaces:**
- Consumes: `Product` and `ProductImage` from Task 2.
- Produces: exactly 20 valid `Product` records and their local image files.
- Produces: provenance sufficient to render `/credits` without a second credits dataset.

- [ ] **Step 1: Freeze the product matrix**

Create `context/product-matrix.md` with this exact catalog identity and pricing table:

```markdown
| Category | SKU | Name | Slug | Collection | EUR minor units | Hero color |
|---|---|---|---|---|---:|---|
| bags | AS-BAG-001 | Vesper Tote | vesper-tote | Nocturne | 285000 | Oxblood |
| bags | AS-BAG-002 | Serein Mini | serein-mini | Nocturne | 165000 | Ivory |
| bags | AS-BAG-003 | Marais Shoulder | marais-shoulder | Ligne | 220000 | Black |
| bags | AS-BAG-004 | Lune Clutch | lune-clutch | Ligne | 145000 | Champagne |
| bags | AS-BAG-005 | Rivage Weekender | rivage-weekender | Voyage | 360000 | Stone |
| jewelry | AS-JWL-001 | Halo Cuff | halo-cuff | Orbite | 95000 | Champagne |
| jewelry | AS-JWL-002 | Élan Pendant | elan-pendant | Orbite | 78000 | Silver |
| jewelry | AS-JWL-003 | Sillage Ring | sillage-ring | Trait | 52000 | Oxblood |
| jewelry | AS-JWL-004 | Arc Studs | arc-studs | Trait | 46000 | Gold |
| jewelry | AS-JWL-005 | Meridian Chain | meridian-chain | Orbite | 125000 | Gold |
| watches | AS-WAT-001 | Meridian No. 1 | meridian-no-1 | Temps | 410000 | Black |
| watches | AS-WAT-002 | Aube 32 | aube-32 | Temps | 365000 | Ivory |
| watches | AS-WAT-003 | Ligne 38 | ligne-38 | Temps | 440000 | Oxblood |
| watches | AS-WAT-004 | Minuit Steel | minuit-steel | Minuit | 395000 | Silver |
| watches | AS-WAT-005 | Serein Moon | serein-moon | Minuit | 520000 | Champagne |
| fragrance | AS-FRG-001 | Bois Calme | bois-calme | Essences | 18500 | Amber |
| fragrance | AS-FRG-002 | Iris Serein | iris-serein | Essences | 19500 | Ivory |
| fragrance | AS-FRG-003 | Nuit Minérale | nuit-minerale | Essences | 21000 | Black |
| fragrance | AS-FRG-004 | Thé d’Aube | the-d-aube | Jardin | 17500 | Green |
| fragrance | AS-FRG-005 | Rose Silencieuse | rose-silencieuse | Jardin | 20500 | Oxblood |
```

For every row, use a stable lowercase ID formed from category and sequence (`bag-01`, `jewelry-01`, `watch-01`, `fragrance-01`). Give every product at least two variants, two materials, one craftsmanship statement, one care instruction, two features, and two related slugs from its own category. Mark only `Vesper Tote`, `Halo Cuff`, `Meridian No. 1`, and `Bois Calme` as featured.

- [ ] **Step 2: Add the failing catalog-completeness test**

Append this test to `tests/validate-data.test.mjs`:

```js
import { readFileSync } from "node:fs";

it("contains five products in every category", () => {
  const products = JSON.parse(readFileSync(new URL("../data/products.json", import.meta.url), "utf8"));
  expect(products).toHaveLength(20);
  for (const category of ["bags", "jewelry", "watches", "fragrance"]) {
    expect(products.filter((product) => product.category === category)).toHaveLength(5);
  }
});
```

- [ ] **Step 3: Run the completeness test and verify it fails**

Run: `npm test -- tests/validate-data.test.mjs`

Expected: FAIL because `data/products.json` contains zero products.

- [ ] **Step 4: Acquire approved local imagery before writing image metadata**

Create `context/image-shot-list.md`. Record one row for each of the 20 required hero images and 6–8 shared editorial images. For each candidate:

1. Search Pexels first, Wikimedia Commons second, and Unsplash free-library images only as a fallback.
2. Open the canonical source page and license page.
3. Reject the candidate if it has a visible logo, watermark, protected signature design, editorial-only restriction, unclear creator, or an identifiable person without clear usage rights.
4. Download rather than hotlink.
5. Crop and color-grade consistently, export WebP, and record the final width and height.
6. Record the canonical source URL, creator, creator URL when available, license name and URL, attribution requirement and text, review date, and exact modifications.

Name product files `<slug>-hero.webp`, `<slug>-detail.webp`, or `<slug>-lifestyle.webp`. Name editorial files by subject, such as `leather-workbench.webp`; do not name files after real brands.

Expected: every product has one approved hero file in `public/images/products`, optional product details have the same evidence, and 6–8 approved shared images exist in `public/images/editorial`. Record each editorial image exactly once as a `lifestyle` image on a relevant product so its provenance remains in `data/products.json` and `/credits` cannot drift.

- [ ] **Step 5: Write the 20 fictional product records**

Populate `data/products.json` from `context/product-matrix.md` and the approved shot list. Use the exact SKUs, names, slugs, collections, prices, and featured choices in the matrix. Apply these deterministic rules:

- `price.currency` is always `EUR`.
- `dimensions.unit` is always `cm`.
- Bag and watch variants use color; jewelry variants use size or finish; fragrance variants use `50 ml` and `100 ml` sizes.
- Availability may be `available`, `limited`, or `preview`, but no UI copy may imply live stock.
- Origin text begins with `Fictional atelier`.
- Descriptions and stories never claim that the photographed object is the fictional product.
- Image metadata is copied from the canonical pages reviewed in Step 4, not invented.
- Each file in `public/images/editorial` appears exactly once in a product’s `images` array with role `lifestyle`; home-page editorial sections select from those records rather than maintaining separate metadata.
- `relatedSlugs` contains exactly two distinct same-category slugs and never the product’s own slug.

Expected: the JSON contains no real luxury brand name, remote image path, blank provenance field, or unverified claim.

- [ ] **Step 6: Validate all catalog records and files**

Run:

```bash
npm run validate:data
npm test -- tests/validate-data.test.mjs
```

Expected: `Validated 20 products` and all validator tests pass.

- [ ] **Step 7: Commit the catalog and licensed assets**

```bash
git add context data public/images tests/validate-data.test.mjs
git commit -m "feat: add fictional catalog and licensed imagery"
```

---

### Task 4: Implement Catalog Queries, Comparison, Credits, and Money

**Files:**
- Create: `lib/catalog.ts`
- Create: `lib/money.ts`
- Create: `tests/catalog.test.ts`

**Interfaces:**
- Consumes: the validated `data/products.json` and `Product` type.
- Produces: `allProducts`, `findProduct(slug)`, `filterProducts(query)`, `compareProducts(slugs)`, `relatedProducts(product)`, and `imageCredits()`.
- Produces: `formatMoney(amountMinor, currency)`.

- [ ] **Step 1: Write focused catalog behavior tests**

Create `tests/catalog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { allProducts, compareProducts, filterProducts, findProduct, imageCredits, relatedProducts } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";

describe("catalog", () => {
  it("looks up known slugs and rejects unknown slugs", () => {
    expect(findProduct("vesper-tote")?.sku).toBe("AS-BAG-001");
    expect(findProduct("not-a-product")).toBeUndefined();
  });

  it("filters and sorts without mutating the catalog", () => {
    const original = allProducts.map((product) => product.slug);
    const result = filterProducts({ q: "vesper", category: "bags", color: "Oxblood", max: 300000, sort: "price-desc" });
    expect(result.map((product) => product.slug)).toEqual(["vesper-tote"]);
    expect(allProducts.map((product) => product.slug)).toEqual(original);
  });

  it("normalizes comparison to two or three unique products", () => {
    expect(compareProducts(["vesper-tote", "serein-mini", "vesper-tote"])).toHaveLength(2);
    expect(compareProducts(["vesper-tote"])).toEqual([]);
    expect(compareProducts(allProducts.slice(0, 4).map((product) => product.slug))).toHaveLength(3);
  });

  it("resolves related products and one credit per image", () => {
    const product = findProduct("vesper-tote")!;
    expect(relatedProducts(product).map((item) => item.slug)).toEqual(product.relatedSlugs);
    expect(imageCredits()).toHaveLength(allProducts.flatMap((item) => item.images).length);
  });

  it("formats integer EUR minor units", () => {
    expect(formatMoney(285000, "EUR")).toMatch(/2[,.\s]850/);
  });
});
```

- [ ] **Step 2: Run the tests and verify missing modules fail**

Run: `npm test -- tests/catalog.test.ts`

Expected: FAIL because `lib/catalog.ts` and `lib/money.ts` do not exist.

- [ ] **Step 3: Implement money formatting**

Create `lib/money.ts`:

```ts
export function formatMoney(amountMinor: number, currency: "EUR") {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amountMinor / 100);
}
```

- [ ] **Step 4: Implement the single catalog access module**

Create `lib/catalog.ts`:

```ts
import products from "@/data/products.json";
import type { Product, ProductCategory, ProductImage } from "@/lib/products";

export const allProducts = products as Product[];
const bySlug = new Map(allProducts.map((product) => [product.slug, product]));

export type CatalogQuery = {
  q?: string;
  category?: ProductCategory;
  material?: string;
  color?: string;
  min?: number;
  max?: number;
  sort?: "featured" | "price-asc" | "price-desc" | "name";
};

export function findProduct(slug: string) {
  return bySlug.get(slug);
}

export function filterProducts(query: CatalogQuery) {
  const needle = query.q?.trim().toLocaleLowerCase();
  const result = allProducts.filter((product) =>
    (!needle || [product.name, product.category, product.collection, product.tagline, ...product.materials, ...product.styleTags]
      .some((value) => value.toLocaleLowerCase().includes(needle))) &&
    (!query.category || product.category === query.category) &&
    (!query.material || product.materials.includes(query.material)) &&
    (!query.color || product.variants.some((variant) => variant.color?.name === query.color)) &&
    (query.min === undefined || product.price.amountMinor >= query.min) &&
    (query.max === undefined || product.price.amountMinor <= query.max)
  );
  return [...result].sort((a, b) => {
    if (query.sort === "price-asc") return a.price.amountMinor - b.price.amountMinor;
    if (query.sort === "price-desc") return b.price.amountMinor - a.price.amountMinor;
    if (query.sort === "name") return a.name.localeCompare(b.name);
    return Number(b.featured) - Number(a.featured);
  });
}

export function compareProducts(slugs: string[]) {
  const unique = [...new Set(slugs)].map(findProduct).filter((product): product is Product => Boolean(product)).slice(0, 3);
  return unique.length >= 2 ? unique : [];
}

export function relatedProducts(product: Product) {
  return product.relatedSlugs.map(findProduct).filter((item): item is Product => Boolean(item));
}

export type ImageCredit = ProductImage & { productName: string };
export function imageCredits(): ImageCredit[] {
  return allProducts.flatMap((product) => product.images.map((image) => ({ ...image, productName: product.name })));
}
```

- [ ] **Step 5: Run unit and static checks**

Run:

```bash
npm test -- tests/catalog.test.ts
npm run typecheck
npm run validate:data
```

Expected: all commands pass.

- [ ] **Step 6: Commit catalog operations**

```bash
git add lib/catalog.ts lib/money.ts tests/catalog.test.ts
git commit -m "feat: add typed catalog queries"
```

---

### Task 5: Implement the Versioned Local Bag

**Files:**
- Create: `lib/bag.ts`
- Create: `components/bag-provider.tsx`
- Create: `tests/bag.test.ts`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `findProduct` for display and subtotal calculation.
- Produces: `BagLine { productSlug, variantId, quantity }`, `bagReducer`, `parseStoredBag`, and `bagSubtotal`.
- Produces: `useBag()` with `{ lines, add, setQuantity, remove, clear }`.

- [ ] **Step 1: Write bag reducer and persistence tests**

Create `tests/bag.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { BAG_VERSION, bagReducer, bagSubtotal, parseStoredBag } from "@/lib/bag";

describe("bag", () => {
  it("merges identical variants and keeps distinct variants separate", () => {
    let state = bagReducer([], { type: "add", line: { productSlug: "vesper-tote", variantId: "oxblood", quantity: 1 } });
    state = bagReducer(state, { type: "add", line: { productSlug: "vesper-tote", variantId: "oxblood", quantity: 1 } });
    state = bagReducer(state, { type: "add", line: { productSlug: "vesper-tote", variantId: "black", quantity: 1 } });
    expect(state).toEqual([
      { productSlug: "vesper-tote", variantId: "oxblood", quantity: 2 },
      { productSlug: "vesper-tote", variantId: "black", quantity: 1 }
    ]);
  });

  it("removes zero quantities", () => {
    expect(bagReducer([{ productSlug: "vesper-tote", variantId: "oxblood", quantity: 1 }], {
      type: "quantity", productSlug: "vesper-tote", variantId: "oxblood", quantity: 0
    })).toEqual([]);
  });

  it("resets malformed and unsupported storage", () => {
    expect(parseStoredBag("not json")).toEqual([]);
    expect(parseStoredBag(JSON.stringify({ version: BAG_VERSION + 1, lines: [] }))).toEqual([]);
  });

  it("calculates integer subtotals", () => {
    expect(bagSubtotal([{ productSlug: "vesper-tote", variantId: "oxblood", quantity: 2 }])).toBe(570000);
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- tests/bag.test.ts`

Expected: FAIL because `lib/bag.ts` does not exist.

- [ ] **Step 3: Implement pure bag behavior**

Create `lib/bag.ts`:

```ts
import { findProduct } from "@/lib/catalog";

export const BAG_KEY = "atelier-serein-bag-v1";
export const BAG_VERSION = 1;
export type BagLine = { productSlug: string; variantId: string; quantity: number };
export type BagAction =
  | { type: "add"; line: BagLine }
  | { type: "quantity"; productSlug: string; variantId: string; quantity: number }
  | { type: "remove"; productSlug: string; variantId: string }
  | { type: "clear" };

const sameLine = (line: BagLine, productSlug: string, variantId: string) =>
  line.productSlug === productSlug && line.variantId === variantId;

export function bagReducer(lines: BagLine[], action: BagAction): BagLine[] {
  if (action.type === "clear") return [];
  if (action.type === "remove") return lines.filter((line) => !sameLine(line, action.productSlug, action.variantId));
  if (action.type === "quantity") {
    if (action.quantity <= 0) return lines.filter((line) => !sameLine(line, action.productSlug, action.variantId));
    return lines.map((line) => sameLine(line, action.productSlug, action.variantId) ? { ...line, quantity: action.quantity } : line);
  }
  const index = lines.findIndex((line) => sameLine(line, action.line.productSlug, action.line.variantId));
  if (index < 0) return [...lines, action.line];
  return lines.map((line, current) => current === index ? { ...line, quantity: line.quantity + action.line.quantity } : line);
}

export function parseStoredBag(raw: string | null): BagLine[] {
  try {
    const value = JSON.parse(raw || "null");
    if (value?.version !== BAG_VERSION || !Array.isArray(value.lines)) return [];
    return value.lines.filter((line: BagLine) => {
      const product = typeof line?.productSlug === "string" ? findProduct(line.productSlug) : undefined;
      return Boolean(product?.variants.some((variant) => variant.id === line?.variantId)) && Number.isInteger(line?.quantity) && line.quantity > 0;
    });
  } catch {
    return [];
  }
}

export function bagSubtotal(lines: BagLine[]) {
  return lines.reduce((total, line) => total + (findProduct(line.productSlug)?.price.amountMinor || 0) * line.quantity, 0);
}
```

- [ ] **Step 4: Run the bag tests**

Run: `npm test -- tests/bag.test.ts`

Expected: PASS with four passing tests.

- [ ] **Step 5: Add the smallest client provider around the pure reducer**

Create `components/bag-provider.tsx` as a client component. It must:

- initialize with `parseStoredBag(localStorage.getItem(BAG_KEY))` in an effect so server output does not access `window`;
- keep a `hydrated` boolean that becomes true only after the storage-loading effect dispatches its result;
- persist `{ version: BAG_VERSION, lines }` only when `hydrated` is true, preventing the initial empty render from overwriting stored lines;
- expose `add`, `setQuantity`, `remove`, and `clear` as direct reducer dispatches;
- expose `count` as the sum of quantities;
- throw `useBag must be used inside BagProvider` when the hook lacks context.

Use this public context type exactly:

```ts
type BagContextValue = {
  lines: BagLine[];
  count: number;
  add: (line: BagLine) => void;
  setQuantity: (productSlug: string, variantId: string, quantity: number) => void;
  remove: (productSlug: string, variantId: string) => void;
  clear: () => void;
};
```

Wrap the existing layout body content in `<BagProvider>`; do not make `app/layout.tsx` a client component.

- [ ] **Step 6: Verify persistence code and production compilation**

Run:

```bash
npm test -- tests/bag.test.ts
npm run typecheck
npm run build
```

Expected: all pass; the build has no `window is not defined` or hydration error.

- [ ] **Step 7: Commit bag state**

```bash
git add lib/bag.ts components/bag-provider.tsx tests/bag.test.ts app/layout.tsx
git commit -m "feat: add guarded local shopping bag"
```

---

### Task 6: Build Shared Chrome, Home, Product Detail, and Bag Pages

**Files:**
- Create: `components/site-chrome.tsx`
- Create: `components/commerce.tsx`
- Create: `app/product/[slug]/page.tsx`
- Create: `app/bag/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Modify: `tests/catalog.test.ts`

**Interfaces:**
- Consumes: `allProducts`, `findProduct`, `relatedProducts`, `formatMoney`, and `useBag`.
- Produces: `ProductCard`, `ProductGrid`, `ProductGallery`, `VariantPicker`, `AddToBag`, and `BagEditor` from `components/commerce.tsx`.
- Produces: statically generated `/product/[slug]` pages and client-only `/bag` interaction.

- [ ] **Step 1: Add a failing product-page model test**

Append to `tests/catalog.test.ts`:

```ts
import { productPageModel } from "@/lib/catalog";

it("builds a complete product page model", () => {
  const model = productPageModel("vesper-tote");
  expect(model?.product.slug).toBe("vesper-tote");
  expect(model?.related).toHaveLength(2);
  expect(productPageModel("missing")).toBeUndefined();
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- tests/catalog.test.ts`

Expected: FAIL because `productPageModel` is not exported.

- [ ] **Step 3: Add the shared product-page model**

Append to `lib/catalog.ts`:

```ts
export function productPageModel(slug: string) {
  const product = findProduct(slug);
  return product ? { product, related: relatedProducts(product) } : undefined;
}
```

Run: `npm test -- tests/catalog.test.ts`

Expected: PASS.

- [ ] **Step 4: Build shared navigation and footer chrome**

Create `components/site-chrome.tsx`. `SiteHeader` must render:

- the Atelier Serein wordmark linked to `/`;
- links to `/collection`, `/collection/bags`, `/collection/jewelry`, `/collection/watches`, and `/collection/fragrance`;
- a mobile shadcn `Sheet` containing the same navigation;
- a bag link whose accessible label and text include `useBag().count`.

`SiteFooter` must render `site.demoNotice`, links to `/collection` and `/credits`, and no newsletter or account controls. Replace the temporary header/footer in `app/layout.tsx` with these two components.

- [ ] **Step 5: Build the reusable commerce components**

Create `components/commerce.tsx` with:

- `ProductCard({ product })`: local `next/image` hero, category, name, formatted price, and link to `/product/<slug>`;
- `ProductGrid({ products })`: semantic list using responsive 2/3/4-column CSS;
- `ProductGallery({ product })`: hero plus image-selector buttons; the client state stores only the selected image index; buttons use image alt text;
- `VariantPicker({ product, value, onChange })`: labelled native radio inputs with text names and optional color swatches; no color-only meaning;
- `AddToBag({ product })`: defaults to the first available variant, requires a selected non-preview variant, calls `useBag().add`, and uses Sonner with `Added <product name> to bag`;
- `BagEditor()`: empty-state link to `/collection`, or bag rows with selected variant name, integer quantity input, remove button, formatted subtotal, and link to `/checkout`.

Use the catalog’s variant IDs as form values. Do not create a carousel abstraction or duplicate product lookups outside `lib/catalog.ts`.

- [ ] **Step 6: Build static product pages with metadata and 404 behavior**

Create `app/product/[slug]/page.tsx` using these route contracts:

```tsx
export function generateStaticParams() {
  return allProducts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const product = findProduct((await params).slug);
  return product ? { title: product.name, description: product.description } : {};
}
```

The default page must call `notFound()` for an unknown slug and render:

1. breadcrumb links;
2. `ProductGallery`;
3. category, name, tagline, and formatted price;
4. `AddToBag` in a sticky desktop purchase panel;
5. description and story;
6. materials, craftsmanship, dimensions, origin, and care in semantic sections or shadcn accordions;
7. related products through `ProductGrid`;
8. the demo disclaimer.

- [ ] **Step 7: Replace the home placeholder and add the bag route**

Update `app/page.tsx` to render one `h1`, the four featured products, a featured collection link, a craftsmanship section using the first catalog image whose path starts with `/images/editorial/`, and `site.demoNotice`. Create `app/bag/page.tsx` as a client page that renders `h1` plus `BagEditor`.

- [ ] **Step 8: Style and verify the vertical customer slice**

Add only the CSS needed for generous spacing, large imagery, thin dividers, asymmetrical home sections, 2/3/4-column grids, sticky desktop purchase panel, visible selected variants, and a fixed-width readable text measure. Use CSS transitions only.

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all pass; build output lists 20 static product paths.

Manual check at 375px and desktop widths: home → product → select variant → add → bag works with keyboard only, selected swatches have text labels, and no horizontal overflow appears.

- [ ] **Step 9: Commit the vertical slice**

```bash
git add app components lib/catalog.ts tests/catalog.test.ts
git commit -m "feat: build product and bag journey"
```

---

### Task 7: Build URL-Backed Collections and Comparison

**Files:**
- Create: `components/product-browser.tsx`
- Create: `app/collection/page.tsx`
- Create: `app/collection/[category]/page.tsx`
- Create: `app/compare/page.tsx`
- Modify: `lib/catalog.ts`
- Modify: `tests/catalog.test.ts`

**Interfaces:**
- Consumes: `filterProducts`, `compareProducts`, and `ProductGrid`.
- Produces: `catalogQueryFromParams(params)` with normalized category, material, color, min, max, and sort values.
- Produces: `/collection`, four static category routes, and `/compare?products=a,b`.

- [ ] **Step 1: Write failing URL normalization tests**

Append to `tests/catalog.test.ts`:

```ts
import { catalogQueryFromParams } from "@/lib/catalog";

it("normalizes supported URL filters and ignores invalid values", () => {
  expect(catalogQueryFromParams({ q: "vesper", category: "bags", color: "Oxblood", min: "10000", max: "300000", sort: "price-desc" })).toEqual({
    q: "vesper", category: "bags", color: "Oxblood", min: 10000, max: 300000, sort: "price-desc"
  });
  expect(catalogQueryFromParams({ category: "shoes", min: "free", sort: "random" })).toEqual({});
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- tests/catalog.test.ts`

Expected: FAIL because `catalogQueryFromParams` is absent.

- [ ] **Step 3: Implement strict query normalization**

Add to `lib/catalog.ts`:

```ts
const categoryValues = new Set(["bags", "jewelry", "watches", "fragrance"]);
const sortValues = new Set(["featured", "price-asc", "price-desc", "name"]);

export function catalogQueryFromParams(params: Record<string, string | string[] | undefined>): CatalogQuery {
  const one = (key: string) => typeof params[key] === "string" ? params[key] : undefined;
  const category = one("category");
  const sort = one("sort");
  const positiveInteger = (key: string) => {
    const value = Number(one(key));
    return Number.isInteger(value) && value >= 0 ? value : undefined;
  };
  return {
    ...(one("q")?.trim() ? { q: one("q")!.trim() } : {}),
    ...(category && categoryValues.has(category) ? { category: category as ProductCategory } : {}),
    ...(one("material") ? { material: one("material") } : {}),
    ...(one("color") ? { color: one("color") } : {}),
    ...(positiveInteger("min") !== undefined ? { min: positiveInteger("min") } : {}),
    ...(positiveInteger("max") !== undefined ? { max: positiveInteger("max") } : {}),
    ...(sort && sortValues.has(sort) ? { sort: sort as CatalogQuery["sort"] } : {}),
  };
}
```

Run: `npm test -- tests/catalog.test.ts`

Expected: PASS.

- [ ] **Step 4: Build the client filter UI without duplicate state**

Create `components/product-browser.tsx` as a client component. It receives the available products, renders a native search input plus native/select or shadcn controls for category, material, color, minimum, maximum, and sort, and updates `URLSearchParams` through `router.replace`. It must:

- derive the search term and selected values from `useSearchParams` rather than mirror them in React state;
- label the search input `Search products`, use query key `q`, and match names, categories, collections, taglines, materials, and style tags case-insensitively;
- preserve supported parameters when search or one filter changes;
- delete a parameter when its control is cleared;
- display result count;
- provide a clear-all button linking to `/collection`;
- render a no-results message and clear-all link;
- render results through `ProductGrid`.

- [ ] **Step 5: Build collection and category routes**

Create `app/collection/page.tsx` as a static Server Component that passes `allProducts` to `ProductBrowser` inside a React `Suspense` boundary. In `ProductBrowser`, convert `useSearchParams()` with `Object.fromEntries`, normalize with `catalogQueryFromParams`, and call `filterProducts` in the client; do not read request-time `searchParams` in the server page.

Create `app/collection/[category]/page.tsx` with:

```ts
export function generateStaticParams() {
  return ["bags", "jewelry", "watches", "fragrance"].map((category) => ({ category }));
}
```

Unknown categories call `notFound()`. Known categories render a category story, pre-filtered `ProductGrid`, and a link to the full collection. Use fictional story copy and no real-brand references.

- [ ] **Step 6: Build the comparison route**

Create a client `CompareView` in `components/product-browser.tsx` that reads the comma-separated `products` value through `useSearchParams` and passes the slugs to `compareProducts`. Create `app/compare/page.tsx` as a static Server Component that renders `CompareView` inside a React `Suspense` boundary. The view must:

- show instructions when fewer than two valid products remain;
- compare at most three unique products;
- render hero, name, price, category, materials, dimensions, origin, features, and variant names in one semantic table;
- use row headings and product-name column headings;
- include links back to every product page and `/collection`.

Add compare links to product pages that preselect the current product and its first related product. Do not add persistent comparison state.

- [ ] **Step 7: Verify filter persistence and comparison**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all pass and the build lists `/collection` plus four static category routes.

Manual check: search for `vesper`, then apply category, color, price, and sort; refresh; verify URL state and result count persist. Clear the search and filters. Compare two and three products, then try one and four slugs to verify the bounded states.

- [ ] **Step 8: Commit catalog browsing**

```bash
git add app/collection app/compare components/product-browser.tsx lib/catalog.ts tests/catalog.test.ts app/product
git commit -m "feat: add collection filters and comparison"
```

---

### Task 8: Implement Simulated Checkout

**Files:**
- Create: `lib/checkout.ts`
- Create: `tests/checkout.test.ts`
- Create: `app/checkout/page.tsx`

**Interfaces:**
- Produces: `validateDelivery(formData): Record<string, string>` and `confirmationReference(now, random)`.
- Consumes: `useBag().lines`, `useBag().clear`, `bagSubtotal`, `formatMoney`, and `site.checkoutNotice`.

- [ ] **Step 1: Write failing checkout-domain tests**

Create `tests/checkout.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { confirmationReference, validateDelivery } from "@/lib/checkout";

describe("simulated checkout", () => {
  it("requires only delivery-contact fields", () => {
    expect(validateDelivery(new FormData())).toEqual({
      name: "Enter your name", email: "Enter a valid email", address: "Enter an address", city: "Enter a city", postalCode: "Enter a postal code"
    });
  });

  it("accepts a complete delivery form", () => {
    const form = new FormData();
    Object.entries({ name: "Avery Stone", email: "avery@example.com", address: "1 Demo Way", city: "Paris", postalCode: "75001" })
      .forEach(([key, value]) => form.set(key, value));
    expect(validateDelivery(form)).toEqual({});
  });

  it("creates a clearly fake deterministic reference", () => {
    expect(confirmationReference(new Date("2026-04-11T12:00:00Z"), () => 0.1234)).toBe("DEMO-20260411-1234");
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- tests/checkout.test.ts`

Expected: FAIL because `lib/checkout.ts` does not exist.

- [ ] **Step 3: Implement checkout validation and fake references**

Create `lib/checkout.ts`:

```ts
const value = (form: FormData, key: string) => String(form.get(key) || "").trim();

export function validateDelivery(form: FormData) {
  const errors: Record<string, string> = {};
  if (!value(form, "name")) errors.name = "Enter your name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value(form, "email"))) errors.email = "Enter a valid email";
  if (!value(form, "address")) errors.address = "Enter an address";
  if (!value(form, "city")) errors.city = "Enter a city";
  if (!value(form, "postalCode")) errors.postalCode = "Enter a postal code";
  return errors;
}

export function confirmationReference(now = new Date(), random = Math.random) {
  const day = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `DEMO-${day}-${String(Math.floor(random() * 10000)).padStart(4, "0")}`;
}
```

- [ ] **Step 4: Run checkout tests**

Run: `npm test -- tests/checkout.test.ts`

Expected: PASS with three passing tests.

- [ ] **Step 5: Build the client-only simulated checkout page**

Create `app/checkout/page.tsx` as a client page. It must:

- redirect the empty state to a clear bag-empty message with a `/collection` link;
- display `site.checkoutNotice` before the form and again beside the submit button;
- use native `required`, `type="email"`, and `autocomplete` attributes for `name`, `email`, `street-address`, `address-level2`, and `postal-code`;
- call `validateDelivery(new FormData(event.currentTarget))` on submit;
- focus the first invalid field and render field errors with `aria-describedby`;
- never render card, payment, tax, shipping-rate, or order-request controls;
- on valid submit, capture `confirmationReference()`, clear the bag once, and replace the form with a confirmation heading, the fake reference, `Nothing was charged or shipped`, and a link home;
- display the formatted bag subtotal before submission.

Do not send a network request or persist delivery values.

- [ ] **Step 6: Verify no payment or network path exists**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
grep -RniE "card number|cvv|cvc|stripe|paypal|fetch\(|axios|server action" app lib components --exclude-dir=ui
```

Expected: tests and checks pass; grep returns no payment integration or order network call.

Manual check: submit empty fields, fix them, complete checkout, verify the bag clears and the confirmation remains explicitly simulated.

- [ ] **Step 7: Commit simulated checkout**

```bash
git add app/checkout lib/checkout.ts tests/checkout.test.ts
git commit -m "feat: add simulated checkout"
```

---

### Task 9: Generate Image Credits and Finish Compliance Checks

**Files:**
- Create: `app/credits/page.tsx`
- Create: `context/release-checklist.md`
- Modify: `app/globals.css`
- Modify: `tests/catalog.test.ts`

**Interfaces:**
- Consumes: `imageCredits()` from Task 4.
- Produces: a static `/credits` page generated from catalog metadata.
- Produces: auditable release evidence in `context/release-checklist.md`.

- [ ] **Step 1: Add and run the credit-integrity assertion**

Append to `tests/catalog.test.ts`:

```ts
it("keeps every credit local and canonically sourced", () => {
  for (const credit of imageCredits()) {
    expect(credit.src).toMatch(/^\/images\//);
    expect(credit.sourcePage).toMatch(/^https:\/\//);
    expect(credit.licenseUrl).toMatch(/^https:\/\//);
    expect(credit.attributionText.trim()).not.toBe("");
  }
});
```

Run: `npm test -- tests/catalog.test.ts`

Expected: PASS because Tasks 2–4 already validate and expose the provenance used by this declarative page.

- [ ] **Step 2: Build the credits page from the catalog**

Create `app/credits/page.tsx` as a Server Component. Render one table or definition list entry per `imageCredits()` item with:

- product name and image role;
- local preview;
- creator linked to `creatorUrl` only when present;
- canonical source-page link;
- license name linked to `licenseUrl`;
- attribution text;
- review date;
- modifications.

Render `site.demoNotice` and the statement: `Images are illustrative and do not depict products manufactured or offered by a real Atelier Serein company.`

- [ ] **Step 3: Add the release checklist**

Create `context/release-checklist.md` with unchecked evidence rows for:

```markdown
# Atelier Serein Release Checklist

## Automated
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run validate:data`
- [ ] `npm test`
- [ ] `npm run build`

## Routes and state
- [ ] Direct-load and refresh all 20 known product routes.
- [ ] Confirm an unknown product slug returns a 404 response.
- [ ] Search, filter, and sort; refresh and confirm query state remains.
- [ ] Add multiple variants, refresh, edit quantities, and remove lines.
- [ ] Corrupt `atelier-serein-bag-v1` and confirm a safe empty reset.
- [ ] Complete checkout and confirm there are no card fields or order requests.

## Accessibility and responsive behavior
- [ ] Keyboard-test header, filters, gallery, variants, bag, and checkout.
- [ ] Confirm visible focus and semantic heading order.
- [ ] Confirm every informative image has useful alt text.
- [ ] Confirm every swatch also has a readable color name.
- [ ] Confirm 44px touch targets and no overflow at 375px.
- [ ] Confirm tablet and desktop layouts.
- [ ] Confirm reduced-motion behavior.
- [ ] Confirm ivory/ink, stone/ivory, oxblood/ivory, and link states meet WCAG AA contrast.

## Content and licensing
- [ ] Search rendered copy for real luxury trademarks or real-product claims.
- [ ] Sample-check every canonical source and license link.
- [ ] Confirm every image is local and no unused image file remains.
- [ ] Confirm demo disclaimers appear on every route.

## Private GitHub handoff
- [ ] Confirm `elied-dev/atelier-serein` is private.
- [ ] Push the passing `main` branch and record its commit SHA.
- [ ] Confirm no secrets, credentials, or unlicensed source files are committed.

## Vercel — blocked until separate owner approval
- [ ] Record the New York project URL and matching source SHA.
- [ ] Record the Paris project URL and matching source SHA.
- [ ] Record the Tokyo project URL and matching source SHA.
- [ ] Run the customer demo journey on all three URLs.
```

- [ ] **Step 4: Complete responsive and accessibility CSS**

Use existing tokens and selectors in `app/globals.css`; add only styles needed to satisfy the checklist. Do not add animation libraries. Verify focus is never removed, mobile controls remain 44px, the product purchase action remains reachable without sticky overlap, and comparison tables scroll within their region rather than the full page.

- [ ] **Step 5: Run all local release checks**

Run:

```bash
npm run lint
npm run typecheck
npm run validate:data
npm test
npm run build
find public/images -type f | sort
rg -n "https?://" data app components lib | rg -v "sourcePage|creatorUrl|licenseUrl"
```

Expected: all npm commands pass; image listing matches referenced local assets; the URL audit reports no hotlinked image source.

Complete every non-deployment checkbox in `context/release-checklist.md`, recording a short note beside any browser-dependent result.

- [ ] **Step 6: Commit credits and compliance evidence**

```bash
git add app/credits app/globals.css context/release-checklist.md tests/catalog.test.ts
git commit -m "feat: add credits and release checks"
```

---

### Task 10: Publish the Completed Website to Private GitHub

**Files:**
- Modify: `context/release-checklist.md`
- Create: `context/demo-script.md`
- Modify: `README.md` if the scaffold created it

**Interfaces:**
- Consumes: one reviewed, passing website from Tasks 1–9.
- Produces: private repository `elied-dev/atelier-serein` with `main` containing the website and documentation.

- [ ] **Step 1: Write the future demo journey before publishing**

Create `context/demo-script.md`:

```markdown
# Atelier Serein Demo Journey

1. Open the Paris URL and identify Atelier Serein as fictional.
2. Select “Shop the collection.”
3. Search for “vesper,” then filter to bags, Oxblood, and a price range; refresh to show URL persistence.
4. Open Vesper Tote and inspect materials, craftsmanship, dimensions, care, and recommendations.
5. Select a variant and add it to the bag.
6. Compare it with Serein Mini.
7. Edit bag quantity and review the formatted subtotal.
8. Continue to checkout; point out “Demo only” and the absence of card fields.
9. Submit the form and show the local fake confirmation.
10. Open `/credits` and show image provenance.
11. After Vercel approval and configuration, open the New York, Paris, and Tokyo URLs and show the identical website.
```

If `README.md` exists, add a concise page list, local commands, fictional-store disclaimer, and a note that Vercel configuration is intentionally deferred. Do not duplicate this implementation plan.

- [ ] **Step 2: Re-run all checks and commit the reviewed website**

Run:

```bash
npm run lint
npm run typecheck
npm run validate:data
npm test
npm run build
git status --short
git add .
git commit -m "docs: prepare private GitHub handoff"
git status --short
git rev-parse HEAD
```

Expected: all checks pass, the working tree is clean after the commit, and one commit SHA is printed.

- [ ] **Step 3: Confirm GitHub authentication and repository availability**

Run:

```bash
gh auth status
gh repo view elied-dev/atelier-serein --json nameWithOwner,isPrivate 2>/dev/null || true
```

Expected: GitHub CLI is authenticated as an identity allowed to create repositories for `elied-dev`. If the repository already exists, stop and ask the owner whether to use it; never overwrite an existing remote by assumption.

- [ ] **Step 4: Create and push the private repository**

When `elied-dev/atelier-serein` is confirmed unused, run:

```bash
git branch -M main
gh repo create elied-dev/atelier-serein --private --source=. --remote=origin
git push -u origin main
```

Expected: `main` is pushed successfully and the repository is not public.

- [ ] **Step 5: Verify the private handoff**

Run:

```bash
gh repo view elied-dev/atelier-serein --json nameWithOwner,isPrivate,defaultBranchRef --jq '{name: .nameWithOwner, private: .isPrivate, branch: .defaultBranchRef.name}'
git ls-remote origin refs/heads/main
git rev-parse HEAD
```

Expected: the JSON reports `elied-dev/atelier-serein`, `private: true`, and `branch: main`; the local and remote SHAs match. Record the SHA and complete the private GitHub handoff rows in `context/release-checklist.md` locally.

---

### Task 11: Configure Vercel Only After a Separate Go-Ahead

**Files:**
- No repository files are required; report deployment URLs and verification results to the owner.

**Interfaces:**
- Consumes: the private `elied-dev/atelier-serein` repository and a separate explicit owner approval for Vercel.
- Produces: three stable Vercel project URLs serving identical content from the same approved source commit.

- [ ] **Step 1: Stop at the Vercel approval gate**

Do not open Vercel, connect GitHub, create projects, change configuration, or deploy until the owner explicitly says to begin the Vercel step. Completion of Task 10 is not Vercel approval.

- [ ] **Step 2: Freeze the approved source commit after permission is given**

Run:

```bash
git status --short
git rev-parse HEAD
git ls-remote origin refs/heads/main
```

Expected: the working tree is clean and local `HEAD` matches private GitHub `main`.

- [ ] **Step 3: Create three Vercel projects from the same source**

In Vercel, connect the private `elied-dev/atelier-serein` repository and create:

- `atelier-serein-new-york`
- `atelier-serein-paris`
- `atelier-serein-tokyo`

Use the same branch, root directory, framework preset, build command, and source commit. Do not set market-specific environment variables or content. Do not add a server function.

- [ ] **Step 4: Verify identical deployments**

For every URL:

1. Open `/`, `/collection`, one category, one product, `/compare?products=vesper-tote,serein-mini`, `/bag`, `/checkout`, and `/credits`.
2. Confirm deployment details identify the source SHA from Step 2.
3. Compare headings, search behavior, product count, EUR prices, disclaimers, and credits.
4. Rehearse `context/demo-script.md` once.

Expected: all three projects serve the same static storefront and source commit. Report the three URLs, source SHA, smoke-test result, and the limitation that location names do not prove region-pinned static hosting.

---

## Cut Order if Time Runs Short

Cut only in this order: animation, extra editorial images beyond six, optional second product images, extra filters beyond required search/category/color/price/sort, checkout address fields beyond name/email, then products 17–20. If products are cut, update the explicit 20-product goal and tests only after the hackathon owner approves the scope change.

Do not cut the core browse → detail → variant → bag journey, image provenance, fictional/demo disclaimers, accessibility basics, guarded storage, build validation, or three deployment URLs.

## Definition of Done

- The storefront looks credible and intentionally luxurious at 375px, tablet, and desktop widths.
- The complete home → collection → product → variant → bag → simulated checkout journey works without explanation.
- All products, prices, descriptions, and branding are fictional.
- Exactly 20 products exist unless an approved cut is recorded.
- Every image is local and has traceable source and license metadata.
- No control suggests that a real payment, shipment, or order is possible.
- Lint, type checking, data validation, unit tests, and production build pass.
- Before Vercel work, the reviewed website is pushed to private `elied-dev/atelier-serein` with local and remote `main` at the same SHA.
- Vercel configuration begins only after a separate explicit owner go-ahead.
- After that approval, the New York, Paris, and Tokyo Vercel URLs serve identical content from the same recorded source commit.
- `context/release-checklist.md` contains completed local, accessibility, licensing, route, and private GitHub evidence; Vercel evidence is reported only after its gate opens.
