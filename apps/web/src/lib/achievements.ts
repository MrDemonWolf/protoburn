import { getBurnTier } from "./burn-tiers";
import { computeCacheHitRatio, computeCacheSavings } from "./cache-analytics";
import { calculateCost } from "./pricing";

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  requirement: string;
}

export const BADGE_DEFINITIONS: Badge[] = [
  // Token milestones
  { id: "first-million", emoji: "\u{1F3AF}", name: "First Million", requirement: "Monthly total >= 1M tokens" },
  { id: "ten-million", emoji: "\u{1F48E}", name: "Ten Million Club", requirement: "Monthly total >= 10M tokens" },
  { id: "hundred-million", emoji: "\u{1F451}", name: "Hundred Million Club", requirement: "Monthly total >= 100M tokens" },
  { id: "billion", emoji: "\u{1F30D}", name: "Billion Token Club", requirement: "Monthly total >= 1B tokens" },
  // Cache badges
  { id: "cache-champion", emoji: "\u{1F3C6}", name: "Cache Champion", requirement: "Cache hit ratio >= 75% (min 100K cache tokens)" },
  { id: "cache-wizard", emoji: "\u{1F9D9}", name: "Cache Wizard", requirement: "Cache hit ratio >= 90% (min 1M cache tokens)" },
  { id: "big-saver", emoji: "\u{1F4B0}", name: "Big Saver", requirement: "Cache savings >= $10 this month" },
  { id: "mega-saver", emoji: "\u{1F911}", name: "Mega Saver", requirement: "Cache savings >= $100 this month" },
  { id: "giga-saver", emoji: "\u{1F4B0}", name: "Giga Saver", requirement: "Cache savings >= $1,000 this month" },
  // Model & spending
  { id: "model-explorer", emoji: "\u{1F52C}", name: "Model Explorer", requirement: "Used 3+ different models this month" },
  { id: "pro-burner", emoji: "\u{1F4B8}", name: "Pro Burner", requirement: "Estimated cost >= $20 (Pro tier)" },
  { id: "max-burner", emoji: "\u{1F433}", name: "Max Burner", requirement: "Estimated cost >= $100 (Max 5x tier)" },
  { id: "ultra-burner", emoji: "\u{1F680}", name: "Ultra Burner", requirement: "Estimated cost >= $200 (Max 20x tier)" },
  { id: "whale-burner", emoji: "\u{1F40B}", name: "Whale Burner", requirement: "Estimated cost >= $500" },
  { id: "legendary-burner", emoji: "\u{1F48E}", name: "Legendary Burner", requirement: "Estimated cost >= $1,000" },
  { id: "galaxy-burner", emoji: "\u{1F30C}", name: "Galaxy Burner", requirement: "Estimated cost >= $2,000" },
  // Output & ratio
  { id: "chatterbox", emoji: "\u{1F4AC}", name: "Chatterbox", requirement: "Output tokens > input tokens this month" },
  { id: "verbose-king", emoji: "\u{1F4DC}", name: "Verbose King", requirement: "Output >= 1M tokens this month" },
  { id: "listener", emoji: "\u{1F442}", name: "Listener", requirement: "Input >= 10x output tokens (prompt-heavy)" },
  { id: "balanced", emoji: "\u2696\uFE0F", name: "Balanced", requirement: "Output is 40-60% of input+output (min 1M total)" },
  // Daily streaks
  { id: "three-day-streak", emoji: "\u{1F525}", name: "Three-Day Streak", requirement: "3+ consecutive days with usage" },
  { id: "week-streak", emoji: "\u{1F4C5}", name: "Week Streak", requirement: "7+ consecutive days with usage" },
  { id: "two-week-streak", emoji: "\u26A1", name: "Two-Week Streak", requirement: "14+ consecutive days with usage" },
  { id: "monthly-streak", emoji: "\u{1F3C5}", name: "Monthly Streak", requirement: "30+ consecutive days with usage" },
  // Burn tier progression
  { id: "spark-starter", emoji: "\u{2728}", name: "Spark Starter", requirement: "Reached Spark tier (5M+ tokens)" },
  { id: "on-fire", emoji: "\u{1F525}", name: "On Fire", requirement: "Reached Burning tier (400M+ tokens)" },
  { id: "blazing-glory", emoji: "\u{1F31F}", name: "Blazing Glory", requirement: "Reached Blazing tier (1B+ tokens)" },
  { id: "inferno-survivor", emoji: "\u26A0\uFE0F", name: "Inferno Survivor", requirement: "Reached Inferno tier (2B+ tokens)" },
  { id: "meltdown", emoji: "\u{2622}\uFE0F", name: "Meltdown", requirement: "Reached Meltdown tier (3B+ tokens)" },
  { id: "beyond-meltdown", emoji: "\u{1F480}", name: "Beyond Meltdown", requirement: "Hit 5B+ tokens in a single month" },
];

interface ModelData {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

export interface DailyUsage {
  date: string;
  inputTokens: number;
  outputTokens: number;
}

interface MonthlyData {
  totalTokens: number;
  models: ModelData[];
  timeSeries?: DailyUsage[];
}

export function computeMaxStreak(days: DailyUsage[]): number {
  if (days.length === 0) return 0;

  // Sort by date ascending
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  let maxStreak = 0;
  let currentStreak = 0;
  let prevDate: Date | null = null;

  for (const day of sorted) {
    const totalTokens = day.inputTokens + day.outputTokens;
    if (totalTokens === 0) {
      currentStreak = 0;
      prevDate = null;
      continue;
    }

    const currentDate = new Date(day.date + "T00:00:00");
    if (prevDate) {
      const diffMs = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    if (currentStreak > maxStreak) maxStreak = currentStreak;
    prevDate = currentDate;
  }

  return maxStreak;
}

export function evaluateBadges(data: MonthlyData): Set<string> {
  const earned = new Set<string>();
  const { totalTokens, models } = data;

  // Token milestones
  if (totalTokens >= 1_000_000) earned.add("first-million");
  if (totalTokens >= 10_000_000) earned.add("ten-million");
  if (totalTokens >= 100_000_000) earned.add("hundred-million");
  if (totalTokens >= 1_000_000_000) earned.add("billion");

  // Cache champion / wizard
  const totalCacheRead = models.reduce((s, m) => s + m.cacheReadTokens, 0);
  const totalCacheCreation = models.reduce((s, m) => s + m.cacheCreationTokens, 0);
  const totalCacheTokens = totalCacheRead + totalCacheCreation;
  if (totalCacheTokens >= 100_000) {
    const hitRatio = computeCacheHitRatio(totalCacheRead, totalCacheCreation);
    if (hitRatio >= 0.75) earned.add("cache-champion");
  }
  if (totalCacheTokens >= 1_000_000) {
    const hitRatio = computeCacheHitRatio(totalCacheRead, totalCacheCreation);
    if (hitRatio >= 0.90) earned.add("cache-wizard");
  }

  // Savings badges
  const savings = computeCacheSavings(models);
  if (savings >= 10) earned.add("big-saver");
  if (savings >= 100) earned.add("mega-saver");
  if (savings >= 1000) earned.add("giga-saver");

  // Model explorer
  if (models.length >= 3) earned.add("model-explorer");

  // Spending milestones
  let totalCost = 0;
  for (const m of models) {
    totalCost += calculateCost(
      m.model,
      m.inputTokens,
      m.outputTokens,
      m.cacheCreationTokens,
      m.cacheReadTokens,
    );
  }
  if (totalCost >= 20) earned.add("pro-burner");
  if (totalCost >= 100) earned.add("max-burner");
  if (totalCost >= 200) earned.add("ultra-burner");
  if (totalCost >= 500) earned.add("whale-burner");
  if (totalCost >= 1000) earned.add("legendary-burner");
  if (totalCost >= 2000) earned.add("galaxy-burner");

  // Output & ratio badges
  const totalInput = models.reduce((s, m) => s + m.inputTokens, 0);
  const totalOutput = models.reduce((s, m) => s + m.outputTokens, 0);
  if (totalOutput > totalInput && totalInput > 0) earned.add("chatterbox");
  if (totalOutput >= 1_000_000) earned.add("verbose-king");
  if (totalOutput > 0 && totalInput >= 10 * totalOutput) earned.add("listener");
  const ioTotal = totalInput + totalOutput;
  if (ioTotal >= 1_000_000) {
    const outputRatio = totalOutput / ioTotal;
    if (outputRatio >= 0.4 && outputRatio <= 0.6) earned.add("balanced");
  }

  // Daily streak badges
  if (data.timeSeries) {
    const maxStreak = computeMaxStreak(data.timeSeries);
    if (maxStreak >= 3) earned.add("three-day-streak");
    if (maxStreak >= 7) earned.add("week-streak");
    if (maxStreak >= 14) earned.add("two-week-streak");
    if (maxStreak >= 30) earned.add("monthly-streak");
  }

  // Burn tier badges
  const tier = getBurnTier(totalTokens);
  const sparkTiers = ["spark", "warm", "burning", "blazing", "inferno", "meltdown"];
  if (sparkTiers.includes(tier.name)) earned.add("spark-starter");

  const burningTiers = ["burning", "blazing", "inferno", "meltdown"];
  if (burningTiers.includes(tier.name)) earned.add("on-fire");

  const blazingTiers = ["blazing", "inferno", "meltdown"];
  if (blazingTiers.includes(tier.name)) earned.add("blazing-glory");

  const infernoTiers = ["inferno", "meltdown"];
  if (infernoTiers.includes(tier.name)) earned.add("inferno-survivor");

  if (tier.name === "meltdown") earned.add("meltdown");

  if (totalTokens >= 5_000_000_000) earned.add("beyond-meltdown");

  return earned;
}

export function getEarnedCount(earned: Set<string>): number {
  return earned.size;
}
