# Prisma Tooling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add repository-managed Prisma tooling for the existing Neon PostgreSQL database without introducing application models or runtime database code.

**Architecture:** Prisma 7.10.0 runs as a development tool from npm scripts. A root Prisma config loads the ignored `.env` and sends CLI and migration operations through Neon's unpooled connection, while the pooled connection remains available for future application traffic.

**Tech Stack:** Next.js 16.3.3, TypeScript 5, npm, Prisma ORM 7.10.0, dotenv 17.4.2, Neon PostgreSQL

**Spec:** `docs/superpowers/specs/2026-09-02-prisma-tooling-design.md`

## Global Constraints

- Work in the current checkout; do not create or use a worktree.
- Preserve all unrelated tracked and untracked changes already in the working tree.
- Keep `.env` ignored and never stage, commit, print, or copy its secret values into tracked files.
- Use `DATABASE_URL_UNPOOLED` for Prisma CLI operations.
- Do not create models, migrations, generated clients, seed data, or application database access code.
- Do not change database state during setup; connectivity verification must be read-only.
- Pin Prisma to exactly `7.10.0` and dotenv to exactly `17.4.2`.

---

### Task 1: Repository-managed Prisma CLI

**Files:**
- Create: `.env` (ignored; exact values from the initiating request)
- Create: `prisma/schema.prisma`
- Create: `prisma.config.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: the 15 Neon environment assignments supplied in the initiating request.
- Produces: npm scripts `db:validate`, `db:migrate`, `db:deploy`, `db:status`, and `db:studio`; Prisma reads `DATABASE_URL_UNPOOLED` for CLI database operations.

- [ ] **Step 1: Verify the secret file is excluded before writing it**

Run:

```bash
git check-ignore -v .env
```

Expected: `.gitignore` reports the `.env*` rule. Stop without creating `.env` if the command does not succeed.

- [ ] **Step 2: Run the configuration check before implementation**

Run:

```bash
npm run db:validate
```

Expected: FAIL with `Missing script: "db:validate"`.

- [ ] **Step 3: Create the ignored environment file**

Create root `.env` by copying the exact supplied assignments for these names, preserving the supplied pooled and unpooled URLs:

```text
DATABASE_URL
DATABASE_URL_UNPOOLED
PGHOST
PGHOST_UNPOOLED
PGUSER
PGDATABASE
PGPASSWORD
POSTGRES_URL
POSTGRES_URL_NON_POOLING
POSTGRES_USER
POSTGRES_HOST
POSTGRES_PASSWORD
POSTGRES_DATABASE
POSTGRES_URL_NO_SSL
POSTGRES_PRISMA_URL
```

Do not echo or otherwise print the file after creation.

- [ ] **Step 4: Install the pinned CLI dependencies**

Run:

```bash
npm install --save-dev --save-exact prisma@7.10.0 dotenv@17.4.2
```

Expected: `package.json` and `package-lock.json` record both packages under `devDependencies` with exact versions.

- [ ] **Step 5: Add the Prisma schema scaffold**

Create `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
}
```

The schema intentionally has no models and no client generator.

- [ ] **Step 6: Add the Prisma CLI configuration**

Create `prisma.config.ts`:

```ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL_UNPOOLED") },
});
```

- [ ] **Step 7: Add database management scripts**

Add these entries to the existing `scripts` object in `package.json`:

```json
"db:validate": "prisma validate",
"db:migrate": "prisma migrate dev",
"db:deploy": "prisma migrate deploy",
"db:status": "prisma migrate status",
"db:studio": "prisma studio"
```

Do not replace or reorder unrelated scripts.

- [ ] **Step 8: Validate the implemented configuration**

Run:

```bash
npm run db:validate
```

Expected: PASS with `The schema at prisma/schema.prisma is valid`.

- [ ] **Step 9: Verify database connectivity without changing data**

Run:

```bash
printf 'SELECT 1;' | npx prisma db execute --stdin
```

Expected: exit status `0` and a successful script execution message. Do not run `db:migrate`, `db:deploy`, `db push`, or `migrate reset`.

- [ ] **Step 10: Verify repository safety and existing checks**

Run:

```bash
git check-ignore -v .env
git status --short --ignored .env
git diff --check -- package.json package-lock.json prisma.config.ts prisma/schema.prisma
npm run typecheck
```

Expected: `.env` is shown as ignored, diff check is silent, and TypeScript passes. If project-wide type checking fails only in pre-existing unrelated files, report the exact failure without modifying those files.

- [ ] **Step 11: Commit only the Prisma setup**

Run:

```bash
git add package.json package-lock.json prisma.config.ts prisma/schema.prisma
git diff --cached --check
git commit -m "chore: add Prisma migration tooling"
```

Expected: the commit contains only the four tracked Prisma setup paths; `.env` and unrelated working-tree changes remain uncommitted.
