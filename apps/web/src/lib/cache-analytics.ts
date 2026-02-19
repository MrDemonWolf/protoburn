import { getTier } from "./pricing";
import { cleanModelName } from "./format";

interface ModelData {
  model: string;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

interface TimeSeriesDay {
  date: string;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

export function computeCacheHitRatio(
  cacheRead: number,
  cacheCreation: number,
): number {
  const total = cacheRead + cacheCreation;
  if (total === 0) return 0;
  return cacheRead / total;
}

export function computeCacheSavings(models: ModelData[]): number {
  let savings = 0;
  for (const m of models) {
    const tier = getTier(m.model);
    savings +=
      (m.cacheReadTokens / 1_000_000) *
      (tier.inputPerMillion - tier.cacheReadPerMillion);
  }
  return savings;
}

export function computeDailyHitRatios(days: TimeSeriesDay[]): number[] {
  return days.map((d) =>
    computeCacheHitRatio(d.cacheReadTokens, d.cacheCreationTokens),
  );
}

export function computeTrend(
  dailyRatios: number[],
): "up" | "down" | "flat" {
  if (dailyRatios.length < 2) return "flat";

  const recentDays = dailyRatios.slice(-7);
  const priorDays = dailyRatios.slice(-14, -7);

  if (priorDays.length === 0) return "flat";

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const recentAvg = avg(recentDays);
  const priorAvg = avg(priorDays);
  const diff = recentAvg - priorAvg;

  if (diff > 0.05) return "up";
  if (diff < -0.05) return "down";
  return "flat";
}

export function generateTip(
  models: ModelData[],
  savings: number,
  hitRatio: number,
  trend: "up" | "down" | "flat",
): string {
  // 1. Model with low hit ratio + significant writes
  for (const m of models) {
    const total = m.cacheReadTokens + m.cacheCreationTokens;
    if (total > 0) {
      const modelRatio = computeCacheHitRatio(
        m.cacheReadTokens,
        m.cacheCreationTokens,
      );
      if (modelRatio < 0.3 && m.cacheCreationTokens > 100_000) {
        return `${cleanModelName(m.model)} has low cache reuse — consider longer conversations`;
      }
    }
  }

  // 2. Savings > $1
  if (savings > 1) {
    return `Cache saved you $${savings.toFixed(2)} this month`;
  }

  // 3. Trend is up
  if (trend === "up") {
    return `Cache efficiency improving — ${(hitRatio * 100).toFixed(1)}% hit rate`;
  }

  // 4. Default
  return "Cache reads are 90% cheaper than regular input";
}

export interface CacheAnalytics {
  hitRatio: number;
  savings: number;
  dailyRatios: number[];
  trend: "up" | "down" | "flat";
  tip: string;
  hasCacheData: boolean;
}

export function computeCacheAnalytics(
  models: ModelData[],
  timeSeries: TimeSeriesDay[],
): CacheAnalytics {
  const totalRead = models.reduce((s, m) => s + m.cacheReadTokens, 0);
  const totalCreation = models.reduce((s, m) => s + m.cacheCreationTokens, 0);
  const hasCacheData = totalRead + totalCreation > 0;

  const hitRatio = computeCacheHitRatio(totalRead, totalCreation);
  const savings = computeCacheSavings(models);
  const dailyRatios = computeDailyHitRatios(timeSeries);
  const trend = computeTrend(dailyRatios);
  const tip = generateTip(models, savings, hitRatio, trend);

  return { hitRatio, savings, dailyRatios, trend, tip, hasCacheData };
}
