# Database-Backed Products Design

## Goal

Make Neon PostgreSQL the authoritative runtime source for all 95 products while retaining `data/products.json` only as a repeatable seed fixture. Update storefront pages, cart/order calculations, the read-only product API, and WebMCP tools to consume database-loaded products.

## Data Model

Use one hybrid Prisma `Product` model. Keep identifiers and searchable scalar values as columns: ID, slug, SKU, name, category, collection, text content, price, currency, featured status, origin, and optional weight. Store variants, images, and dimensions as PostgreSQL JSON. Store materials, craftsmanship, care, style tags, occasions, features, badges, and related slugs as PostgreSQL arrays.

Slug and SKU are unique. The initial design does not add normalized variant, image, tag, or relation tables because the catalog contains 95 mostly read-only products and current queries return complete product documents.

## Server Data Access

Add a server-only product repository backed by Prisma Client and the PostgreSQL driver adapter. The repository maps Prisma rows into the existing serializable `Product` type and exposes list and slug lookup operations.

Server pages call this repository directly rather than making HTTP requests to their own API. Product reads occur at request time without persistent application caching so database edits are visible without rebuilding.

Do not fall back to the JSON fixture when the database is unavailable. Neon is the sole runtime source, and database failures must remain visible instead of silently serving stale duplicate data.

## Client Data Flow

The root server layout loads the catalog and supplies it to a small client product context. Existing client consumers use that context:

- bag storage validation and subtotal calculation;
- bag and checkout displays;
- locally stored order validation and display;
- comparison UI;
- WebMCP catalog, product, variant, and cart tools.

The context keeps Prisma and credentials out of client code. Passing the complete catalog once is acceptable for the current 95-product ceiling. If catalog payload size becomes material, replace the context with purpose-specific API reads.

Keep catalog filtering, lookup, comparison, related-product, and image-credit behavior as pure functions. Remove their implicit JSON import and require a product array from the repository or client context.

## Read-Only API

Add two Next.js Route Handlers:

- `GET /api/products` returns all products.
- `GET /api/products/[slug]` returns one product or a JSON `404` response.

No create, update, or delete endpoints are included. Product management remains through the seed, migrations, and Prisma Studio.

## WebMCP

Pass database-loaded products from the client product context into `createWebMcpTools`. Keep the tool surface and result shapes unchanged. Product resolution, catalog browsing, variant selection, cart enrichment, and subtotal calculations operate on the supplied catalog instead of a module-level JSON array.

## Migration and Seed

The Neon database is currently empty. Create and apply one initial migration for the `Product` model.

Keep `data/products.json` as the seed fixture. The seed process first runs the existing product validation, then transactionally upserts all 95 products by ID. Re-running the seed updates matching products and inserts missing products; it does not delete database-only records.

After seeding, verify the database contains the 95 fixture IDs and check representative slugs, prices, variants, and images. Do not expose database credentials in migration files, source, logs, or tests.

## Error Handling

- A missing slug returns `404` from the API and `notFound()` from the product page.
- Invalid seed data stops before database writes.
- A failed seed transaction leaves no partially imported batch.
- Database connectivity errors fail the request; no JSON runtime fallback is used.
- The direct Neon endpoint requires outbound TCP port 5432. The corporate VPN currently blocks that connection before TLS, so migration commands must run while that path is available. No custom Mastercard CA is needed for the supplied `sslmode=require` connection.

## Testing and Verification

Use test-first changes for the pure catalog functions, row mapping, product context consumers, API behavior, cart/order calculations, and WebMCP tools. Tests use explicit product fixtures rather than a hidden module-level catalog.

Before completion:

1. Validate the Prisma schema and JSON fixture.
2. Apply the migration and run the idempotent seed.
3. Check Prisma migration status.
4. Verify all 95 fixture products and representative nested values in Neon.
5. Run type checking, the full test suite, lint, and production build.
6. Smoke-test storefront pages and both API routes in a browser.

## Deferred Scope

Do not add product CRUD endpoints, authentication/authorization for product administration, normalized child tables, persistent caching, pagination, or database-backed orders. Add these only when concrete product-management, catalog-scale, or order-persistence requirements exist.
