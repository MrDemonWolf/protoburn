# protoburn - Claude API Cost & Usage Dashboard

Track your Claude API spending and token usage with a personal dashboard. Monitor monthly costs with a fire intensity indicator, see your top 3 most-used models on a trophy leaderboard, and visualize usage trends over time — all self-hosted on Cloudflare's free tier.

## Features

- **Monthly Cost Tracking**: Estimated API spend per month with a fire indicator that intensifies as costs rise.
- **Top Models Leaderboard**: Trophy-ranked top 3 models with gold/silver/bronze medals and per-model cost.
- **Token Usage Stats**: Real-time cards showing total, input, and output tokens.
- **Time-Series Charts**: Stacked area charts to visualize usage trends over time.
- **Burn Intensity System**: Ambient fire particle effects that scale with monthly token usage — from a few floating embers at 100K tokens to a full-screen meltdown inferno at 50M+. Toggleable from the header with localStorage persistence.
- **Tier Preview**: Append `?flametier=meltdown` (or any tier: cold, spark, warm, burning, blazing, inferno, meltdown) to preview fire effects.
- **Glassmorphism UI**: Frosted glass header and footer with backdrop blur, pill-style dark/light mode toggle, and one-click data refresh.
- **Automatic Sync**: Built-in sync script reads directly from Claude Code's local session data.
- **API Key Protection**: Write endpoints are protected with a bearer token so only you can push data.
- **Konami Code Easter Egg**: Up Up Down Down Left Right Left Right B A triggers an explosive multi-wave fire animation.
- **Free Tier Friendly**: Designed to run entirely on Cloudflare's free plan (Workers + Pages + D1).

## Getting Started

### Prerequisites

- Node.js 20.x or later
- pnpm 10.x
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/MrDemonWolf/protoburn.git
   cd protoburn
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Copy environment variables:

   ```bash
   cp apps/server/.env.example apps/server/.env
   cp apps/web/.env.example apps/web/.env
   cp packages/infra/.env.example packages/infra/.env
   ```

4. Generate a Drizzle migration and push the schema to local SQLite:

   ```bash
   pnpm db:generate
   pnpm db:push
   ```

5. Start the development servers:

   ```bash
   pnpm dev
   ```

- **Web**: http://localhost:3001
- **API**: http://localhost:3000

### Push test data locally

```bash
curl -X POST http://localhost:3000/api/usage \
  -H "Content-Type: application/json" \
  -d '{"records":[{"model":"claude-opus-4","inputTokens":15000,"outputTokens":3000,"date":"2026-02-07"}]}'
```

## Deployment to Cloudflare

This project uses [Alchemy](https://alchemy.run) to deploy the **API server** as a Cloudflare Worker and the **web dashboard** as a Cloudflare Pages site, with a D1 (SQLite) database.

### Step 1: Authenticate with Cloudflare

```bash
pnpm cf:setup
```

This opens a browser to authorize Alchemy with your Cloudflare account.

Alternatively, set an API token directly:

```bash
export CLOUDFLARE_API_TOKEN=your-api-token-here
```

Create a token at https://dash.cloudflare.com/profile/api-tokens with these permissions:
- **Account** > Workers Scripts > Edit
- **Account** > D1 > Edit
- **Account** > Cloudflare Pages > Edit

### Step 2: Configure environment

Update `packages/infra/.env` with a secure password for Alchemy state:

```
ALCHEMY_PASSWORD=your-secure-password
```

Optionally set an API key in `apps/server/.env` to protect write endpoints:

```
API_KEY=your-secret-api-key
```

Generate one with:

```bash
openssl rand -hex 32
```

### Step 3: Deploy

```bash
pnpm cf:deploy
```

This will:
1. Create a D1 database and run migrations
2. Deploy the Hono API server as a Cloudflare Worker
3. Build the Next.js dashboard as a static site
4. Deploy the static site to Cloudflare Pages
5. Print the URLs for both services

### Subsequent deploys

```bash
pnpm cf:deploy
```

### Tear down

```bash
pnpm cf:destroy
```

This removes all Cloudflare resources (Worker, Pages, D1 database).

## Syncing Claude Code Usage

The included sync script reads token usage directly from Claude Code's local data (`~/.claude/`) and pushes it to your dashboard.

### Setup

Add to your `~/.zshrc` (or `~/.bashrc`):

```bash
export PROTOBURN_API_KEY="your-api-key-here"
alias protoburn-sync="pnpm --dir /path/to/protoburn sync"
```

### Usage

```bash
# Sync new usage since last run
protoburn-sync

# Re-sync all historical data
protoburn-sync --full

# Wipe the database and re-sync everything
protoburn-sync --reset
```

The script reads from two sources:
- **`~/.claude/stats-cache.json`** for historical daily data (survives session rotation)
- **Session JSONL files** in `~/.claude/projects/` for current-day granular data

A `.protoburn-last-sync` file in `~/.claude/` tracks the last sync timestamp to avoid duplicates.

## Pushing Usage Data Manually

The `POST /api/usage` endpoint accepts token usage records via curl or any HTTP client:

```bash
curl -X POST https://your-worker.workers.dev/api/usage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "records": [
      {
        "model": "claude-opus-4",
        "inputTokens": 15000,
        "outputTokens": 3000,
        "date": "2026-02-07"
      }
    ]
  }'
```

| Field | Type | Description |
|-------|------|-------------|
| `model` | string | Model identifier (e.g. `claude-opus-4-6`, `claude-sonnet-4-5`) |
| `inputTokens` | number | Number of input tokens |
| `outputTokens` | number | Number of output tokens |
| `date` | string | ISO date string, day granularity (`YYYY-MM-DD`) |

## Project Structure

```
protoburn/
├── apps/
│   ├── web/                 # Next.js frontend (static export)
│   │   └── src/
│   │       ├── app/             # Pages & layout
│   │       └── components/
│   │           ├── dashboard/       # Stats cards, chart, top models leaderboard
│   │           └── ui/              # shadcn/ui components
│   └── server/              # Hono API server (Cloudflare Worker)
│       └── src/
│           └── index.ts         # tRPC + REST endpoints
├── packages/
│   ├── api/                 # tRPC router definitions
│   ├── db/                  # Drizzle ORM schema & migrations
│   ├── env/                 # Cloudflare Workers env bindings
│   ├── config/              # Shared TypeScript config
│   └── infra/               # Alchemy deployment config
└── scripts/
    └── sync.ts              # Claude Code usage sync script
```

## Development Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all applications |
| `pnpm check-types` | Run TypeScript type checking |
| `pnpm db:generate` | Generate Drizzle migration files |
| `pnpm db:push` | Push schema to local database |
| `pnpm db:migrate` | Run database migrations |
| `pnpm sync` | Sync Claude Code usage to dashboard |
| `pnpm cf:setup` | Authenticate Alchemy with Cloudflare |
| `pnpm cf:deploy` | Deploy to Cloudflare |
| `pnpm cf:destroy` | Tear down Cloudflare resources |

## Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) 16, [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Recharts](https://recharts.org/), Montserrat + Roboto fonts
- **Backend**: [Hono](https://hono.dev/), [tRPC](https://trpc.io/), [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)
- **Deployment**: [Alchemy](https://alchemy.run), Cloudflare Workers + Pages
- **Monorepo**: [Turborepo](https://turbo.build/), pnpm workspaces

## License

![GitHub license](https://img.shields.io/github/license/MrDemonWolf/protoburn.svg?style=for-the-badge&logo=github)

## Contact

- Discord: [Join my server](https://mrdwolf.net/discord)

Made with love by <a href="https://www.mrdemonwolf.com">MrDemonWolf, Inc.</a>
