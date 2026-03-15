# Deploy to Cloudflare

ProtoBurn was originally built for Cloudflare Workers + D1. This is the simplest deployment path.

## Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [Bun](https://bun.sh/)
- A Cloudflare account with Workers enabled

## Setup

1. **Clone and install**

   ```bash
   git clone https://github.com/MrDemonWolf/protoburn.git
   cd protoburn
   bun install
   ```

2. **Configure Alchemy**

   ```bash
   bun cf:setup
   ```

3. **Set environment variables**

   Create a `.env` file in the project root:

   ```env
   API_KEY=your-secret-api-key
   SITE_URL=https://protoburn.your-domain.workers.dev
   API_PLAN=Max
   BILLING_RENEWAL_DAY=6
   # Optional
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   ```

4. **Deploy**

   ```bash
   bun cf:deploy
   ```

   This deploys:
   - **Web**: Static SPA to `protoburn.your-domain.workers.dev`
   - **Server**: API Worker to `protoburn-api.your-domain.workers.dev`
   - **D1**: SQLite database with auto-migrations

5. **Sync your usage**

   ```bash
   export PROTOBURN_API_KEY=your-secret-api-key
   export PROTOBURN_API_URL=https://protoburn-api.your-domain.workers.dev
   bun sync
   ```

## Daily Aggregation

A Cloudflare Cron Trigger runs daily at midnight UTC. On your billing renewal day, it aggregates old daily rows into monthly summaries and cleans up the daily table.

## Tear Down

```bash
bun cf:destroy
```
