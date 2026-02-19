import { describe, it, expect } from "vitest";
import {
  computeCacheHitRatio,
  computeCacheSavings,
  computeDailyHitRatios,
  computeTrend,
  generateTip,
  computeCacheAnalytics,
} from "../cache-analytics";

describe("computeCacheHitRatio", () => {
  it("returns 0 when no cache tokens", () => {
    expect(computeCacheHitRatio(0, 0)).toBe(0);
  });

  it("returns 1 when all reads, no writes", () => {
    expect(computeCacheHitRatio(1000, 0)).toBe(1);
  });

  it("returns 0 when all writes, no reads", () => {
    expect(computeCacheHitRatio(0, 1000)).toBe(0);
  });

  it("calculates ratio correctly", () => {
    // 800 reads / (800 reads + 200 writes) = 0.8
    expect(computeCacheHitRatio(800, 200)).toBeCloseTo(0.8);
  });
});

describe("computeCacheSavings", () => {
  it("returns 0 for empty models", () => {
    expect(computeCacheSavings([])).toBe(0);
  });

  it("calculates savings for sonnet cache reads", () => {
    const models = [
      { model: "claude-sonnet-4-5-20250101", cacheCreationTokens: 0, cacheReadTokens: 1_000_000 },
    ];
    // Sonnet: input $3/M, cache read $0.30/M → savings = 1M/1M × ($3 - $0.30) = $2.70
    expect(computeCacheSavings(models)).toBeCloseTo(2.7);
  });

  it("calculates savings across multiple models", () => {
    const models = [
      { model: "claude-sonnet-4-5-20250101", cacheCreationTokens: 0, cacheReadTokens: 1_000_000 },
      { model: "claude-opus-4-6-20250101", cacheCreationTokens: 0, cacheReadTokens: 1_000_000 },
    ];
    // Sonnet: $2.70 + Opus: ($5 - $0.50) = $4.50 → total $7.20
    expect(computeCacheSavings(models)).toBeCloseTo(7.2);
  });

  it("returns 0 when no cache reads", () => {
    const models = [
      { model: "claude-sonnet-4-5-20250101", cacheCreationTokens: 500_000, cacheReadTokens: 0 },
    ];
    expect(computeCacheSavings(models)).toBe(0);
  });
});

describe("computeDailyHitRatios", () => {
  it("returns empty array for no days", () => {
    expect(computeDailyHitRatios([])).toEqual([]);
  });

  it("computes ratio per day", () => {
    const days = [
      { date: "2026-02-01", cacheCreationTokens: 200, cacheReadTokens: 800 },
      { date: "2026-02-02", cacheCreationTokens: 500, cacheReadTokens: 500 },
    ];
    const ratios = computeDailyHitRatios(days);
    expect(ratios[0]).toBeCloseTo(0.8);
    expect(ratios[1]).toBeCloseTo(0.5);
  });

  it("returns 0 for days with no cache tokens", () => {
    const days = [
      { date: "2026-02-01", cacheCreationTokens: 0, cacheReadTokens: 0 },
    ];
    expect(computeDailyHitRatios(days)).toEqual([0]);
  });
});

describe("computeTrend", () => {
  it("returns flat for less than 2 data points", () => {
    expect(computeTrend([])).toBe("flat");
    expect(computeTrend([0.5])).toBe("flat");
  });

  it("returns flat when no prior period data", () => {
    // Only 7 days → recent = all 7, prior = empty slice
    expect(computeTrend([0.5, 0.6, 0.7, 0.8, 0.9, 0.8, 0.7])).toBe("flat");
  });

  it("returns up when recent avg > prior avg by >5%", () => {
    // 14 days: prior 7 at 0.3, recent 7 at 0.5
    const ratios = [
      0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3,
      0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
    ];
    expect(computeTrend(ratios)).toBe("up");
  });

  it("returns down when recent avg < prior avg by >5%", () => {
    const ratios = [
      0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8,
      0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
    ];
    expect(computeTrend(ratios)).toBe("down");
  });

  it("returns flat when difference is within 5% threshold", () => {
    const ratios = [
      0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
      0.52, 0.52, 0.52, 0.52, 0.52, 0.52, 0.52,
    ];
    expect(computeTrend(ratios)).toBe("flat");
  });
});

describe("generateTip", () => {
  it("warns about low cache reuse on a model", () => {
    const models = [
      { model: "claude-sonnet-4-5-20250101", cacheCreationTokens: 500_000, cacheReadTokens: 100_000 },
    ];
    const tip = generateTip(models, 0.5, 0.17, "flat");
    expect(tip).toContain("sonnet-4-5");
    expect(tip).toContain("low cache reuse");
  });

  it("shows savings tip when savings > $1", () => {
    const models = [
      { model: "claude-sonnet-4-5-20250101", cacheCreationTokens: 100_000, cacheReadTokens: 900_000 },
    ];
    const tip = generateTip(models, 5.0, 0.9, "flat");
    expect(tip).toContain("Cache saved you $5.00");
  });

  it("shows improving tip when trend is up", () => {
    const tip = generateTip([], 0.5, 0.85, "up");
    expect(tip).toContain("improving");
    expect(tip).toContain("85.0%");
  });

  it("falls back to default tip", () => {
    const tip = generateTip([], 0, 0, "flat");
    expect(tip).toBe("Cache reads are 90% cheaper than regular input");
  });
});

describe("computeCacheAnalytics", () => {
  it("reports no cache data when all zeros", () => {
    const result = computeCacheAnalytics(
      [{ model: "claude-sonnet-4-5", cacheCreationTokens: 0, cacheReadTokens: 0 }],
      [],
    );
    expect(result.hasCacheData).toBe(false);
    expect(result.hitRatio).toBe(0);
    expect(result.savings).toBe(0);
  });

  it("computes full analytics", () => {
    const models = [
      { model: "claude-sonnet-4-5-20250101", cacheCreationTokens: 200_000, cacheReadTokens: 800_000 },
    ];
    const timeSeries = [
      { date: "2026-02-01", cacheCreationTokens: 100, cacheReadTokens: 400 },
      { date: "2026-02-02", cacheCreationTokens: 100, cacheReadTokens: 400 },
    ];
    const result = computeCacheAnalytics(models, timeSeries);
    expect(result.hasCacheData).toBe(true);
    expect(result.hitRatio).toBeCloseTo(0.8);
    expect(result.savings).toBeGreaterThan(0);
    expect(result.dailyRatios).toHaveLength(2);
    expect(result.trend).toBe("flat");
    expect(result.tip).toBeTruthy();
  });
});
