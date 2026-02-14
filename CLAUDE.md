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
pnpm test             # Run all tests (vitest)
pnpm test:watch       # Watch mode
pnpm test:coverage    # Run with coverage
pnpm sync             # Sync Claude Code token usage (scripts/sync.ts)
pnpm sync:watch       # Continuous sync: push every 60m, fetch dashboard every 30m
pnpm sync --watch --interval 30  # Custom: push every 30m, fetch every 15m
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
- Fonts: Montserrat (headings via `font-heading`), Roboto (body via `font-sans`) — loaded from Google Fonts in `layout.tsx`
- Favicon: Fire SVG icon in primary blue `#00ACED` (`apps/web/src/app/icon.svg`)

## Dashboard Features

- **Stats cards**: Total/Input/Output tokens + monthly cost with fire intensity indicator; values animate with odometer roll-up on page load and on refresh when data changes (digits cascade up to final value via `AnimatedNumber` component)
- **Top Models leaderboard**: Top 3 models by token usage with medal rankings (gold/silver/bronze) and per-model cost; all numbers use odometer animation; FLIP position-swap animation when rankings change after refresh
- **Usage chart**: Time-series token usage (Recharts), flexes to fill remaining viewport height
- **Cost calculation**: `apps/web/src/lib/pricing.ts` — per-model pricing tiers (Haiku $1/$5, Sonnet $3/$15, Opus $5/$25 per million tokens), pattern-matched by model name, unknown models default to Sonnet rates
- **Footer**: Auto-updating year with linked MrDemonWolf branding, backdrop blur
- **SEO**: Title, description, keywords, and OpenGraph metadata in layout
- **Konami code easter egg**: Up Up Down Down Left Right Left Right B A triggers a multi-wave fire animation with phased timing, ember particles, gradient "PROTOBURN" title slam, and "EVERYTHING BURNS" tagline (`apps/web/src/components/konami-easter-egg.tsx`)

## Burn Intensity System

Ambient fire particle effects based on monthly token usage (`apps/web/src/components/burn-intensity.tsx`):

| Tier | Monthly Tokens | Embers | Flames | Side Glow | Top Glow | Special Effects |
|------|---------------|--------|--------|-----------|----------|-----------------|
| Cold | < 100K | 0 | 0 | No | No | — |
| Spark | 100K+ | 8 | 2 | No | No | — |
| Warm | 500K+ | 14 | 6 | Yes (2vw) | No | — |
| Burning | 1M+ | 25 | 14 | Yes (3.5vw) | No | — |
| Blazing | 5M+ | 32 | 18 | Yes (5vw) | No | — |
| Inferno | 10M+ | 35 | 18 | Yes (6vw) | Yes (12vh) | Light pulsing vignette |
| Meltdown | 20M+ | 120 | 60 | Yes (10vw) | Yes (20vh) | Nuclear alarm mode |

- Inferno tier has: light pulsing vignette (3.5s cycle), top edge glow, wider side glows reaching higher up the screen
- Meltdown tier is nuclear emergency: 120 embers (bigger/faster/brighter), 60 large flames, 75vh bottom glow at 90% opacity, full-height 10vw side glows, fast pulsing red vignette (1.2s cycle), top edge glow, heat shimmer distortion, flashing "⚠ MELTDOWN ⚠" warning text, yellow/black hazard stripe bars (top/bottom), rotating red beacon searchlights from corners, 4px strobing red edge lines, scrolling scanline overlay, 1-2px screen shake on the burn overlay, and screen shake on main content via `MeltdownShake` wrapper
- Toggle on/off via flame button in header (persists to localStorage)
- Current tier name displayed in header with color-coded label
- Preview any tier with `?flametier=meltdown` (or any tier name) query param
- Respects `prefers-reduced-motion` for accessibility
- `BurnEnabledProvider` context in `providers.tsx`, `useEffectiveTier` hook for query param override
- `MeltdownShake` wrapper component in `burn-intensity.tsx` — wraps main page content, applies `screenShake` animation when meltdown tier is active; wrapper div must have `flex flex-1 flex-col overflow-hidden` to preserve the parent `h-svh` flex layout

## UI Details

- **Layout**: No-scroll desktop viewport (`h-svh overflow-hidden`), chart flexes to fill remaining space
- **Header**: Backdrop blur (`bg-background/80 backdrop-blur-md`), z-20 above burn embers; contains refresh button, fire toggle with tier label, and dark/light mode toggle
- **Mode toggle**: Pill-style switch (sun/moon), click to toggle between light and dark
- **Refresh button**: Invalidates all React Query caches, spinning animation during refresh; triggers odometer roll-up animation on stat cards and top models when refetch completes (skipped if data unchanged)
- **Tab title on blur**: When burn effects are enabled and user switches away from the tab, browser title changes to `"$XX 🔥 TierName — ProtoBurn"` (monthly cost rounded up via `Math.ceil()`); restores default title on return (`apps/web/src/components/tab-title.tsx`)
- **Odometer animation**: `AnimatedNumber` component (`apps/web/src/components/ui/animated-number.tsx`) — digits roll up from random positions to target values with staggered delays and cubic-bezier deceleration; non-digit characters fade in; animates on first render (`animateOnMount`, default true); skips re-animation when `animateKey` bumps but value is unchanged; respects `prefers-reduced-motion`
- **CardTitle**: Uses `font-heading` (Montserrat) globally via `card.tsx`

## tRPC Endpoints

- `tokenUsage.push` — bulk insert token usage records (mutation)
- `tokenUsage.totals` — all-time aggregate input/output/total tokens
- `tokenUsage.byModel` — all-time per-model token breakdown
- `tokenUsage.byModelMonthly` — per-model breakdown filtered to current month (optional `month` param)
- `tokenUsage.timeSeries` — daily token usage over last N days (default 30)

## Testing

- **Runner**: Vitest with workspace projects (`vitest.config.ts` at root)
- **Projects**: `web` (unit tests for pricing, format, burn tiers), `server` (integration tests with in-memory SQLite), `scripts` (sync utility unit tests)
- **Server test strategy**: `@protoburn/db` aliased to `packages/db/src/test-utils.ts` (better-sqlite3 in-memory), `@protoburn/env/server` aliased to a stub — avoids `cloudflare:workers` runtime dependency
- **Pure utility extraction**: `getBurnTier` in `apps/web/src/lib/burn-tiers.ts`, `formatNumber`/`cleanModelName`/`getFireLevel` in `apps/web/src/lib/format.ts` — testable without React/trpc imports
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) — 3 parallel jobs: type-check, test, build; triggers on push/PR to `main`

## Commit Preferences

- No co-author lines
- Multiple logical commits preferred
- User pushes manually
