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
- Better Auth 1.7.10 with PostgreSQL sessions and closed magic-link login
- TanStack Query for private session and organization data
- Shared Zod contracts for supplier API data
- Local PostgreSQL 17 via Docker Compose
- Zod environment validation
- pnpm workspace
- Feature-Sliced Design for the frontend architecture

The API, local database, pilot authentication, minimal organization flows and tenant-scoped supplier management are implemented. Supabase provisioning, production email delivery and Cloudflare R2 remain upcoming work. Durable background processing remains deferred.

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

`pnpm dev` starts the frontend at `http://localhost:5180` and the API at `http://127.0.0.1:3010`. Axios sends requests to the relative `/api/v1` prefix, and Vite proxies `/api` to the local API. The command fails if either chosen port is already occupied, so it never silently opens the application at another address. `GET /api/v1/health` checks process liveness; `GET /api/v1/ready` queries PostgreSQL and returns 503 if it is unavailable. Readiness checks connectivity, not whether all migrations have been deployed.

For direct cross-origin requests, Express allows credentialed requests from `WEB_ORIGIN`. The combined development command uses `http://localhost:5180`; change `WEB_ORIGIN` and `API_PROXY_TARGET` in the corresponding local environment files when running individual processes on other origins.

To start a single process, use `pnpm dev:web` or `pnpm dev:api`.

## Pilot authentication

Start local mail capture, apply migrations, and provision a synthetic pilot account:

```bash
docker compose --profile mail up -d mailpit
pnpm db:deploy
pnpm auth:provision pilot@example.test "Synthetic pilot"
pnpm dev
```

Open the frontend, request a login link, and read the captured message at `http://127.0.0.1:8025`. Mailpit captures mail locally; it does not deliver messages to real inboxes. Open the link and press Continue. Signup is closed: only provisioned accounts receive mail and can authenticate. Provisioning is idempotent and does not verify an email, reactivate an account or assign organization membership.

Magic links expire after 10 minutes, are stored hashed by Better Auth and are consumed atomically once. The email link carries its token in a URL fragment; the UI removes that fragment and keeps it only in memory until confirmation. Reloading the confirmation page requires reopening the email link. A confirmation POST avoids consuming links through ordinary email scanners or prefetch. Session credentials are never returned in JSON or stored in browser storage.

Sessions use signed opaque HttpOnly cookies and PostgreSQL persistence. Production cookies are host-only `__Host-spc-session`, `Secure`, `SameSite=Lax`, `Path=/`. Session tokens follow Better Auth's database representation (not custom hashing); database access and backups must be protected. The defaults are 7 days without authenticated API activity and a hard 30-day lifetime. `AUTH_SESSION_IDLE_SECONDS` and `AUTH_SESSION_ABSOLUTE_SECONDS` configure these limits. Automatic library refresh and cookie caching are disabled. Each successful login issues a new session; reauthentication replaces the current browser session while other device sessions remain valid. Logout acknowledges success only after server-side revocation; service errors do not pretend the user signed out.

First verified activation creates an ordinary Organization and owner Membership transactionally, using the same creation service as explicit creation. A persisted activation marker and user-row lock prevent duplicate creation. Revoked membership never causes automatic replacement. Existing memberships are preserved. Users can create/select multiple organizations and owners can edit name/timezone; business requests always identify their organization in the URL.

| Endpoint under `/api/v1` | Behavior |
| --- | --- |
| `POST /auth/login` | `{ email }`; generic 202 response, including unknown accounts |
| `POST /auth/verify` | `{ token }`; 204 and session cookie after verification/activation |
| `GET /session` | Sanitized user DTO; 401 for missing, revoked or expired sessions |
| `POST /auth/logout` | Revoke this session and clear its cookie |
| `GET /organizations` | Current accessible memberships |
| `POST /organizations` | `{ name, timeZone }` and UUID `Idempotency-Key`; create owner membership |
| `GET/PATCH /organizations/:organizationId` | Tenant-checked read; owner-only settings update |
| `GET/POST /organizations/:organizationId/suppliers` | Tenant-checked list/search/pagination and editor/owner creation |
| `GET/PATCH /organizations/:organizationId/suppliers/:supplierId` | Tenant-checked detail and editor/owner update |
| `POST /organizations/:organizationId/suppliers/:supplierId/archive` | Archive without deleting history |
| `POST /organizations/:organizationId/suppliers/:supplierId/restore` | Restore an archived supplier |

Mutations require JSON, exact `Origin: WEB_ORIGIN` and `X-SPC-CSRF: 1`. The frontend supplies the custom header. Better Auth is reached through its HTTP handler to retain library rate limiting; its general account/session endpoints are not publicly mounted. The current library rate-limit store is PostgreSQL. Configure `TRUST_PROXY_HOPS` only for the actual trusted deployment topology; client-provided IP headers are replaced with Express's resolved IP. Production requires a private random `AUTH_SECRET` (at least 32 characters), HTTPS `WEB_ORIGIN`, and explicit SMTP host/sender. SMTP authentication uses `SMTP_USER`/`SMTP_PASSWORD`; production transport requires TLS. Never put these credentials in frontend variables or logs.

Recovery for a user who still controls their email is a fresh login link. Lost-mailbox recovery, email changes, member invitations, password login and public signup are not implemented. Handle lost-mailbox requests through an independently verified operator process; do not change a user's email merely on request or rerun provisioning to restore memberships. Production SMTP/domain delivery and remote database configuration must be verified before real pilot access.

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

The identity foundation includes `Organization`, `User`, `Membership`, and `AuditEvent`, extended through a forward migration with `Session`, Better Auth's core `Account`/`Verification`/`RateLimit` models and `OrganizationCreation` idempotency records. Account fields for password/OAuth credentials are currently unused. Membership roles are `owner`, `editor`, and `viewer` (the default). Organization time zones remain unset until explicitly configured. Emails must be trimmed and lowercase. Memberships can be revoked while retaining audit history. Audit actors use a composite foreign key to membership in the same organization; system events may have no actor. Database triggers reject audit updates/deletions, and runtime credentials cannot truncate the audit table. Audit metadata must be a JSON object containing only minimal event context, never full price lists, secrets, or personal pricing terms.

Organization and supplier endpoints enforce current membership and operation-level permissions. Viewers can read suppliers; editors and owners can create, edit, archive and restore them. Wrong-tenant resource IDs return a non-disclosing 404. Future business endpoints must enforce the same tenant boundary. The shared runtime role does not provide row-level tenant isolation on its own.

For Supabase, provision separate runtime/migration roles and grants, use direct or session connections, and disable unused Data API access before deployment. Local verification does not verify Supabase connectivity or permissions. See the [Prisma 7 PostgreSQL guide](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql) and [Prisma configuration reference](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference).

### Supplier page state previews

During local development, the supplier page exposes deterministic previews for visual and accessibility checks:

- `/organizations/:organizationId/suppliers?preview=loading`
- `/organizations/:organizationId/suppliers?preview=error`
- `/organizations/:organizationId/suppliers?preview=populated`

The populated preview uses clearly labelled synthetic data. These query parameters are ignored in production; ordinary page loads use the real supplier API.

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

Run authentication integration tests against the same local test database:

```bash
TEST_DATABASE_URL='postgresql://spc_app:local_app_password@127.0.0.1:5433/supplier_price_control_test?schema=app' pnpm auth:test
```

These cover actual Better Auth requests, token replay/concurrency, expiry, rotation, logout revocation failures, store/mail outages, CSRF, rate limiting, organization isolation, idempotent creation and supplier CRUD/search/pagination/archive authorization. Unlike the transactional database tests, HTTP tests retain uniquely named synthetic fixtures in the disposable test database because requests span independent transactions and audit records are immutable. Do not point them at real customer data. `pnpm test` skips these integration cases when `TEST_DATABASE_URL` is absent; explicit `pnpm auth:test` requires it.

With Google Chrome installed, the test database migrated and local Mailpit running, `pnpm test:e2e` starts dedicated API/web servers on ports 3009/5179. It tests mail delivery, login, language changes without form loss, organization settings/creation, supplier create/edit/archive/restore, reload, independent tabs, mobile layout, synchronized logout and replay rejection. No real email is sent. Traces and screenshots are disabled to keep credentials out of artifacts.

GitHub Actions runs a frozen install, local PostgreSQL bootstrap, migration deployment/replay/schema comparison, typecheck, lint, API/database/authentication tests, and build for every pull request and every push to `main`. The Chrome/Mailpit browser test is currently a local check.

## Full local acceptance check

The implemented scope is login/session management, organizations, supplier management and the bilingual UI. File upload, catalog/price import, matching, pricing rules, comparisons, approvals and exports are not implemented yet. Disabled actions and synthetic previews do not verify these future workflows.

Use the setup above, preserve existing `.env` files, and run these commands from the repository root. PostgreSQL and Mailpit must be available; the browser test requires Google Chrome and free ports 3009/5179. These connection strings are only for the disposable local databases created by Compose.

```bash
docker compose --profile mail up -d --wait postgres mailpit
MIGRATION_DATABASE_URL='postgresql://spc_migrator:local_migration_password@127.0.0.1:5433/supplier_price_control_test?schema=app' pnpm db:deploy
MIGRATION_DATABASE_URL='postgresql://spc_migrator:local_migration_password@127.0.0.1:5433/supplier_price_control_test?schema=app' SHADOW_DATABASE_URL='postgresql://spc_migrator:local_migration_password@127.0.0.1:5433/supplier_price_control_shadow?schema=app' pnpm db:check
pnpm typecheck
pnpm lint
pnpm test
TEST_DATABASE_URL='postgresql://spc_app:local_app_password@127.0.0.1:5433/supplier_price_control_test?schema=app' pnpm db:test
TEST_DATABASE_URL='postgresql://spc_app:local_app_password@127.0.0.1:5433/supplier_price_control_test?schema=app' pnpm auth:test
pnpm test:e2e
pnpm build
```

`pnpm test` alone skips database-backed auth and supplier cases when `TEST_DATABASE_URL` is absent. Run the explicit integration commands too. HTTP/browser tests retain synthetic fixtures in the test database; do not use a customer database or delete the Docker volume as a routine cleanup step.

For manual checks, prepare the development database and two synthetic identities:

```bash
MIGRATION_DATABASE_URL='postgresql://spc_migrator:local_migration_password@127.0.0.1:5433/supplier_price_control?schema=app' pnpm db:deploy
pnpm auth:provision pilot@example.test "Synthetic pilot"
pnpm auth:provision second@example.test "Second synthetic pilot"
pnpm dev
```

Open `http://localhost:5180`; local mail is at `http://127.0.0.1:8025`. Complete this checklist in both Ukrainian and English:

| Area | Steps and expected result |
| --- | --- |
| Closed login | Request a link for `pilot@example.test`, open its Mailpit message and confirm Continue. The first login opens one organization. An unprovisioned email gets the generic accepted message but no mail. |
| Link reuse and expiry | Reopen a consumed link: confirmation fails. Request a fresh link and wait over 10 minutes before confirming: it fails. Request another to recover. |
| Session persistence | Reload, then restart only the API: the same browser remains signed in. Signing in again preserves the organization and suppliers. |
| Organization settings | Change name and timezone, save and reload: values persist. An invalid timezone is rejected. |
| Multiple organizations | Create a second organization. Create a supplier in the first and verify it is absent in the second. Switch organizations in one tab: another tab stays on its own organization URL and data. |
| Supplier lifecycle | Create a supplier with name/note, reload, open its profile and edit it. Archive it: it leaves the active list and appears under Archived. Restore it: it returns to Active. No physical deletion is needed. |
| Search and pagination | Search for an existing and a missing name; clear the search and switch status filters. Create more suppliers than one page holds, then check next/previous pages and reload with the URL filters intact. |
| Validation and drafts | Submit an empty name: saving is blocked with a clear error. Type an unsaved name/note, switch language, and verify the values remain. |
| Account isolation | In a separate browser profile/private window, sign in as `second@example.test`. Opening the first user's organization/supplier URL must not reveal its data. |
| Logout | Open two tabs in the same browser profile, then sign out in one. Both return to login and private URLs stay protected. An independent browser session remains signed in. |
| Availability | With web running, stop the API and reload a private page: show a service error, not a successful logout. Restart the API and retry. A real supplier request can also be blocked in DevTools to inspect its error/retry state. |
| UI and accessibility | Check keyboard navigation, focus, dialogs, 390 px width and reduced motion. Verify language survives reload. Use the supplier preview URLs above for deterministic loading/error/populated visuals. |

Viewer/editor permissions, revoked memberships, idle/absolute expiry, concurrent token consumption, CSRF, rate limits, audit integrity and database/SMTP failures are covered by the integration suites. Team administration has no UI yet; those role checks use synthetic memberships prepared by the tests. Development mail capture does not verify production email delivery or Supabase connectivity.

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
