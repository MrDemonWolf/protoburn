# API Reference

## Authentication

Write endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <API_KEY>
```

Read endpoints (tRPC queries, GET) are public — no auth needed.

## Rate Limiting

Write endpoints (`POST`, `DELETE` to `/api/*`) are rate-limited to **30 requests per minute** per IP using an in-memory sliding window.

## REST Endpoints

### POST /api/usage

Push token usage records.

**Auth**: Required

```json
{
  "records": [
    {
      "model": "claude-sonnet-4-5-20250514",
      "inputTokens": 1000,
      "outputTokens": 500,
      "cacheCreationTokens": 200,
      "cacheReadTokens": 100,
      "date": "2025-01-15"
    }
  ]
}
```

**Response**: `{ "ok": true, "count": 1 }`

Records are upserted on `(model, date)` — pushing the same model+date replaces the previous values.

### DELETE /api/usage

Clear all token usage data.

**Auth**: Required

**Response**: `{ "ok": true }`

### GET /api/og

Generate an OpenGraph image (PNG) showing current dashboard stats.

**Auth**: None

## tRPC Endpoints

All tRPC endpoints are available at `/trpc/<endpoint>`.

### Queries (public, no auth)

| Endpoint | Description |
|----------|-------------|
| `tokenUsage.totals` | All-time aggregate tokens (input, output, cache write, cache read, total) |
| `tokenUsage.byModel` | Per-model token breakdown |
| `tokenUsage.byModelMonthly` | Per-model breakdown for current month (optional `month` param) |
| `tokenUsage.timeSeries` | Daily token usage over last N days (default 30) |
| `tokenUsage.monthlyHistory` | Aggregated monthly history |
| `tokenUsage.velocity` | Burn rate, trend, projections |
| `auth.hasUsers` | Whether any users exist (for setup wizard) |
| `apiKeys.list` | List API keys (prefix only, no secrets) |
| `healthCheck` | Returns "OK" |

### Mutations (auth required)

| Endpoint | Description |
|----------|-------------|
| `tokenUsage.push` | Bulk insert/upsert token usage records |
| `auth.setup` | Generate first API key (only works if 0 users) |
| `auth.finalizeSetup` | Store API key for a user |
| `apiKeys.create` | Create a new API key |
| `apiKeys.revoke` | Delete an API key |
