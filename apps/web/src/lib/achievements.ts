import { getBurnTier } from "./burn-tiers";
import { computeCacheHitRatio, computeCacheSavings } from "./cache-analytics";

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  requirement: string;
}

export const BADGE_DEFINITIONS: Badge[] = [
  { id: "first-million", emoji: "\u{1F3AF}", name: "First Million", requirement: "Monthly total >= 1M tokens" },
  { id: "ten-million", emoji: "\u{1F48E}", name: "Ten Million Club", requirement: "Monthly total >= 10M tokens" },
  { id: "hundred-million", emoji: "\u{1F451}", name: "Hundred Million Club", requirement: "Monthly total >= 100M tokens" },
  { id: "cache-champion", emoji: "\u{1F3C6}", name: "Cache Champion", requirement: "Cache hit ratio >= 75% (min 100K cache tokens)" },
  { id: "big-saver", emoji: "\u{1F4B0}", name: "Big Saver", requirement: "Cache savings >= $10 this month" },
  { id: "model-explorer", emoji: "\u{1F52C}", name: "Model Explorer", requirement: "Used 3+ different models this month" },
  { id: "on-fire", emoji: "\u{1F525}", name: "On Fire", requirement: "Reached Burning tier+ (400M+ tokens)" },
  { id: "inferno-survivor", emoji: "\u26A0\uFE0F", name: "Inferno Survivor", requirement: "Reached Inferno tier+ (2B+ tokens)" },
];

interface ModelData {
  model: string;
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

  // Cache champion
  const totalCacheRead = models.reduce((s, m) => s + m.cacheReadTokens, 0);
  const totalCacheCreation = models.reduce((s, m) => s + m.cacheCreationTokens, 0);
  const totalCacheTokens = totalCacheRead + totalCacheCreation;
  if (totalCacheTokens >= 100_000) {
    const hitRatio = computeCacheHitRatio(totalCacheRead, totalCacheCreation);
    if (hitRatio >= 0.75) earned.add("cache-champion");
  }

  // Big saver
  const savings = computeCacheSavings(models);
  if (savings >= 10) earned.add("big-saver");

  // Model explorer
  if (models.length >= 3) earned.add("model-explorer");

  // Burn tier badges
  const tier = getBurnTier(totalTokens);
  const burningTiers = ["burning", "blazing", "inferno", "meltdown"];
  if (burningTiers.includes(tier.name)) earned.add("on-fire");

  const infernoTiers = ["inferno", "meltdown"];
  if (infernoTiers.includes(tier.name)) earned.add("inferno-survivor");

  return earned;
}

export function getEarnedCount(earned: Set<string>): number {
  return earned.size;
}
