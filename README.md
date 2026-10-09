# Supplier Price Control

Supplier Price Control is a SaaS application for importing supplier price lists, matching products, reviewing purchase price changes, and preparing approved exports.

## Current stack

- React 19 and TypeScript
- Vite 8
- React Router
- Tailwind CSS 4
- i18next and react-i18next
- Motion for React
- Radix UI primitives
- pnpm workspace
- Feature-Sliced Design for the frontend architecture

The planned backend uses Node.js, Express, Prisma, Supabase PostgreSQL, and Cloudflare R2.

## Requirements

- Node.js 22.21.1
- pnpm 9.15.9

With nvm installed, activate the project version:

```bash
nvm use
```

Install dependencies and start the frontend:

```bash
pnpm install
pnpm dev:web
```

## Available checks

```bash
pnpm typecheck:web
pnpm lint:web
pnpm build:web
```

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
