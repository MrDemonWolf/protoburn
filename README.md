# ProtoBurn — Your Personal Claude API Token Burn Tracker

Track your Claude API token burn, monitor spending, and watch your usage go up in flames. Self-hosted, open-source, and built for power users.

**Deploy on Cloudflare (free tier)** or **self-host with Docker/Coolify**.

## Features

- **Monthly Cost Tracking**: Estimated API spend with fire intensity that scales with usage
- **Top Models Leaderboard**: Trophy-ranked top 3 models with gold/silver/bronze medals
- **Token Usage Stats**: Real-time cards with odometer roll-up animations for total, input, output, cache write, and cache read tokens
- **Prompt Caching Analytics**: Separate tracking for cache creation and cache read tokens with accurate per-model cost calculation
- **Time-Series Charts**: Stacked area charts (input, output, cache write, cache read) with weekly navigation
- **Heatmap Calendar**: GitHub-contribution-style 90-day grid with hover tooltips
- **Cost Breakdown & Forecast**: Donut chart + projected monthly spend based on current velocity
- **Monthly Burn History**: Historical monthly totals with burn tier indicators
- **Monthly Achievements**: 30 unlockable badges based on usage milestones
- **Velocity Ticker**: Live token burn rate with trend indicators
- **Burn Intensity System**: Ambient fire particle effects (WebGL2 + Canvas 2D) scaling from a few embers to nuclear meltdown across 7 tiers: cold, spark, warm, burning, blazing, inferno, meltdown
- **Dynamic OG Image**: Server-generated Open Graph image with live stats and burn tier
- **PWA Support**: Installable with offline capability
- **Discord Webhooks**: Notifications for sync events and burn tier changes
- **Admin Panel**: API key management and data management (with optional Better Auth)
- **Setup Wizard**: First-user account creation with API key generation
- **API Key Protection**: Write endpoints are protected with Bearer token auth; rate-limited to 30 req/min
- **Konami Code Easter Egg**: Explosive multi-wave fire animation
- **Dual Deployment**: Cloudflare Workers + D1 (free tier) or Docker + SQLite (self-hosted)

## Quick Start

### Option 1: Cloudflare (recommended for single user)

```bash
git clone https://github.com/MrDemonWolf/protoburn.git
cd protoburn
bun install
bun cf:setup
# Set API_KEY in .env
bun cf:deploy
```

See [docs/deploy-cloudflare.md](docs/deploy-cloudflare.md) for full instructions.

### Option 2: Docker (self-hosted / Coolify)

```bash
git clone https://github.com/MrDemonWolf/protoburn.git
cd protoburn
cp .env.example .env
# Edit .env with your API_KEY
docker compose up -d
```

- **Web**: http://localhost:8080
- **API**: http://localhost:3000
- **Setup**: http://localhost:8080/setup (first-time only)

See [docs/deploy-docker.md](docs/deploy-docker.md) for full instructions including Coolify.

## Syncing Claude Code Usage

The included sync script reads token usage directly from Claude Code's local data (`~/.claude/`) and pushes it to your dashboard.

```bash
export PROTOBURN_API_KEY="your-api-key"
export PROTOBURN_API_URL="https://your-api.workers.dev"  # or http://localhost:3000

# One-time sync
bun sync

# Continuous sync (push every 60m, fetch every 30m)
bun sync:watch

# Re-sync all historical data
bun sync --full
```

## Project Structure

```
protoburn/
├── apps/
│   ├── web/              # Next.js 16 static SPA (dashboard UI)
│   └── server/           # Hono API server (CF Workers or Node.js)
├── packages/
│   ├── api/              # Shared tRPC router definitions
│   ├── auth/             # Better Auth configuration
│   ├── config/           # Shared TypeScript config
│   ├── db/               # Drizzle ORM schema + adapters (D1 + SQLite)
│   ├── env/              # T3 Env validation (CF + Node.js entries)
│   ├── infra/            # Alchemy (Cloudflare deployment)
│   └── pricing/          # Shared pricing & burn tier logic
├── scripts/
│   └── sync.ts           # Claude Code usage sync script
├── docs/                 # Deployment & reference docs
├── Dockerfile            # Multi-stage Docker build
└── docker-compose.yml
```

## Documentation

- [Deploy to Cloudflare](docs/deploy-cloudflare.md)
- [Deploy with Docker](docs/deploy-docker.md) (includes Coolify)
- [API Reference](docs/api.md)
- [Architecture](docs/architecture.md)
- [Troubleshooting](docs/troubleshooting.md)

## Development

```bash
bun install
bun dev          # Start all apps
bun run test     # Run tests (vitest)
bun run check-types  # TypeScript check
bun run build    # Build all
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Recharts
- **Backend**: Hono, tRPC v11, Drizzle ORM
- **Auth**: Better Auth (optional, for self-hosted admin panel)
- **Database**: Cloudflare D1 or SQLite (via better-sqlite3)
- **Deployment**: Cloudflare Workers or Docker + nginx
- **Monorepo**: Turborepo + Bun workspaces

## License

![GitHub license](https://img.shields.io/github/license/MrDemonWolf/protoburn.svg?style=for-the-badge&logo=github)

## Contact

- Discord: [Join my server](https://mrdwolf.net/discord)

Made with love by <a href="https://www.mrdemonwolf.com">MrDemonWolf, Inc.</a>
