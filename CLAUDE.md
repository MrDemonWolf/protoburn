# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ProtoBurn** is a Claude API token usage dashboard that tracks token consumption, calculates estimated costs, and displays usage analytics. Built as a full-stack app deployed on Cloudflare infrastructure.

## Repository

- GitHub: MrDemonWolf/protoburn
- Primary branch: `main`

## Tech Stack

- **Monorepo**: Turbo + pnpm workspaces
- **Frontend** (`apps/web`): Next.js 16 (static export), React 19, Tailwind CSS v4, shadcn/ui (Base UI primitives), Recharts, Lucide icons
- **Backend** (`apps/server`): Hono with tRPC integration, API key auth for writes
- **Database** (`packages/db`): Drizzle ORM + Cloudflare D1 (SQLite). Single `tokenUsage` table (model, inputTokens, outputTokens, date)
- **API** (`packages/api`): Shared tRPC router definitions used by both web and server
- **Infra** (`packages/infra`): Alchemy for Cloudflare Workers + D1 + static site deployment
- **Env** (`packages/env`): T3 Env pattern with Zod validation (`NEXT_PUBLIC_SERVER_URL` for web, `DB`/`API_KEY`/`CORS_ORIGIN` for server)
- **Config** (`packages/config`): Shared `tsconfig.base.json`

## Common Commands

```bash
pnpm dev              # Start all apps (turbo)
pnpm dev:web          # Start web only (via alchemy dev)
pnpm dev:server       # Start server only
pnpm build            # Build all
pnpm --filter web build  # Build web only
pnpm check-types      # TypeScript check all packages
pnpm db:push          # Push schema to D1
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run migrations
pnpm cf:deploy        # Deploy to Cloudflare (web + server + D1)
pnpm cf:destroy       # Tear down Cloudflare resources
pnpm sync             # Sync Claude Code token usage (scripts/sync.ts)
```

## Architecture Notes

- Frontend uses `useQuery(trpc.x.queryOptions())` pattern (tRPC v11 + TanStack React Query) — NOT the older `trpc.x.useQuery()` pattern
- UI components use `@base-ui/react` primitives (not `@radix-ui`) with shadcn "base-lyra" style
- `next.config.ts` has `output: "export"` (static SPA) and `reactCompiler: true`
- Server binds tRPC at `/trpc` and has REST endpoints at `/api/usage`

## Deployment

- Alchemy config: `packages/infra/alchemy.run.ts`
- Web deploys as Cloudflare Worker with `name: "protoburn"` override → `protoburn.mrdemonwolf.workers.dev`
- The Alchemy resource ID for the website is `"protoburn"` — do NOT change without updating `.alchemy/` state
- Server deploys as a separate Worker
- D1 database with migrations from `packages/db/drizzle`

## Branding

- Footer: `© {auto-year} ProtoBurn by MrDemonWolf, Inc.`

## Dashboard Features

- **Stats cards**: Total/Input/Output tokens + monthly cost with fire intensity indicator
- **Top Models leaderboard**: Top 3 models by token usage with medal rankings (gold/silver/bronze) and per-model cost
- **Usage chart**: Time-series token usage (Recharts)
- **Cost calculation**: `apps/web/src/lib/pricing.ts` — per-model pricing tiers (Haiku $1/$5, Sonnet $3/$15, Opus $5/$25 per million tokens), pattern-matched by model name, unknown models default to Sonnet rates
- **Footer**: Auto-updating year with linked MrDemonWolf branding
- **SEO**: Title, description, keywords, and OpenGraph metadata in layout
- **Favicon**: Fire SVG icon (`apps/web/src/app/icon.svg`)
- **Konami code easter egg**: Up Up Down Down Left Right Left Right B A triggers a multi-wave fire animation with phased timing, ember particles, gradient "PROTOBURN" title slam, and "EVERYTHING BURNS" tagline (`apps/web/src/components/konami-easter-egg.tsx`)

## tRPC Endpoints

- `tokenUsage.push` — bulk insert token usage records (mutation)
- `tokenUsage.totals` — all-time aggregate input/output/total tokens
- `tokenUsage.byModel` — all-time per-model token breakdown
- `tokenUsage.byModelMonthly` — per-model breakdown filtered to current month (optional `month` param)
- `tokenUsage.timeSeries` — daily token usage over last N days (default 30)

## Commit Preferences

- No co-author lines
- Multiple logical commits preferred
- User pushes manually
