# Deploy with Docker

ProtoBurn supports self-hosting via Docker with SQLite for the database.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

## Quick Start

1. **Clone the repo**

   ```bash
   git clone https://github.com/MrDemonWolf/protoburn.git
   cd protoburn
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```env
   API_KEY=your-secret-api-key
   CORS_ORIGIN=http://localhost:8080
   API_PLAN=Max
   BILLING_RENEWAL_DAY=6

   # For Better Auth (optional)
   BETTER_AUTH_SECRET=a-random-secret-string
   BETTER_AUTH_URL=http://localhost:3000

   # Build-time (baked into the static frontend)
   NEXT_PUBLIC_SERVER_URL=http://localhost:3000
   NEXT_PUBLIC_SITE_URL=http://localhost:8080
   NEXT_PUBLIC_API_PLAN=Max
   ```

3. **Start**

   ```bash
   docker compose up -d
   ```

   - **Web**: http://localhost:8080
   - **API**: http://localhost:3000

4. **First-time setup** (if using Better Auth)

   Navigate to http://localhost:8080/setup to create your admin account and generate an API key.

5. **Sync your usage**

   ```bash
   export PROTOBURN_API_KEY=your-api-key
   export PROTOBURN_API_URL=http://localhost:3000
   bun sync
   ```

## Data Persistence

SQLite data is stored in a Docker volume (`protoburn-data`). To back up:

```bash
docker compose cp server:/app/data/protoburn.db ./backup.db
```

## Deploy on Coolify

1. Create a new project in Coolify
2. Add a Docker Compose service, point it at your repo
3. Set the environment variables in Coolify's UI
4. Deploy — Coolify will build and start both containers

Make sure to set `NEXT_PUBLIC_SERVER_URL` and `CORS_ORIGIN` to your Coolify-assigned domain.

## Updating

```bash
git pull
docker compose up -d --build
```
