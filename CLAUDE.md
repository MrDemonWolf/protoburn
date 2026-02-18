# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ProtoBurn** is a Claude API token usage dashboard that tracks token consumption (including prompt caching), calculates estimated costs, and displays usage analytics. Built as a full-stack app deployed on Cloudflare infrastructure.

## Repository

- GitHub: MrDemonWolf/protoburn
- Primary branch: `main`

## Tech Stack

- **Monorepo**: Turbo + pnpm workspaces
- **Frontend** (`apps/web`): Next.js 16 (static export), React 19, Tailwind CSS v4, shadcn/ui (Base UI primitives), Recharts, Lucide icons
- **Backend** (`apps/server`): Hono with tRPC integration, API key auth for writes
- **Database** (`packages/db`): Drizzle ORM + Cloudflare D1 (SQLite). Single `tokenUsage` table (model, inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens, date)
- **API** (`packages/api`): Shared tRPC router definitions used by both web and server
- **Infra** (`packages/infra`): Alchemy for Cloudflare Workers + D1 + static site deployment
- **Env** (`packages/env`): T3 Env pattern with Zod validation (`NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_API_PLAN` for web; `DB`/`API_KEY`/`CORS_ORIGIN`/`API_PLAN` for server)
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
- Prompt caching tokens (`cache_creation_input_tokens`, `cache_read_input_tokens`) are tracked from Claude API JSONL session data and stored separately from regular input tokens; stats-cache historical data defaults cache fields to 0
- **Monthly token totals must use `m.totalTokens`** (which includes all token types: input, output, cache write, cache read) — NOT `m.inputTokens + m.outputTokens`. This affects burn tier calculation, header tier display, tab title, and MeltdownShake.
- API plan name is configurable via `API_PLAN` env var (defaults to "Max"); passed to server as binding and to web as `NEXT_PUBLIC_API_PLAN` at build time

## Deployment

- Alchemy config: `packages/infra/alchemy.run.ts`
- Web deploys as Cloudflare Worker with `name: "protoburn"` override → `protoburn.mrdemonwolf.workers.dev`
- The Alchemy resource ID for the website is `"protoburn"` — do NOT change without updating `.alchemy/` state
- Server deploys as a separate Worker
- D1 database with migrations from `packages/db/drizzle`
- `alchemy.env` proxy throws on missing vars — use `process.env.X ?? "default"` for optional bindings like `API_PLAN`

## Branding

- Footer: `© {auto-year} ProtoBurn by MrDemonWolf, Inc.`
- Fonts: Montserrat (headings via `font-heading`), Roboto (body via `font-sans`) — loaded from Google Fonts in `layout.tsx`
- Favicon: Fire SVG icon in primary blue `#00ACED` (`apps/web/src/app/icon.svg`)

## Dashboard Features

- **Stats cards** (two-row layout):
  - **Top row**: Total Tokens + Est. Monthly Cost (with fire intensity indicator, month label, and API plan name)
  - **Bottom row**: Input Tokens, Output Tokens, Cache Write (amber), Cache Read (purple)
  - All values animate with odometer roll-up on page load and on refresh when data changes (digits cascade up to final value via `AnimatedNumber` component)
- **Most Used Model**: Compact single-card display (`apps/web/src/components/dashboard/most-used-model.tsx`) showing the #1 model by total token usage with model name, token count, estimated cost, and per-type breakdown (In/Out/CW/CR); all numbers use odometer animation on page load and refresh
- **Usage chart**: Time-series token usage (Recharts) with 4 stacked areas — Input (#00ACED), Output (#0B7CC1), Cache Write (#F59E0B amber), Cache Read (#8B5CF6 purple); Y-axis supports K/M/B suffixes; flexes to fill remaining viewport height
- **Cost calculation**: `apps/web/src/lib/pricing.ts` — per-model pricing tiers with prompt caching support, pattern-matched by model name, unknown models default to Sonnet rates. Pricing copies also exist in `apps/server/src/lib/pricing.ts` and `scripts/sync.ts` — all three must be kept in sync

  | Model | Input | Cache Write (1.25x) | Cache Read (0.1x) | Output |
  |-------|-------|--------------------|--------------------|--------|
  | Haiku 4.5 | $1/M | $1.25/M | $0.10/M | $5/M |
  | Sonnet 4.5 | $3/M | $3.75/M | $0.30/M | $15/M |
  | Opus 4.6 | $5/M | $6.25/M | $0.50/M | $25/M |
- **Number formatting**: `formatNumber()` in `apps/web/src/lib/format.ts` and `apps/server/src/lib/format.ts` — supports K (thousands), M (millions), B (billions), T (trillions)
- **Footer**: Auto-updating year with linked MrDemonWolf branding, backdrop blur
- **SEO**: Title, description (mentions prompt caching), keywords, and OpenGraph metadata in layout
- **Heatmap calendar**: GitHub-contribution-style grid showing daily token usage over the past 90 days (`apps/web/src/components/dashboard/heatmap-calendar.tsx`); 7-row (Mon–Sun) × ~13-column (weeks) CSS grid; 5-level color scale from `bg-muted` (no data) through cool blue → deep blue → orange → red (hot); hover tooltip shows date, total tokens, estimated cost (Sonnet rates), and per-type breakdown (In/Out/CW/CR); uses `timeSeries({ days: 90 })` endpoint; responsive cell sizes (10px mobile, 14px desktop); includes day labels (Mon/Wed/Fri) and month labels
- **Konami code easter egg**: Up Up Down Down Left Right Left Right B A triggers a WebGL fire animation using the same procedural fire shader as `BurnCanvas`, phasing through spark → blazing → meltdown intensity tiers with gradient "PROTOBURN" title slam and "EVERYTHING BURNS" tagline; falls back to Canvas 2D `renderFallback()` if WebGL2 unavailable (`apps/web/src/components/konami-easter-egg.tsx`)

## Burn Intensity System

Ambient fire particle effects based on monthly total token usage including cache tokens (`apps/web/src/components/burn-intensity.tsx`):

| Tier | Monthly Tokens | Embers | Flames | Side Glow | Top Glow | Special Effects |
|------|---------------|--------|--------|-----------|----------|-----------------|
| Cold | < 20M | 0 | 0 | No | No | — |
| Spark | 20M+ | 16 | 6 | No | No | Bottom glow (12vh) |
| Warm | 100M+ | 22 | 10 | Yes (2.5vw) | No | Amber glow with 6s breathing pulse |
| Burning | 200M+ | 32 | 16 | Yes (3.5vw) | No | Pulsing bottom glow (4s), bright ember ground strip |
| Blazing | 1B+ | 40 | 20 | Yes (5vw, pulsing) | No | Heat shimmer, orange vignette, 3s pulsing glow |
| Inferno | 2B+ | 45 | 22 | Yes (6vw) | Yes (12vh) | Light pulsing vignette (3.5s cycle) |
| Meltdown | 4B+ | 120 | 60 | Yes (10vw) | Yes (20vh) | Nuclear alarm mode |

- Tier thresholds are defined in `apps/web/src/lib/burn-tiers.ts` (web) and `apps/server/src/lib/burn-tiers.ts` (server) — both must be kept in sync
- Monthly tokens for tier calculation uses `m.totalTokens` (includes cache tokens) — NOT just input+output
- **Rendering architecture**: Two-layer canvas system in `BurnCanvas` (`apps/web/src/components/burn-canvas.tsx`):
  - **Back layer** (WebGL2): Fullscreen fragment shader renders procedural fire using FBM noise (4 octaves of simplex noise). Handles bottom fire, side fire, top glow, vignettes, heat shimmer. Fire edges are organic and noise-driven — no hard rectangular cutoffs. Shader source in `apps/web/src/lib/fire-shaders.ts`.
  - **Front layer** (Canvas 2D): Particle system (embers + flames with additive blending). Particles float over the procedural fire. Rendering in `apps/web/src/lib/fire-renderer.ts`.
  - **WebGL2 fallback**: If `getContext("webgl2")` returns null, falls back to single-canvas Canvas 2D renderer with the original linear/radial gradient glows (`renderFallback()` in `fire-renderer.ts`)
  - Fullscreen quad uses vertex ID trick (no buffer needed, 3 vertices)
  - Shader uniforms map directly from `TierConfig` fields (e.g. `bottomGlowHeight` → `u_bottomHeight`)
- **Fire engine**: `apps/web/src/lib/fire-engine.ts` — struct-of-arrays `ParticlePool` for zero GC, simplex noise wind fields, spawn/despawn with natural decay on tier change
- Particles are boosted for visibility: larger sizes (3-8px embers, 16-38px flames), higher opacity, shorter 6s delay cycle so screen stays populated
- Each tier has distinct visual identity: spark is minimal particles + glow, warm adds amber-tinted pulsing glow, burning adds concentrated ground glow strip, blazing adds heat shimmer + orange vignette + pulsing side glows
- Inferno tier has: light pulsing vignette (3.5s cycle), top edge glow, wider side glows reaching higher up the screen
- Meltdown tier is nuclear emergency: 120 embers (bigger/faster/brighter), 60 large flames, 75vh bottom glow at 90% opacity, full-height 10vw side glows, fast pulsing red vignette (1.2s cycle), top edge glow, heat shimmer distortion, flashing "⚠ MELTDOWN ⚠" warning text, yellow/black hazard stripe bars (top/bottom), rotating red beacon searchlights from corners, 4px strobing red edge lines, scrolling scanline overlay, 1-2px screen shake on the burn overlay, and screen shake on main content via `MeltdownShake` wrapper
- Fire level on monthly cost card (`getFireLevel`) scales from $100 (2 flames) to $4000 (10 flames)
- Toggle on/off via flame button in header (persists to localStorage)
- Current tier name displayed in header with color-coded label
- Preview any tier with `?flametier=meltdown` (or any tier name) query param
- Respects `prefers-reduced-motion` for accessibility
- `BurnEnabledProvider` context in `providers.tsx`, `useEffectiveTier` hook for query param override
- `MeltdownShake` wrapper component in `burn-intensity.tsx` — wraps main page content, applies `screenShake` animation when meltdown tier is active; wrapper div must have `flex flex-1 flex-col overflow-hidden` to preserve the parent `h-svh` flex layout

## UI Details

- **Layout**: Mobile-friendly responsive — scrollable on mobile (`min-h-svh`), fixed no-scroll viewport on desktop (`md:h-svh md:overflow-hidden`); 3-row desktop layout: StatsCards → [Most Used Model | Heatmap Calendar] side-by-side (`md:grid-cols-[auto_1fr]`) → UsageChart (`md:flex-1`); stats cards stack single-column on narrow screens (`grid-cols-1 sm:grid-cols-2`); on mobile all sections stack vertically; chart has `min-h-[250px]` on mobile, `md:flex-1` on desktop; spacing/fonts reduce on mobile (`gap-3 p-3 md:gap-4 md:p-4`)
- **Header**: Backdrop blur (`bg-background/80 backdrop-blur-md`), z-20 above burn embers; contains refresh button, fire toggle with tier label, and dark/light mode toggle
- **Mode toggle**: Pill-style switch (sun/moon), click to toggle between light and dark
- **Refresh button**: Invalidates all React Query caches, spinning animation during refresh; triggers odometer roll-up animation on stat cards and top models when refetch completes (skipped if data unchanged)
- **Tab title on blur**: When burn effects are enabled and user switches away from the tab, browser title changes to `"$XX 🔥 TierName — ProtoBurn"` (monthly cost including cache tokens, rounded up via `Math.ceil()`); restores default title on return (`apps/web/src/components/tab-title.tsx`)
- **Odometer animation**: `AnimatedNumber` component (`apps/web/src/components/ui/animated-number.tsx`) — digits roll up from random positions to target values with staggered delays and cubic-bezier deceleration; non-digit characters fade in; animates on first render (`animateOnMount`, default true); skips re-animation when `animateKey` bumps but value is unchanged; respects `prefers-reduced-motion`
- **CardTitle**: Uses `font-heading` (Montserrat) globally via `card.tsx`

## tRPC Endpoints

- `tokenUsage.push` — bulk insert token usage records (mutation); includes `cacheCreationTokens` and `cacheReadTokens` (optional, default 0)
- `tokenUsage.totals` — all-time aggregate input/output/cacheCreation/cacheRead/total tokens
- `tokenUsage.byModel` — all-time per-model token breakdown (includes cache token fields)
- `tokenUsage.byModelMonthly` — per-model breakdown filtered to current month (optional `month` param, includes cache token fields); `totalTokens` includes all token types
- `tokenUsage.timeSeries` — daily token usage over last N days (default 30, includes cache token fields)
- **D1 batch limit**: Inserts are chunked to 10 rows per query to stay under D1's 100 bound-parameter limit (7 params/row × 10 = 70)

## Sync Script

`scripts/sync.ts` — syncs Claude Code token usage to the dashboard:

- Reads `~/.claude/stats-cache.json` (historical) and session JSONL files (current day)
- Captures `cache_creation_input_tokens` and `cache_read_input_tokens` from JSONL entries
- Stats-cache historical data defaults cache fields to 0 (no cache breakdown available)
- Dashboard fetch shows per-model cache tokens (CW/CR) and est. monthly cost with plan name
- Push output includes cache write/read token totals
- `API_PLAN` env var (defaults to "Max") controls plan label in dashboard output

## Testing

- **Runner**: Vitest with workspace projects (`vitest.config.ts` at root)
- **Projects**: `web` (unit tests for pricing, format, burn tiers), `server` (integration tests with in-memory SQLite), `scripts` (sync utility unit tests)
- **Server test strategy**: `@protoburn/db` aliased to `packages/db/src/test-utils.ts` (better-sqlite3 in-memory), `@protoburn/env/server` aliased to a stub — avoids `cloudflare:workers` runtime dependency; the test-utils CREATE TABLE must include `cache_creation_tokens` and `cache_read_tokens` columns
- **Pure utility extraction**: `getBurnTier` in `apps/web/src/lib/burn-tiers.ts`, `formatNumber`/`cleanModelName`/`getFireLevel` in `apps/web/src/lib/format.ts`, `FireEngine`/`ParticlePool`/`tierToConfig` in `apps/web/src/lib/fire-engine.ts` — testable without React/DOM/WebGL imports
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) — 3 parallel jobs: type-check, test, build; triggers on push/PR to `main`

## Commit Preferences

- No co-author lines
- Multiple logical commits preferred
