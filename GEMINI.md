# ProtoBurn - Project Context & Instructions

ProtoBurn is a self-hosted, open-source Claude API token burn tracker. It monitors spending, token usage, and provides a visual dashboard to watch your usage "go up in flames" via a tiered burn intensity system.

## Project Overview

- **Purpose**: Track Claude API token usage (input, output, cache write, cache read) and estimated costs.
- **Architecture**: A TypeScript monorepo using Turborepo and Bun workspaces.
  - **Frontend (`apps/web`)**: Next.js 16 (React 19) static SPA dashboard. Uses Tailwind CSS v4, shadcn/ui, and Recharts.
  - **Backend (`apps/server`)**: Hono API server. Supports Cloudflare Workers (D1) and Node.js (SQLite).
  - **API Layer**: tRPC v11 for end-to-end type safety between the dashboard and server.
  - **Database**: Drizzle ORM with Cloudflare D1 (edge) or SQLite (self-hosted).
  - **Auth**: Better Auth for the admin panel and API key management.
  - **Sync**: A specialized script (`scripts/sync.ts`) reads token usage from local Claude Code data (`~/.claude/`) and pushes it to the API.

## Building and Running

### Prerequisites
- `bun` (latest recommended)
- `node` (version 22.x recommended)

### Core Commands
- **Install Dependencies**: `bun install`
- **Development**: `bun dev` (Starts both web and server apps via Turbo)
- **Build All**: `bun run build`
- **Type Check**: `bun run check-types`
- **Run Tests**: `bun run test` (Powered by Vitest)

### Database Management
- **Generate Migrations**: `bun db:generate`
- **Push Schema (Local/Dev)**: `bun db:push`
- **Run Migrations**: `bun db:migrate`

### Claude Code Sync
- **One-time Sync**: `bun sync` (Requires `PROTOBURN_API_KEY` and `PROTOBURN_API_URL`)
- **Watch Mode**: `bun sync:watch`

## Development Conventions

- **Monorepo Structure**: Logic is split between `apps/` and `packages/`.
  - `@protoburn/api`: Shared tRPC router definitions and procedures.
  - `@protoburn/db`: Database schema (Drizzle) and connection logic.
  - `@protoburn/pricing`: Shared logic for cost calculation and "burn tiers".
  - `@protoburn/env`: Centralized environment variable validation using Zod/T3 Env.
- **API Safety**: Write endpoints (`/api/*` and certain tRPC mutations) are protected by a Bearer token API key.
- **Type Safety**: Use Zod for all input validation and Drizzle for all database interactions.
- **Styling**: Tailwind CSS v4 is used for the frontend. Follow existing patterns in `apps/web/src/components/ui`.
- **Testing**: Add unit tests in `__tests__` directories using Vitest. Mock database interactions where possible.
- **Deployment**: The project supports two main paths:
  1. **Cloudflare**: Workers + D1 + R2 (handled via `@protoburn/infra` and Alchemy).
  2. **Docker**: A multi-stage Dockerfile is provided at the root for self-hosting.

## Key Files
- `apps/server/src/app.ts`: Main Hono application setup and middleware.
- `apps/web/src/app/page.tsx`: Main dashboard UI component.
- `packages/db/src/schema.ts`: Drizzle schema definitions for usage tracking and auth.
- `packages/api/src/routers/index.ts`: Root tRPC router and usage procedures.
- `scripts/sync.ts`: CLI tool for syncing Claude Code history.
