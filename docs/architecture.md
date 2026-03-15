# Architecture

## Monorepo Structure

```
protoburn/
├── apps/
│   ├── web/          # Next.js 16 static SPA (dashboard UI)
│   └── server/       # Hono API server (CF Workers or Node.js)
├── packages/
│   ├── api/          # Shared tRPC router definitions
│   ├── auth/         # Better Auth configuration
│   ├── config/       # Shared tsconfig
│   ├── db/           # Drizzle ORM schema + adapters
│   ├── env/          # T3 Env validation (CF + Node.js)
│   ├── infra/        # Alchemy (Cloudflare deployment)
│   └── pricing/      # Shared pricing & burn tier logic
├── scripts/
│   └── sync.ts       # Claude Code usage sync script
├── docs/             # Documentation
├── Dockerfile        # Multi-stage Docker build
├── docker-compose.yml
└── nginx.conf        # SPA routing for Docker web container
```

## Data Flow

```
Claude Code sessions
    │
    ▼
sync.ts (reads ~/.claude/ JSONL + stats-cache.json)
    │
    ▼ POST /api/usage (Bearer token auth)
    │
Server (Hono + tRPC)
    │
    ▼
Database (D1 on Cloudflare / SQLite on Docker)
    │
    ▼ tRPC queries (public, no auth)
    │
Web Dashboard (React + TanStack Query)
```

## Deployment Targets

| Target | Database | Server Runtime | Web Hosting |
|--------|----------|---------------|-------------|
| Cloudflare | D1 (SQLite) | Workers | Workers (static) |
| Docker | SQLite (better-sqlite3) | Node.js + @hono/node-server | nginx (static) |

## Key Design Decisions

- **Static export**: The web app is a fully static SPA (`output: "export"`). No SSR, no server components. All data fetching happens client-side via tRPC.
- **App factory pattern**: The server uses `createApp(deps)` to accept db and env as parameters, enabling the same code to run on both Cloudflare Workers and Node.js.
- **Schema-only imports**: tRPC routers import `@protoburn/db/schema-export` (just the table definitions) rather than the db connection, so they work with any db adapter.
- **Shared pricing**: Model pricing and burn tier thresholds live in `@protoburn/pricing` — single source of truth used by web, server, and sync script.
- **Auth is optional**: Better Auth is only mounted if `BETTER_AUTH_SECRET` is set. Without it, the app uses the static `API_KEY` env var for auth — suitable for single-user Cloudflare deployments.
