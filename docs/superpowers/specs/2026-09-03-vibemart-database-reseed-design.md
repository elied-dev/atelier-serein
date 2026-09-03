# Vibemart database reseed design

## Goal

Replace every row in the PostgreSQL `Product` table with the 160 products from `data/products_vibemart.json`. Keep the Prisma schema, migration history, and non-product database metadata intact. Make `npm run db:seed` repeat this replacement safely.

## Catalog compatibility

The new fixture retains the existing product object shape but introduces:

- categories: `travel`, `electronics`, `home`, `clothing`, `outdoor`, `beauty`, `kids`, and `office`;
- currency: `USD`;
- dimension unit: `in`;
- badges: `best-seller`, `best-value`, `business-travel-pick`, `category-pick`, `extra-capacity`, `family-favorite`, `premium-choice`, `premium-pick`, and `vibemart-exclusive`.

Extend the TypeScript product unions and the JSON validator to accept both the existing and Vibemart values so existing tests and fixtures remain valid. Extend the Prisma category and currency enums. Store badges as validated strings because the new hyphenated values do not map directly to Prisma enum identifiers without extra conversion code.

## Migration

Add a Prisma migration that:

1. adds the eight Vibemart category values to `ProductCategory`;
2. adds `USD` to `Currency`;
3. converts `Product.badges` from `ProductBadge[]` to `text[]` without deleting existing data;
4. removes `ProductBadge` only after the column no longer depends on it.

The migration must not drop the `Product` table or Prisma migration history.

## Seed transaction

Change `prisma/seed.ts` to import `data/products_vibemart.json`. Validate the complete fixture before opening a write transaction.

Within one Prisma transaction:

1. delete every `Product` row;
2. insert all 160 validated products in fixture order with contiguous `sortOrder` values.

If deletion or insertion fails, roll back the transaction so the database is not left with a partial catalog. After commit, load all rows ordered by `sortOrder` and compare them with the fixture.

## Testing and verification

Add focused seed tests proving that malformed input causes no writes and valid input requests deletion before insertion. Update validator tests for the new category, USD, inches, and badge values while retaining rejection tests for unknown values.

Before reporting completion:

1. run the focused tests and typecheck;
2. validate the Prisma schema;
3. apply the migration to the configured database;
4. run `npm run db:seed`;
5. query the database and verify exactly 160 rows, 160 matching fixture SKUs, no old Atelier Serein SKUs, and matching representative image URLs;
6. confirm Prisma migration status is current.

Database credentials must not be printed or committed.

## Scope

This work changes database compatibility and repeatable seeding only. Updating storefront navigation, category copy, Dynamic Yield configuration, or replacing test imports of `data/products.json` is outside this operation unless required for compilation.
