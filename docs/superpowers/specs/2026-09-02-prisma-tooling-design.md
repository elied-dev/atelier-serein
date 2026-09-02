# Prisma Tooling Design

## Goal

Manage the existing Neon PostgreSQL database and future schema migrations from this repository without adding application models or database access code.

## Approach

Use Prisma ORM 7.10.0 as a pinned development dependency. Add `dotenv` so Prisma's root configuration can load the ignored `.env` file outside the Next.js runtime.

Keep the Prisma schema model-free. It will declare only the PostgreSQL datasource. Configure Prisma CLI operations with the supplied unpooled Neon connection because migrations require a direct database session; retain the pooled connection for future application traffic.

## Repository Changes

- `.env`: store all supplied Neon variables. This file remains excluded by the existing `.gitignore` rule.
- `prisma/schema.prisma`: declare the PostgreSQL datasource without models or a generated client.
- `prisma.config.ts`: load `.env`, identify the schema and migrations directory, and use `DATABASE_URL_UNPOOLED` for CLI database operations.
- `package.json` and `package-lock.json`: pin Prisma 7.10.0 and `dotenv`, with scripts for schema validation, development migrations, deployment migrations, migration status, and Prisma Studio.

## Commands

- `npm run db:validate`: validate Prisma configuration and schema.
- `npm run db:migrate -- --name <name>`: create and apply a development migration after models are added.
- `npm run db:deploy`: apply committed migrations non-interactively.
- `npm run db:status`: compare repository migrations with database history.
- `npm run db:studio`: inspect and edit database records through Prisma Studio.

## Verification

Run schema validation and a read-only `SELECT 1` through Prisma using the unpooled connection. Do not create a migration while the schema has no models.

## Security

The `.env` file stays untracked. Database values must not be placed in source files, generated artifacts, logs, tests, or this design document. Because credentials were shared in chat, rotate them after setup and replace the local `.env` values.

## Deferred Scope

Do not install Prisma Client, a PostgreSQL driver adapter, or generated runtime code. Add those only when the application begins querying the database. Do not define product, order, or checkout models until their persistence requirements are specified.
