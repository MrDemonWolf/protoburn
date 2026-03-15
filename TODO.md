# Get ProtoBurn Back Online

You just did a big refactor. Here's how to get everything working again.
One step at a time. Check the box when done.

---

## Step 1: Install deps (30 seconds)

```bash
bun install
```

- [ ] Done

---

## Step 2: Generate an API key (10 seconds)

Run this in your terminal and copy the output:

```bash
openssl rand -hex 32
```

Save it somewhere — you'll paste it in 3 places.

- [ ] I have my API key copied

---

## Step 3: Set up env files (2 minutes)

### Server env

```bash
cp apps/server/.env.example apps/server/.env
```

Edit `apps/server/.env`:

```env
CORS_ORIGIN=http://localhost:3001
API_KEY=PASTE_YOUR_KEY_HERE
OWNER_SITE=mrdemonwolf.com
```

### Web env

```bash
cp apps/web/.env.example apps/web/.env
```

Should already have:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

### Infra env

```bash
cp packages/infra/.env.example packages/infra/.env
```

Edit `packages/infra/.env`:

```env
ALCHEMY_PASSWORD=pick-something-secure
API_KEY=PASTE_YOUR_KEY_HERE
```

- [ ] All 3 env files are set up

---

## Step 4: Verify it works locally (1 minute)

```bash
bun dev
```

- Web: http://localhost:3001
- API: http://localhost:3000

- [ ] Dashboard loads (it's fine if there's no data yet)

---

## Step 5: Deploy to Cloudflare (2 minutes)

Make sure you're authenticated:

```bash
bun cf:setup
```

Then deploy:

```bash
bun cf:deploy
```

It'll print your URLs when done.

- [ ] Deployed and URLs are printed

---

## Step 6: Set up sync on your machine (1 minute)

Add these to your `~/.zshrc`:

```bash
export PROTOBURN_API_KEY="PASTE_YOUR_KEY_HERE"
export PROTOBURN_API_URL="https://protoburn-api.mrdemonwolf.workers.dev"
```

Then reload:

```bash
source ~/.zshrc
```

Test it:

```bash
bun sync
```

- [ ] Sync ran and pushed data

---

## Step 7: Set up continuous sync (optional, 30 seconds)

If you want it running in the background:

```bash
bun sync:watch
```

Or add a cron job / launchd plist to run `bun sync` every hour.

- [ ] Continuous sync is running (or I'll just run it manually)

---

## Step 8: Verify dashboard has data

Refresh your deployed dashboard URL. You should see your token usage.

- [ ] Dashboard shows my data

---

## You're done!

### What changed (if you're curious)

- **CORS is locked down** — no more wildcard `*`, only your site URL
- **API key is required** — no more open access fallback
- **tRPC push is auth'd** — both REST and tRPC writes need Bearer token
- **Rate limiting** — 30 req/min on write endpoints
- **Pricing is shared** — one package, not 3 copies
- **Docker support** — `docker compose up` works now for self-hosting
- **Admin panel** — `/setup`, `/login`, `/admin` routes (needs Better Auth secret to activate)
- **Better SEO** — "Your Personal Claude API Token Burn Tracker"
- **Docs** — `docs/` folder has deployment guides, API reference, troubleshooting

### If something breaks

1. `bun run check-types` — see if there are type errors
2. `bun run test` — see if tests pass (they should, 188/188)
3. Check `docs/troubleshooting.md` for common issues
4. CORS error? Make sure `CORS_ORIGIN` matches your web URL
5. 401 on sync? Make sure `PROTOBURN_API_KEY` matches `API_KEY` in server env
