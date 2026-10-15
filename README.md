# Supplier Price Control

[![CI](https://github.com/Plyska/supplier-price-control/actions/workflows/ci.yml/badge.svg)](https://github.com/Plyska/supplier-price-control/actions/workflows/ci.yml)

Supplier Price Control is a SaaS application for importing supplier price lists, matching products, reviewing purchase price changes, and preparing approved exports.

## Current stack

- React 19 and TypeScript
- Vite 8
- React Router
- Tailwind CSS 4
- shadcn/ui primitives with semantic OKLCH design tokens
- React Hook Form with Zod validation
- date-fns with Ukrainian and British English locales
- i18next and react-i18next
- Motion for React
- Radix UI primitives
- Node.js and Express 5 API
- Prisma ORM 7.10 with the PostgreSQL driver adapter
- Local PostgreSQL 17 via Docker Compose
- Zod environment validation
- pnpm workspace
- Feature-Sliced Design for the frontend architecture

The API and local database foundations are implemented. Supabase provisioning, Cloudflare R2, authentication, and supplier persistence remain upcoming work. The background worker will be added with the first durable file-processing job.

## Requirements

- Node.js 22.21.1
- pnpm 9.15.9
- Docker with Compose v2 or newer, running locally

With nvm installed, activate the project version:

```bash
nvm use
```

Install dependencies and start the frontend and API together:

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp packages/db/.env.example packages/db/.env
pnpm db:up
pnpm db:deploy
pnpm dev
```

Keep any existing `.env` files and add missing variables instead of overwriting them. `pnpm dev` generates and builds the shared database package before starting web and API.

The frontend uses the Vite development URL shown in the terminal. Axios sends requests to the relative `/api/v1` prefix, and Vite proxies `/api` to `http://127.0.0.1:3000` by default. `GET /api/v1/health` checks process liveness; `GET /api/v1/ready` queries PostgreSQL and returns 503 if it is unavailable. Readiness checks connectivity, not whether all migrations have been deployed.

For direct cross-origin requests, Express allows credentialed requests from `WEB_ORIGIN` (`http://localhost:5173` by default). Change `WEB_ORIGIN` and `API_PROXY_TARGET` in the corresponding local environment files when the development origins differ.

To start a single process, use `pnpm dev:web` or `pnpm dev:api`.

## Local database and migrations

Docker binds PostgreSQL to `127.0.0.1:5433` and stores data in the named `postgres_data` volume. `pnpm db:down` stops PostgreSQL and preserves its data. Bootstrap SQL runs only when that volume is first initialized. Passwords in Compose and the examples are disposable local credentials, never production secrets.

The bootstrap creates three databases: `supplier_price_control` for development, `supplier_price_control_shadow` for Prisma's disposable migration sandbox, and `supplier_price_control_test` for integration tests. The migration role owns the databases; the runtime role has application-table access without schema creation, role administration, or database creation privileges.

| Command | Purpose |
| --- | --- |
| `pnpm db:up` | Start PostgreSQL and wait for it to become healthy |
| `pnpm db:down` | Stop PostgreSQL without deleting data |
| `pnpm db:generate` | Generate the Prisma client without connecting to a database |
| `pnpm db:build` | Generate and compile the shared database package |
| `pnpm db:validate` | Validate the Prisma schema |
| `pnpm db:deploy` | Apply committed migrations |
| `pnpm db:migrate --name describe_change --create-only` | Create a development migration for SQL review |
| `pnpm db:migrate` | Apply reviewed development migrations and check for drift |
| `pnpm db:status` | Show applied and pending migrations |
| `pnpm db:check` | Replay migration history in the shadow database and compare it with the schema |

`apps/api/.env` holds only runtime settings (`DATABASE_URL`, `DATABASE_POOL_MAX`, default pool size 5). `packages/db/.env` holds `MIGRATION_DATABASE_URL`, `SHADOW_DATABASE_URL`, and `TEST_DATABASE_URL`. Production requires an explicit runtime URL; migration commands never fall back to it. Generation and compilation need no database credentials.

Only the `app` schema is managed by Prisma. Supabase `auth`/`storage` and future pg-boss schemas are outside its scope. Use a separate disposable shadow database: Prisma may erase its contents, and configuration rejects using the same database for migrations and shadow work. Review generated SQL before applying it; use `migrate deploy` for deployment, never `db push` or `migrate dev` against production.

The initial models are `Organization`, `User`, `Membership`, and `AuditEvent`. Membership roles are `owner`, `editor`, and `viewer` (the default). Organization time zones remain unset until explicitly configured. Emails must be trimmed and lowercase; passwords and sessions await the authentication implementation. Memberships can be revoked while retaining audit history. Audit actors use a composite foreign key to membership in the same organization; system events may have no actor. Database triggers reject audit updates/deletions, and runtime credentials cannot truncate the audit table. Audit metadata must be a JSON object containing only minimal event context, never full price lists, secrets, or personal pricing terms.

These constraints preserve data integrity; tenant authorization and active-membership checks still need to be implemented in authenticated API use cases. The shared runtime role does not provide row-level tenant isolation on its own.

For Supabase, provision separate runtime/migration roles and grants, use direct or session connections, and disable unused Data API access before deployment. Local verification does not verify Supabase connectivity or permissions. See the [Prisma 7 PostgreSQL guide](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql) and [Prisma configuration reference](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference).

### Supplier page state previews

During local development, the supplier page exposes deterministic previews for visual and accessibility checks:

- `/suppliers?preview=loading`
- `/suppliers?preview=error`
- `/suppliers?preview=populated`

The populated preview uses clearly labelled synthetic data. These query parameters are ignored in production and do not replace the future supplier API integration.

## Available checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

The corresponding `:web` and `:api` scripts remain available for package-specific checks.

Database integration tests use a separate local database and roll back all fixtures. Prepare it once (and after adding migrations), then run the tests:

```bash
pnpm db:up
pnpm db:generate
MIGRATION_DATABASE_URL='postgresql://spc_migrator:local_migration_password@127.0.0.1:5433/supplier_price_control_test?schema=app' pnpm db:deploy
pnpm db:test
```

Tests require `TEST_DATABASE_URL` from `packages/db/.env` or the environment. They refuse remote hosts and database names without the `_test` suffix. `pnpm test` runs API unit/HTTP tests without needing PostgreSQL; `pnpm db:test` checks real database constraints, rollback, audit integrity, and runtime privileges.

GitHub Actions runs a frozen install, local PostgreSQL bootstrap, migration deployment/replay/schema comparison, typecheck, lint, API and database tests, and build for every pull request and every push to `main`.

## Database package

```text
packages/db/
├── prisma/schema.prisma   # Application models in the app schema
├── prisma/migrations/    # Versioned SQL, including extra database constraints
├── prisma.config.ts      # Migration and shadow connections
├── src/index.ts          # Server-only Prisma client factory and model types
├── src/generated/        # Generated client (ignored by Git)
└── tests/                # PostgreSQL integration tests
```

The API owns one Prisma client per process and disconnects it during shutdown. Web code must not import `@supplier-price-control/db`.

## API structure

```text
apps/api/
├── src/
│   ├── config/    # Runtime environment validation
│   ├── http/      # Request middleware and error responses
│   ├── routes/    # Versioned API routes
│   ├── app.ts     # Express composition without opening a port
│   └── server.ts  # Process startup and graceful shutdown
└── tests/         # HTTP and configuration tests
```

The shared frontend API client lives in `apps/web/src/shared/api`. It has a typed health request, structured Axios error type, credentials enabled, and native `AbortSignal` support.

## Frontend structure

The frontend follows a pragmatic subset of Feature-Sliced Design:

```text
apps/web/src/
├── app/       # Application composition, routing, and global styles
├── pages/     # Route-level page composition
├── widgets/   # Large reusable interface blocks
├── features/  # User interactions with product meaning
├── entities/  # Business entities and their reusable UI
└── shared/    # Reusable UI, routes, utilities, and infrastructure
```

Dependencies flow from higher layers to lower layers, and each slice exposes a public API through `index.ts`. New slices are added only when they contain real product behavior or business concepts.
