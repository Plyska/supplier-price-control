# Supplier Price Control

[![CI](https://github.com/Plyska/supplier-price-control/actions/workflows/ci.yml/badge.svg)](https://github.com/Plyska/supplier-price-control/actions/workflows/ci.yml)

Supplier Price Control is a SaaS application for importing supplier price lists, matching products, reviewing purchase price changes, and preparing approved exports.

## Current stack

- React 19 and TypeScript
- Vite 8
- React Router
- Tailwind CSS 4
- shadcn/ui primitives with semantic OKLCH design tokens
- i18next and react-i18next
- Motion for React
- Radix UI primitives
- Node.js and Express 5 API
- Zod environment validation
- pnpm workspace
- Feature-Sliced Design for the frontend architecture

The API foundation is implemented with Node.js and Express. Prisma, Supabase PostgreSQL, and Cloudflare R2 belong to the infrastructure stage; the background worker will be added with the first durable file-processing job.

## Requirements

- Node.js 22.21.1
- pnpm 9.15.9

With nvm installed, activate the project version:

```bash
nvm use
```

Install dependencies and start the frontend and API together:

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm dev
```

The frontend uses the Vite development URL shown in the terminal. Axios sends requests to the relative `/api/v1` prefix, and Vite proxies `/api` to `http://127.0.0.1:3000` by default. The API health endpoint is `GET /api/v1/health`.

For direct cross-origin requests, Express allows credentialed requests from `WEB_ORIGIN` (`http://localhost:5173` by default). Change `WEB_ORIGIN` and `API_PROXY_TARGET` in the corresponding local environment files when the development origins differ.

To start a single process, use `pnpm dev:web` or `pnpm dev:api`.

## Available checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

The corresponding `:web` and `:api` scripts remain available for package-specific checks.

GitHub Actions runs the same frozen install, typecheck, lint, test, and build checks for every pull request and every push to `main`.

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
└── shared/    # Reusable UI, routes, utilities, and infrastructure
```

The `features` and `entities` layers will be added when the first business workflows require them. Dependencies flow from higher layers to lower layers, and each slice exposes a public API through `index.ts`.
