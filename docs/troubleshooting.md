# Troubleshooting

## CORS Errors

**Symptom**: Browser console shows `Access-Control-Allow-Origin` errors.

**Fix**: Ensure `CORS_ORIGIN` on the server matches the URL where the web app is served.

- Cloudflare: Set `SITE_URL` in `.env` before deploying
- Docker: Set `CORS_ORIGIN` in `.env` to match the web URL (e.g., `http://localhost:8080`)

## Sync Script Fails with 401

**Symptom**: `bun sync` returns `API error 401: Unauthorized`.

**Fix**: Ensure `PROTOBURN_API_KEY` matches the `API_KEY` configured on the server.

```bash
export PROTOBURN_API_KEY=your-api-key
bun sync
```

## Sync Script Fails with 500

**Symptom**: `bun sync` returns `API error 500: API_KEY not configured`.

**Fix**: The server requires `API_KEY` to be set. For Cloudflare, set it in `.env` and redeploy. For Docker, add it to `docker-compose.yml` environment.

## Docker: Database Not Persisting

**Symptom**: Data disappears after `docker compose down && docker compose up`.

**Fix**: Ensure you're using a named volume (the default `docker-compose.yml` does this):

```yaml
volumes:
  protoburn-data:
```

Do NOT use `docker compose down -v` unless you want to delete data.

## Docker: Web Shows "Failed to fetch"

**Symptom**: Dashboard loads but shows no data.

**Fix**: The `NEXT_PUBLIC_SERVER_URL` build arg must be reachable from the browser (not just from within Docker). If running locally, use `http://localhost:3000`, not `http://server:3000`.

## Migrations

### Cloudflare D1

Migrations run automatically on deploy via Alchemy.

### Docker (SQLite)

The Node.js entry creates tables on first run. For schema updates, the tables are created if they don't exist. For breaking changes, back up your database and delete the volume:

```bash
docker compose cp server:/app/data/protoburn.db ./backup.db
docker compose down -v
docker compose up -d --build
```

## Build Failures

**Symptom**: `bun run build` fails with type errors.

**Fix**: Run `bun run check-types` to see all errors. Common causes:
- Missing dependencies after pulling: run `bun install`
- Stale turbo cache: run `bun run build --force`
