#!/usr/bin/env npx tsx
/**
 * Sync Claude Code token usage to protoburn dashboard.
 *
 * Reads historical data from ~/.claude/stats-cache.json and current-day
 * data from session JSONL files, then pushes records to the API.
 * Tracks last-sync timestamp to avoid duplicates.
 *
 * Usage:
 *   pnpm sync                    # sync new usage since last run
 *   pnpm sync --full             # re-sync everything
 *   pnpm sync --reset            # wipe DB, clear state, and re-sync everything
 *   pnpm sync --watch            # continuous mode: push every 60m, fetch every 30m
 *   pnpm sync --watch --interval 30  # push every 30m, fetch every 15m
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import { homedir } from "os";

const API_URL =
  process.env.PROTOBURN_API_URL ??
  "https://protoburn-api.mrdemonwolf.workers.dev";

const API_KEY = process.env.PROTOBURN_API_KEY ?? "";

const CLAUDE_DIR = join(homedir(), ".claude");
const STATE_FILE = join(CLAUDE_DIR, ".protoburn-last-sync");
const STATS_CACHE = join(CLAUDE_DIR, "stats-cache.json");

export interface UsageBucket {
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
}

// model -> date -> { input, output }
export type UsageMap = Map<string, Map<string, UsageBucket>>;

function getLastSync(): string {
  if (existsSync(STATE_FILE)) {
    return readFileSync(STATE_FILE, "utf-8").trim();
  }
  return "";
}

function saveLastSync(ts: string) {
  writeFileSync(STATE_FILE, ts, "utf-8");
}

/**
 * Read historical data from stats-cache.json.
 * Uses dailyModelTokens for per-day per-model totals and
 * modelUsage aggregate to estimate the input/output split.
 */
function parseStatsCache(): UsageMap {
  const usage: UsageMap = new Map();

  if (!existsSync(STATS_CACHE)) return usage;

  let cache: any;
  try {
    cache = JSON.parse(readFileSync(STATS_CACHE, "utf-8"));
  } catch {
    return usage;
  }

  // Build per-model input/output ratios from aggregate modelUsage
  const ratios = new Map<string, { inputRatio: number; outputRatio: number }>();
  const modelUsage = cache.modelUsage ?? {};
  for (const [model, stats] of Object.entries<any>(modelUsage)) {
    const totalDirect = (stats.inputTokens ?? 0) + (stats.outputTokens ?? 0);
    if (totalDirect > 0) {
      ratios.set(model, {
        inputRatio: stats.inputTokens / totalDirect,
        outputRatio: stats.outputTokens / totalDirect,
      });
    }
  }

  // Apply ratios to daily totals
  const dailyModelTokens: any[] = cache.dailyModelTokens ?? [];
  for (const day of dailyModelTokens) {
    const date: string = day.date;
    const tokensByModel: Record<string, number> = day.tokensByModel ?? {};

    for (const [model, total] of Object.entries(tokensByModel)) {
      const ratio = ratios.get(model) ?? { inputRatio: 0.5, outputRatio: 0.5 };

      if (!usage.has(model)) usage.set(model, new Map());
      usage.get(model)!.set(date, {
        input: Math.round(total * ratio.inputRatio),
        output: Math.round(total * ratio.outputRatio),
        cacheCreation: 0,
        cacheRead: 0,
      });
    }
  }

  return usage;
}

/**
 * Read current data from session JSONL files.
 * Returns granular per-message token data (excluding cache tokens
 * for consistency with stats-cache).
 */
function parseSessions(since: string) {
  const usage: UsageMap = new Map();
  let latestTs = since;
  let msgCount = 0;

  const projectsDir = join(CLAUDE_DIR, "projects");
  if (!existsSync(projectsDir)) return { usage, latestTs, msgCount };

  for (const project of readdirSync(projectsDir)) {
    const projectPath = join(projectsDir, project);
    let entries: string[];
    try {
      entries = readdirSync(projectPath);
    } catch {
      continue;
    }

    for (const file of entries) {
      if (!file.endsWith(".jsonl")) continue;

      let content: string;
      try {
        content = readFileSync(join(projectPath, file), "utf-8");
      } catch {
        continue;
      }

      for (const line of content.split("\n")) {
        if (!line) continue;

        let entry: any;
        try {
          entry = JSON.parse(line);
        } catch {
          continue;
        }

        if (entry.type !== "assistant") continue;

        const ts: string = entry.timestamp ?? "";
        if (!ts || ts <= since) continue;

        const msg = entry.message;
        if (!msg?.model || !msg?.usage) continue;

        const model: string = msg.model;
        const u = msg.usage;
        const inputTokens: number = u.input_tokens ?? 0;
        const outputTokens: number = u.output_tokens ?? 0;
        const cacheCreationTokens: number = u.cache_creation_input_tokens ?? 0;
        const cacheReadTokens: number = u.cache_read_input_tokens ?? 0;

        const date = ts.slice(0, 10);

        if (!usage.has(model)) usage.set(model, new Map());
        const modelMap = usage.get(model)!;
        if (!modelMap.has(date)) modelMap.set(date, { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 });
        const bucket = modelMap.get(date)!;

        bucket.input += inputTokens;
        bucket.output += outputTokens;
        bucket.cacheCreation += cacheCreationTokens;
        bucket.cacheRead += cacheReadTokens;
        msgCount++;

        if (ts > latestTs) latestTs = ts;
      }
    }
  }

  return { usage, latestTs, msgCount };
}

/**
 * Merge two usage maps. JSONL data overwrites stats-cache data
 * for any overlapping (model, date) pair since it's more accurate.
 */
export function mergeUsage(statsCache: UsageMap, sessions: UsageMap): UsageMap {
  const merged: UsageMap = new Map();

  // Start with stats-cache data
  for (const [model, dates] of statsCache) {
    merged.set(model, new Map(dates));
  }

  // Overwrite with JSONL data for any dates it covers
  const sessionDates = new Set<string>();
  for (const dates of sessions.values()) {
    for (const date of dates.keys()) sessionDates.add(date);
  }

  // Remove stats-cache entries for dates covered by session data
  for (const [model, dates] of merged) {
    for (const date of sessionDates) {
      dates.delete(date);
    }
  }

  // Add session data
  for (const [model, dates] of sessions) {
    if (!merged.has(model)) merged.set(model, new Map());
    const modelMap = merged.get(model)!;
    for (const [date, bucket] of dates) {
      modelMap.set(date, bucket);
    }
  }

  return merged;
}

async function push(usage: UsageMap) {
  const records: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    date: string;
  }[] = [];

  for (const [model, dates] of [...usage.entries()].sort()) {
    for (const [date, tokens] of [...dates.entries()].sort()) {
      if (tokens.input === 0 && tokens.output === 0 && tokens.cacheCreation === 0 && tokens.cacheRead === 0) continue;
      records.push({
        model,
        inputTokens: tokens.input,
        outputTokens: tokens.output,
        cacheCreationTokens: tokens.cacheCreation,
        cacheReadTokens: tokens.cacheRead,
        date,
      });
    }
  }

  if (records.length === 0) return 0;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

  const resp = await fetch(`${API_URL}/api/usage`, {
    method: "POST",
    headers,
    body: JSON.stringify({ records }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API error ${resp.status}: ${text}`);
  }

  const result = (await resp.json()) as { count?: number };
  return result.count ?? records.length;
}

async function clearDb() {
  console.log("Clearing database ...");
  const headers: Record<string, string> = {};
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;
  const resp = await fetch(`${API_URL}/api/usage`, {
    method: "DELETE",
    headers,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API error ${resp.status}: ${text}`);
  }
  console.log("Database cleared.");
}

async function resetDb() {
  await clearDb();
  if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE);
}

// ---------------------------------------------------------------------------
// Pricing (mirrors apps/web/src/lib/pricing.ts)
// ---------------------------------------------------------------------------

const MODEL_PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number; cacheWritePerMillion: number; cacheReadPerMillion: number }> = {
  "haiku-4-5": { inputPerMillion: 1.0, outputPerMillion: 5.0, cacheWritePerMillion: 1.25, cacheReadPerMillion: 0.1 },
  "sonnet-4-5": { inputPerMillion: 3.0, outputPerMillion: 15.0, cacheWritePerMillion: 3.75, cacheReadPerMillion: 0.3 },
  "opus-4-6": { inputPerMillion: 5.0, outputPerMillion: 25.0, cacheWritePerMillion: 6.25, cacheReadPerMillion: 0.5 },
};

const DEFAULT_PRICING = MODEL_PRICING["sonnet-4-5"]!;

export function getPricingTier(model: string) {
  for (const [pattern, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.includes(pattern)) return pricing;
  }
  return DEFAULT_PRICING;
}

export function calculateCost(model: string, inputTokens: number, outputTokens: number, cacheCreationTokens = 0, cacheReadTokens = 0): number {
  const tier = getPricingTier(model);
  return (
    (inputTokens / 1_000_000) * tier.inputPerMillion +
    (outputTokens / 1_000_000) * tier.outputPerMillion +
    (cacheCreationTokens / 1_000_000) * tier.cacheWritePerMillion +
    (cacheReadTokens / 1_000_000) * tier.cacheReadPerMillion
  );
}

// ---------------------------------------------------------------------------
// Fetch dashboard data from API (pull)
// ---------------------------------------------------------------------------

interface TotalsResponse {
  result: { data: { totalInput: number; totalOutput: number; totalCacheCreation: number; totalCacheRead: number; totalTokens: number } };
}

interface ModelEntry {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
}

interface ByModelMonthlyResponse {
  result: { data: { month: string; models: ModelEntry[] } };
}

async function fetchDashboard() {
  const headers: Record<string, string> = {};
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

  // Fetch totals and monthly breakdown in parallel
  const [totalsResp, monthlyResp] = await Promise.all([
    fetch(`${API_URL}/trpc/tokenUsage.totals`, { headers }),
    fetch(`${API_URL}/trpc/tokenUsage.byModelMonthly`, { headers }),
  ]);

  if (!totalsResp.ok || !monthlyResp.ok) {
    const errText = !totalsResp.ok ? await totalsResp.text() : await monthlyResp.text();
    throw new Error(`API fetch error: ${errText}`);
  }

  const totals = (await totalsResp.json()) as TotalsResponse;
  const monthly = (await monthlyResp.json()) as ByModelMonthlyResponse;

  return {
    totals: totals.result.data,
    monthly: monthly.result.data,
  };
}

function printDashboard(data: Awaited<ReturnType<typeof fetchDashboard>>) {
  const { totals, monthly } = data;
  const now = new Date();
  const timestamp = now.toLocaleTimeString();

  console.log("");
  console.log(`--- Dashboard (fetched ${timestamp}) ---`);
  console.log("");

  // All-time totals
  console.log("  All-time Totals:");
  console.log(`    Total tokens:       ${totals.totalTokens.toLocaleString()}`);
  console.log(`    Input tokens:       ${totals.totalInput.toLocaleString()}`);
  console.log(`    Output tokens:      ${totals.totalOutput.toLocaleString()}`);
  console.log(`    Cache write tokens: ${totals.totalCacheCreation.toLocaleString()}`);
  console.log(`    Cache read tokens:  ${totals.totalCacheRead.toLocaleString()}`);
  console.log("");

  // Monthly breakdown
  console.log(`  Monthly Breakdown (${monthly.month}):`);

  if (monthly.models.length === 0) {
    console.log("    No usage this month.");
  } else {
    // Sort by total tokens descending
    const sorted = [...monthly.models].sort((a, b) => b.totalTokens - a.totalTokens);
    let monthlyTotalCost = 0;

    for (const m of sorted) {
      const cost = calculateCost(m.model, m.inputTokens, m.outputTokens, m.cacheCreationTokens, m.cacheReadTokens);
      monthlyTotalCost += cost;
      console.log(
        `    ${m.model}: ${m.totalTokens.toLocaleString()} tokens ($${cost.toFixed(2)})`,
      );
    }

    const apiPlan = process.env.API_PLAN ?? "Build";
    console.log("");
    console.log(`  Est. Monthly Cost: $${monthlyTotalCost.toFixed(2)} (${apiPlan} plan)`);
  }

  console.log("---");
}

// ---------------------------------------------------------------------------
// One-shot sync logic
// ---------------------------------------------------------------------------

async function syncOnce(full: boolean): Promise<boolean> {
  const since = full ? "" : getLastSync();

  if (since) {
    console.log(`Syncing usage since ${since.slice(0, 19)} ...`);
  } else {
    console.log("Syncing all usage data ...");
  }

  // Clear DB before full sync to avoid duplicates
  if (full) {
    await clearDb();
  }

  const statsCache = full ? parseStatsCache() : new Map();
  const { usage: sessions, latestTs } = parseSessions(since);
  const usage = full ? mergeUsage(statsCache, sessions) : sessions;

  let totalIn = 0;
  let totalOut = 0;
  const modelCount = usage.size;
  const daySet = new Set<string>();

  for (const dates of usage.values()) {
    for (const [date, tokens] of dates) {
      totalIn += tokens.input;
      totalOut += tokens.output;
      daySet.add(date);
    }
  }

  if (daySet.size === 0) {
    console.log("No new usage data to sync.");
    return false;
  }

  console.log(
    `Found data across ${modelCount} model(s) and ${daySet.size} day(s)`,
  );
  console.log(`  Input tokens:  ${totalIn.toLocaleString()}`);
  console.log(`  Output tokens: ${totalOut.toLocaleString()}`);

  const count = await push(usage);
  console.log(`Pushed ${count} record(s) to protoburn.`);
  if (latestTs) saveLastSync(latestTs);
  return true;
}

// ---------------------------------------------------------------------------
// Watch mode
// ---------------------------------------------------------------------------

function parseInterval(): number {
  const idx = process.argv.indexOf("--interval");
  if (idx !== -1 && process.argv[idx + 1]) {
    const val = parseInt(process.argv[idx + 1]!, 10);
    if (!isNaN(val) && val > 0) return val;
  }
  return 60; // default 60 minutes
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatMinutes(m: number): string {
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  }
  return `${m}m`;
}

async function watchMode() {
  const pushIntervalMin = parseInterval();
  const fetchIntervalMin = Math.max(1, Math.floor(pushIntervalMin / 2));
  const pushIntervalMs = pushIntervalMin * 60 * 1000;
  const fetchIntervalMs = fetchIntervalMin * 60 * 1000;

  console.log(`Watch mode started.`);
  console.log(`  Push interval:  every ${formatMinutes(pushIntervalMin)}`);
  console.log(`  Fetch interval: every ${formatMinutes(fetchIntervalMin)}`);
  console.log(`  Press Ctrl+C to stop.`);
  console.log("");

  // Initial sync + fetch immediately
  try {
    await syncOnce(false);
  } catch (err) {
    console.error("Error on initial sync:", err);
  }

  try {
    const data = await fetchDashboard();
    printDashboard(data);
  } catch (err) {
    console.error("Error fetching dashboard:", err);
  }

  let lastPush = Date.now();
  let lastFetch = Date.now();

  // Main loop — check every 10 seconds for timer expiry
  while (true) {
    await sleep(10_000);

    const now = Date.now();

    // Fetch check (half the push interval)
    if (now - lastFetch >= fetchIntervalMs) {
      try {
        const data = await fetchDashboard();
        printDashboard(data);
      } catch (err) {
        console.error(`[${new Date().toLocaleTimeString()}] Fetch error:`, err);
      }
      lastFetch = Date.now();
    }

    // Push check
    if (now - lastPush >= pushIntervalMs) {
      console.log(`\n[${new Date().toLocaleTimeString()}] Pushing ...`);
      try {
        await syncOnce(false);
      } catch (err) {
        console.error(`[${new Date().toLocaleTimeString()}] Push error:`, err);
      }
      lastPush = Date.now();
    }
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  const reset = process.argv.includes("--reset");
  const full = reset || process.argv.includes("--full");
  const watch = process.argv.includes("--watch");

  if (reset) {
    await resetDb();
  }

  if (watch) {
    await watchMode();
  } else {
    try {
      await syncOnce(full);
    } catch (err) {
      console.error("Error pushing data:", err);
      process.exit(1);
    }
  }
}

const isDirectRun =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/^.*\//, ""));
if (isDirectRun) {
  main();
}
