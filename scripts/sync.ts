#!/usr/bin/env npx tsx
/**
 * Sync Claude Code token usage to protoburn dashboard.
 *
 * Reads historical data from ~/.claude/stats-cache.json and current-day
 * data from session JSONL files, then pushes records to the API.
 * Tracks last-sync timestamp to avoid duplicates.
 *
 * Usage:
 *   pnpm sync           # sync new usage since last run
 *   pnpm sync --full    # re-sync everything
 *   pnpm sync --reset   # wipe DB, clear state, and re-sync everything
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
  "https://protoburn-server-nathanialhenniges.mrdemonwolf.workers.dev";

const API_KEY = process.env.PROTOBURN_API_KEY ?? "";

const CLAUDE_DIR = join(homedir(), ".claude");
const STATE_FILE = join(CLAUDE_DIR, ".protoburn-last-sync");
const STATS_CACHE = join(CLAUDE_DIR, "stats-cache.json");

interface UsageBucket {
  input: number;
  output: number;
}

// model -> date -> { input, output }
type UsageMap = Map<string, Map<string, UsageBucket>>;

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

        const date = ts.slice(0, 10);

        if (!usage.has(model)) usage.set(model, new Map());
        const modelMap = usage.get(model)!;
        if (!modelMap.has(date)) modelMap.set(date, { input: 0, output: 0 });
        const bucket = modelMap.get(date)!;

        bucket.input += inputTokens;
        bucket.output += outputTokens;
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
function mergeUsage(statsCache: UsageMap, sessions: UsageMap): UsageMap {
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
    date: string;
  }[] = [];

  for (const [model, dates] of [...usage.entries()].sort()) {
    for (const [date, tokens] of [...dates.entries()].sort()) {
      if (tokens.input === 0 && tokens.output === 0) continue;
      records.push({
        model,
        inputTokens: tokens.input,
        outputTokens: tokens.output,
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

async function resetDb() {
  console.log("Resetting database ...");
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
  if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE);
  console.log("Database cleared.");
}

async function main() {
  const reset = process.argv.includes("--reset");
  const full = reset || process.argv.includes("--full");

  if (reset) {
    await resetDb();
  }

  const since = full ? "" : getLastSync();

  if (since) {
    console.log(`Syncing usage since ${since.slice(0, 19)} ...`);
  } else {
    console.log("Syncing all usage data ...");
  }

  // Read from both sources
  const statsCache = full ? parseStatsCache() : new Map();
  const { usage: sessions, latestTs, msgCount } = parseSessions(since);

  // Merge: JSONL overwrites stats-cache for overlapping dates
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
    return;
  }

  console.log(
    `Found data across ${modelCount} model(s) and ${daySet.size} day(s)`,
  );
  console.log(`  Input tokens:  ${totalIn.toLocaleString()}`);
  console.log(`  Output tokens: ${totalOut.toLocaleString()}`);

  try {
    const count = await push(usage);
    console.log(`Pushed ${count} record(s) to protoburn.`);
    if (latestTs) saveLastSync(latestTs);
  } catch (err) {
    console.error("Error pushing data:", err);
    process.exit(1);
  }
}

main();
