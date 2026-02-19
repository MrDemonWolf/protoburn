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
  { id: "big-saver", emoji: "\u{1F4B0}", name: "Big Saver", requirement: "Cache savings >= $10 this month" },
  { id: "mega-saver", emoji: "\u{1F911}", name: "Mega Saver", requirement: "Cache savings >= $100 this month" },
  // Model & spending
  { id: "model-explorer", emoji: "\u{1F52C}", name: "Model Explorer", requirement: "Used 3+ different models this month" },
  { id: "pro-burner", emoji: "\u{1F4B8}", name: "Pro Burner", requirement: "Estimated cost >= $20 (Pro tier)" },
  { id: "max-burner", emoji: "\u{1F433}", name: "Max Burner", requirement: "Estimated cost >= $100 (Max 5x tier)" },
  { id: "ultra-burner", emoji: "\u{1F680}", name: "Ultra Burner", requirement: "Estimated cost >= $200 (Max 20x tier)" },
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

interface MonthlyData {
  totalTokens: number;
  models: ModelData[];
}

export function evaluateBadges(data: MonthlyData): Set<string> {
  const earned = new Set<string>();
  const { totalTokens, models } = data;

  // Token milestones
  if (totalTokens >= 1_000_000) earned.add("first-million");
  if (totalTokens >= 10_000_000) earned.add("ten-million");
  if (totalTokens >= 100_000_000) earned.add("hundred-million");
  if (totalTokens >= 1_000_000_000) earned.add("billion");

  // Cache champion
  const totalCacheRead = models.reduce((s, m) => s + m.cacheReadTokens, 0);
  const totalCacheCreation = models.reduce((s, m) => s + m.cacheCreationTokens, 0);
  const totalCacheTokens = totalCacheRead + totalCacheCreation;
  if (totalCacheTokens >= 100_000) {
    const hitRatio = computeCacheHitRatio(totalCacheRead, totalCacheCreation);
    if (hitRatio >= 0.75) earned.add("cache-champion");
  }

  // Savings badges
  const savings = computeCacheSavings(models);
  if (savings >= 10) earned.add("big-saver");
  if (savings >= 100) earned.add("mega-saver");

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
