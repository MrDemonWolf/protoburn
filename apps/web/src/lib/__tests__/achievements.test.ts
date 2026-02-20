import { describe, it, expect } from "vitest";
import {
  BADGE_DEFINITIONS,
  evaluateBadges,
  getEarnedCount,
  computeMaxStreak,
} from "../achievements";

function makeModels(
  overrides: Array<{
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    cacheCreationTokens?: number;
    cacheReadTokens?: number;
  }> = [],
) {
  return overrides.map((o) => ({
    model: o.model ?? "claude-sonnet-4-5-20250514",
    inputTokens: o.inputTokens ?? 0,
    outputTokens: o.outputTokens ?? 0,
    cacheCreationTokens: o.cacheCreationTokens ?? 0,
    cacheReadTokens: o.cacheReadTokens ?? 0,
  }));
}

describe("evaluateBadges", () => {
  it("returns empty set for zero tokens", () => {
    const earned = evaluateBadges({ totalTokens: 0, models: [] });
    expect(earned.size).toBe(0);
  });

  // Token milestones
  it("earns first-million at 1M tokens", () => {
    const earned = evaluateBadges({
      totalTokens: 1_000_000,
      models: makeModels([{}]),
    });
    expect(earned.has("first-million")).toBe(true);
    expect(earned.has("ten-million")).toBe(false);
  });

  it("earns ten-million at 10M tokens", () => {
    const earned = evaluateBadges({
      totalTokens: 10_000_000,
      models: makeModels([{}]),
    });
    expect(earned.has("first-million")).toBe(true);
    expect(earned.has("ten-million")).toBe(true);
    expect(earned.has("hundred-million")).toBe(false);
  });

  it("earns hundred-million at 100M tokens", () => {
    const earned = evaluateBadges({
      totalTokens: 100_000_000,
      models: makeModels([{}]),
    });
    expect(earned.has("hundred-million")).toBe(true);
    expect(earned.has("billion")).toBe(false);
  });

  it("earns billion at 1B tokens", () => {
    const earned = evaluateBadges({
      totalTokens: 1_000_000_000,
      models: makeModels([{}]),
    });
    expect(earned.has("billion")).toBe(true);
  });

  // Cache badges
  it("earns cache-champion with 75%+ hit ratio and 100K+ cache tokens", () => {
    const earned = evaluateBadges({
      totalTokens: 1_000_000,
      models: makeModels([
        { cacheReadTokens: 80_000, cacheCreationTokens: 20_000 },
      ]),
    });
    expect(earned.has("cache-champion")).toBe(true);
  });

  it("does not earn cache-champion below 100K cache tokens", () => {
    const earned = evaluateBadges({
      totalTokens: 1_000_000,
      models: makeModels([
        { cacheReadTokens: 75, cacheCreationTokens: 25 },
      ]),
    });
    expect(earned.has("cache-champion")).toBe(false);
  });

  it("does not earn cache-champion below 75% hit ratio", () => {
    const earned = evaluateBadges({
      totalTokens: 1_000_000,
      models: makeModels([
        { cacheReadTokens: 50_000, cacheCreationTokens: 50_000 },
      ]),
    });
    expect(earned.has("cache-champion")).toBe(false);
  });

  it("earns big-saver when cache savings >= $10", () => {
    const earned = evaluateBadges({
      totalTokens: 10_000_000,
      models: makeModels([
        {
          model: "claude-sonnet-4-5-20250514",
          cacheReadTokens: 4_000_000,
          cacheCreationTokens: 100_000,
        },
      ]),
    });
    expect(earned.has("big-saver")).toBe(true);
    expect(earned.has("mega-saver")).toBe(false);
  });

  it("earns mega-saver when cache savings >= $100", () => {
    const earned = evaluateBadges({
      totalTokens: 50_000_000,
      models: makeModels([
        {
          model: "claude-sonnet-4-5-20250514",
          cacheReadTokens: 40_000_000,
          cacheCreationTokens: 100_000,
        },
      ]),
    });
    expect(earned.has("mega-saver")).toBe(true);
    expect(earned.has("big-saver")).toBe(true);
  });

  it("does not earn big-saver with insufficient savings", () => {
    const earned = evaluateBadges({
      totalTokens: 1_000_000,
      models: makeModels([
        { cacheReadTokens: 100_000, cacheCreationTokens: 100_000 },
      ]),
    });
    expect(earned.has("big-saver")).toBe(false);
  });

  // Model explorer
  it("earns model-explorer with 3+ models", () => {
    const earned = evaluateBadges({
      totalTokens: 1_000_000,
      models: makeModels([
        { model: "claude-sonnet-4-5-20250514" },
        { model: "claude-haiku-3-5-20241022" },
        { model: "claude-opus-4-6-20250610" },
      ]),
    });
    expect(earned.has("model-explorer")).toBe(true);
  });

  it("does not earn model-explorer with fewer than 3 models", () => {
    const earned = evaluateBadges({
      totalTokens: 1_000_000,
      models: makeModels([
        { model: "claude-sonnet-4-5-20250514" },
        { model: "claude-haiku-3-5-20241022" },
      ]),
    });
    expect(earned.has("model-explorer")).toBe(false);
  });

  // Spending milestones (plan tiers)
  it("earns pro-burner at $20+ estimated cost", () => {
    // Sonnet output: $15/M → need ~1.34M output tokens for $20
    const earned = evaluateBadges({
      totalTokens: 2_000_000,
      models: makeModels([
        { model: "claude-sonnet-4-5-20250514", outputTokens: 1_500_000 },
      ]),
    });
    expect(earned.has("pro-burner")).toBe(true);
    expect(earned.has("max-burner")).toBe(false);
  });

  it("earns max-burner at $100+ estimated cost", () => {
    // Sonnet output: $15/M → need ~6.67M output tokens for $100
    const earned = evaluateBadges({
      totalTokens: 10_000_000,
      models: makeModels([
        { model: "claude-sonnet-4-5-20250514", outputTokens: 7_000_000 },
      ]),
    });
    expect(earned.has("max-burner")).toBe(true);
    expect(earned.has("pro-burner")).toBe(true);
    expect(earned.has("ultra-burner")).toBe(false);
  });

  it("earns ultra-burner at $200+ estimated cost", () => {
    // Sonnet output: $15/M → need ~13.3M output tokens for $200
    const earned = evaluateBadges({
      totalTokens: 15_000_000,
      models: makeModels([
        { model: "claude-sonnet-4-5-20250514", outputTokens: 14_000_000 },
      ]),
    });
    expect(earned.has("ultra-burner")).toBe(true);
    expect(earned.has("max-burner")).toBe(true);
    expect(earned.has("pro-burner")).toBe(true);
  });

  // Burn tier progression
  it("earns spark-starter at 5M+ tokens", () => {
    const earned = evaluateBadges({
      totalTokens: 5_000_000,
      models: makeModels([{}]),
    });
    expect(earned.has("spark-starter")).toBe(true);
    expect(earned.has("on-fire")).toBe(false);
  });

  it("earns on-fire at 400M+ tokens (burning tier)", () => {
    const earned = evaluateBadges({
      totalTokens: 400_000_000,
      models: makeModels([{}]),
    });
    expect(earned.has("on-fire")).toBe(true);
    expect(earned.has("blazing-glory")).toBe(false);
  });

  it("earns blazing-glory at 1B+ tokens", () => {
    const earned = evaluateBadges({
      totalTokens: 1_000_000_000,
      models: makeModels([{}]),
    });
    expect(earned.has("blazing-glory")).toBe(true);
    expect(earned.has("on-fire")).toBe(true);
    expect(earned.has("inferno-survivor")).toBe(false);
  });

  it("earns inferno-survivor at 2B+ tokens", () => {
    const earned = evaluateBadges({
      totalTokens: 2_000_000_000,
      models: makeModels([{}]),
    });
    expect(earned.has("inferno-survivor")).toBe(true);
    expect(earned.has("on-fire")).toBe(true);
    expect(earned.has("meltdown")).toBe(false);
  });

  it("earns meltdown at 3B+ tokens", () => {
    const earned = evaluateBadges({
      totalTokens: 3_000_000_000,
      models: makeModels([{}]),
    });
    expect(earned.has("meltdown")).toBe(true);
    expect(earned.has("inferno-survivor")).toBe(true);
    expect(earned.has("beyond-meltdown")).toBe(false);
  });

  it("earns beyond-meltdown at 5B+ tokens", () => {
    const earned = evaluateBadges({
      totalTokens: 5_000_000_000,
      models: makeModels([{}]),
    });
    expect(earned.has("beyond-meltdown")).toBe(true);
    expect(earned.has("meltdown")).toBe(true);
  });

  it("does not earn beyond-meltdown below 5B", () => {
    const earned = evaluateBadges({
      totalTokens: 4_500_000_000,
      models: makeModels([{}]),
    });
    expect(earned.has("meltdown")).toBe(true);
    expect(earned.has("beyond-meltdown")).toBe(false);
  });

  // Cost milestones (new)
  it("earns whale-burner at $500+ estimated cost", () => {
    // Sonnet output: $15/M → need ~33.3M output tokens for $500
    const earned = evaluateBadges({
      totalTokens: 35_000_000,
      models: makeModels([
        { model: "claude-sonnet-4-5-20250514", outputTokens: 34_000_000 },
      ]),
    });
    expect(earned.has("whale-burner")).toBe(true);
    expect(earned.has("legendary-burner")).toBe(false);
  });

  it("earns legendary-burner at $1000+ estimated cost", () => {
    // Sonnet output: $15/M → need ~66.7M output tokens for $1000
    const earned = evaluateBadges({
      totalTokens: 70_000_000,
      models: makeModels([
        { model: "claude-sonnet-4-5-20250514", outputTokens: 68_000_000 },
      ]),
    });
    expect(earned.has("legendary-burner")).toBe(true);
    expect(earned.has("whale-burner")).toBe(true);
    expect(earned.has("galaxy-burner")).toBe(false);
  });

  it("earns galaxy-burner at $2000+ estimated cost", () => {
    // Sonnet output: $15/M → need ~133.3M output tokens for $2000
    const earned = evaluateBadges({
      totalTokens: 140_000_000,
      models: makeModels([
        { model: "claude-sonnet-4-5-20250514", outputTokens: 135_000_000 },
      ]),
    });
    expect(earned.has("galaxy-burner")).toBe(true);
    expect(earned.has("legendary-burner")).toBe(true);
  });

  // Output & ratio badges
  it("earns chatterbox when output > input", () => {
    const earned = evaluateBadges({
      totalTokens: 2_000_000,
      models: makeModels([
        { inputTokens: 400_000, outputTokens: 600_000 },
      ]),
    });
    expect(earned.has("chatterbox")).toBe(true);
  });

  it("does not earn chatterbox when output <= input", () => {
    const earned = evaluateBadges({
      totalTokens: 2_000_000,
      models: makeModels([
        { inputTokens: 600_000, outputTokens: 400_000 },
      ]),
    });
    expect(earned.has("chatterbox")).toBe(false);
  });

  it("earns verbose-king with 1M+ output tokens", () => {
    const earned = evaluateBadges({
      totalTokens: 2_000_000,
      models: makeModels([
        { outputTokens: 1_000_000 },
      ]),
    });
    expect(earned.has("verbose-king")).toBe(true);
  });

  it("does not earn verbose-king below 1M output", () => {
    const earned = evaluateBadges({
      totalTokens: 1_000_000,
      models: makeModels([
        { outputTokens: 999_999 },
      ]),
    });
    expect(earned.has("verbose-king")).toBe(false);
  });

  it("earns listener when input >= 10x output", () => {
    const earned = evaluateBadges({
      totalTokens: 11_000_000,
      models: makeModels([
        { inputTokens: 10_000_000, outputTokens: 1_000_000 },
      ]),
    });
    expect(earned.has("listener")).toBe(true);
  });

  it("does not earn listener when input < 10x output", () => {
    const earned = evaluateBadges({
      totalTokens: 10_000_000,
      models: makeModels([
        { inputTokens: 9_000_000, outputTokens: 1_000_000 },
      ]),
    });
    expect(earned.has("listener")).toBe(false);
  });

  it("earns balanced when output is 40-60% of input+output with 1M+ total", () => {
    const earned = evaluateBadges({
      totalTokens: 2_000_000,
      models: makeModels([
        { inputTokens: 600_000, outputTokens: 500_000 },
      ]),
    });
    // 500k / (600k+500k) = 45.5% → balanced
    expect(earned.has("balanced")).toBe(true);
  });

  it("does not earn balanced when ratio outside 40-60%", () => {
    const earned = evaluateBadges({
      totalTokens: 2_000_000,
      models: makeModels([
        { inputTokens: 900_000, outputTokens: 100_000 },
      ]),
    });
    // 100k / (900k+100k) = 10% → not balanced
    expect(earned.has("balanced")).toBe(false);
  });

  it("does not earn balanced below 1M total input+output", () => {
    const earned = evaluateBadges({
      totalTokens: 500_000,
      models: makeModels([
        { inputTokens: 300_000, outputTokens: 200_000 },
      ]),
    });
    // 200k / 500k = 40%, but total < 1M
    expect(earned.has("balanced")).toBe(false);
  });

  // Streak badges
  it("earns three-day-streak with 3 consecutive days", () => {
    const earned = evaluateBadges({
      totalTokens: 1_000_000,
      models: makeModels([{}]),
      timeSeries: [
        { date: "2026-01-01", inputTokens: 100, outputTokens: 100 },
        { date: "2026-01-02", inputTokens: 100, outputTokens: 100 },
        { date: "2026-01-03", inputTokens: 100, outputTokens: 100 },
      ],
    });
    expect(earned.has("three-day-streak")).toBe(true);
    expect(earned.has("week-streak")).toBe(false);
  });

  it("earns week-streak with 7 consecutive days", () => {
    const timeSeries = Array.from({ length: 7 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      inputTokens: 100,
      outputTokens: 100,
    }));
    const earned = evaluateBadges({
      totalTokens: 1_000_000,
      models: makeModels([{}]),
      timeSeries,
    });
    expect(earned.has("week-streak")).toBe(true);
    expect(earned.has("two-week-streak")).toBe(false);
  });

  it("earns two-week-streak with 14 consecutive days", () => {
    const timeSeries = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      inputTokens: 100,
      outputTokens: 100,
    }));
    const earned = evaluateBadges({
      totalTokens: 1_000_000,
      models: makeModels([{}]),
      timeSeries,
    });
    expect(earned.has("two-week-streak")).toBe(true);
    expect(earned.has("monthly-streak")).toBe(false);
  });

  it("earns monthly-streak with 30 consecutive days", () => {
    const timeSeries = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(2026, 0, i + 1);
      return {
        date: d.toISOString().slice(0, 10),
        inputTokens: 100,
        outputTokens: 100,
      };
    });
    const earned = evaluateBadges({
      totalTokens: 1_000_000,
      models: makeModels([{}]),
      timeSeries,
    });
    expect(earned.has("monthly-streak")).toBe(true);
  });

  it("does not earn streak badges with gaps", () => {
    const earned = evaluateBadges({
      totalTokens: 1_000_000,
      models: makeModels([{}]),
      timeSeries: [
        { date: "2026-01-01", inputTokens: 100, outputTokens: 100 },
        { date: "2026-01-02", inputTokens: 100, outputTokens: 100 },
        // gap on Jan 3
        { date: "2026-01-04", inputTokens: 100, outputTokens: 100 },
        { date: "2026-01-05", inputTokens: 100, outputTokens: 100 },
      ],
    });
    expect(earned.has("three-day-streak")).toBe(false);
  });

  it("does not earn streak badges without timeSeries", () => {
    const earned = evaluateBadges({
      totalTokens: 1_000_000,
      models: makeModels([{}]),
    });
    expect(earned.has("three-day-streak")).toBe(false);
  });

  // Cache mastery badges
  it("earns cache-wizard with 90%+ hit ratio and 1M+ cache tokens", () => {
    const earned = evaluateBadges({
      totalTokens: 2_000_000,
      models: makeModels([
        { cacheReadTokens: 950_000, cacheCreationTokens: 50_000 },
      ]),
    });
    expect(earned.has("cache-wizard")).toBe(true);
  });

  it("does not earn cache-wizard below 1M cache tokens", () => {
    const earned = evaluateBadges({
      totalTokens: 1_000_000,
      models: makeModels([
        { cacheReadTokens: 900, cacheCreationTokens: 100 },
      ]),
    });
    expect(earned.has("cache-wizard")).toBe(false);
  });

  it("does not earn cache-wizard below 90% hit ratio", () => {
    const earned = evaluateBadges({
      totalTokens: 2_000_000,
      models: makeModels([
        { cacheReadTokens: 800_000, cacheCreationTokens: 200_000 },
      ]),
    });
    expect(earned.has("cache-wizard")).toBe(false);
  });

  it("earns giga-saver when cache savings >= $1000", () => {
    const earned = evaluateBadges({
      totalTokens: 500_000_000,
      models: makeModels([
        {
          model: "claude-sonnet-4-5-20250514",
          cacheReadTokens: 400_000_000,
          cacheCreationTokens: 1_000_000,
        },
      ]),
    });
    expect(earned.has("giga-saver")).toBe(true);
    expect(earned.has("mega-saver")).toBe(true);
  });
});

describe("computeMaxStreak", () => {
  it("returns 0 for empty data", () => {
    expect(computeMaxStreak([])).toBe(0);
  });

  it("returns 1 for a single day with usage", () => {
    expect(
      computeMaxStreak([
        { date: "2026-01-01", inputTokens: 100, outputTokens: 50 },
      ]),
    ).toBe(1);
  });

  it("counts consecutive days correctly", () => {
    expect(
      computeMaxStreak([
        { date: "2026-01-01", inputTokens: 100, outputTokens: 50 },
        { date: "2026-01-02", inputTokens: 100, outputTokens: 50 },
        { date: "2026-01-03", inputTokens: 100, outputTokens: 50 },
      ]),
    ).toBe(3);
  });

  it("resets streak on gaps", () => {
    expect(
      computeMaxStreak([
        { date: "2026-01-01", inputTokens: 100, outputTokens: 50 },
        { date: "2026-01-02", inputTokens: 100, outputTokens: 50 },
        { date: "2026-01-04", inputTokens: 100, outputTokens: 50 },
        { date: "2026-01-05", inputTokens: 100, outputTokens: 50 },
      ]),
    ).toBe(2);
  });

  it("skips days with zero tokens", () => {
    expect(
      computeMaxStreak([
        { date: "2026-01-01", inputTokens: 100, outputTokens: 50 },
        { date: "2026-01-02", inputTokens: 0, outputTokens: 0 },
        { date: "2026-01-03", inputTokens: 100, outputTokens: 50 },
      ]),
    ).toBe(1);
  });

  it("handles unsorted input", () => {
    expect(
      computeMaxStreak([
        { date: "2026-01-03", inputTokens: 100, outputTokens: 50 },
        { date: "2026-01-01", inputTokens: 100, outputTokens: 50 },
        { date: "2026-01-02", inputTokens: 100, outputTokens: 50 },
      ]),
    ).toBe(3);
  });

  it("returns max streak when there are multiple streaks", () => {
    expect(
      computeMaxStreak([
        { date: "2026-01-01", inputTokens: 100, outputTokens: 50 },
        { date: "2026-01-02", inputTokens: 100, outputTokens: 50 },
        { date: "2026-01-05", inputTokens: 100, outputTokens: 50 },
        { date: "2026-01-06", inputTokens: 100, outputTokens: 50 },
        { date: "2026-01-07", inputTokens: 100, outputTokens: 50 },
        { date: "2026-01-08", inputTokens: 100, outputTokens: 50 },
      ]),
    ).toBe(4);
  });
});

describe("getEarnedCount", () => {
  it("returns count of earned badges", () => {
    const earned = new Set(["first-million", "cache-champion"]);
    expect(getEarnedCount(earned)).toBe(2);
  });

  it("returns 0 for empty set", () => {
    expect(getEarnedCount(new Set())).toBe(0);
  });
});

describe("BADGE_DEFINITIONS", () => {
  it("has 30 badges", () => {
    expect(BADGE_DEFINITIONS).toHaveLength(30);
  });

  it("all badges have unique ids", () => {
    const ids = BADGE_DEFINITIONS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
