import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@protoburn/api/context";
import { appRouter } from "@protoburn/api/routers/index";
import db, { schema } from "@protoburn/db";
import { env } from "@protoburn/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { z } from "zod";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
  }),
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

// Protect write endpoints with API key
app.use("/api/*", async (c, next) => {
  if (c.req.method === "GET" || c.req.method === "OPTIONS") return next();
  const apiKey = env.API_KEY;
  if (!apiKey) return next(); // no key configured = open access
  const header = c.req.header("Authorization");
  if (header !== `Bearer ${apiKey}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
});

const usageSchema = z.object({
  records: z.array(
    z.object({
      model: z.string(),
      inputTokens: z.number().int().nonnegative(),
      outputTokens: z.number().int().nonnegative(),
      cacheCreationTokens: z.number().int().nonnegative().default(0),
      cacheReadTokens: z.number().int().nonnegative().default(0),
      date: z.string(),
    }),
  ),
});

app.post("/api/usage", async (c) => {
  const body = await c.req.json();
  const parsed = usageSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const rows = parsed.data.records.map((r) => ({
    model: r.model,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    cacheCreationTokens: r.cacheCreationTokens,
    cacheReadTokens: r.cacheReadTokens,
    date: r.date,
  }));

  // D1 has a 100 bound-parameter limit per query; batch inserts to stay under
  const BATCH_SIZE = 10;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await db.insert(schema.tokenUsage).values(rows.slice(i, i + BATCH_SIZE));
  }

  return c.json({ ok: true, count: rows.length });
});

app.delete("/api/usage", async (c) => {
  await db.delete(schema.tokenUsage);
  return c.json({ ok: true });
});

app.get("/api/og", async (c) => {
  try {
    const { generateOgImage } = await import("./og");
    return await generateOgImage(c);
  } catch (e) {
    console.error("OG image generation failed:", e);
    return c.json({ error: String(e) }, 500);
  }
});

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
