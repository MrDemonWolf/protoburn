import { describe, it, expect } from "vitest";
import {
  BADGE_DEFINITIONS,
  evaluateBadges,
  getEarnedCount,
} from "../achievements";

function makeModels(
  overrides: Array<{
    model?: string;
    cacheCreationTokens?: number;
    cacheReadTokens?: number;
  }> = [],
) {
  return overrides.map((o) => ({
    model: o.model ?? "claude-sonnet-4-5-20250514",
    cacheCreationTokens: o.cacheCreationTokens ?? 0,
    cacheReadTokens: o.cacheReadTokens ?? 0,
  }));
}

describe("evaluateBadges", () => {
  it("returns empty set for zero tokens", () => {
    const earned = evaluateBadges({ totalTokens: 0, models: [] });
    expect(earned.size).toBe(0);
  });

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
  });

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
    // Sonnet cache read: $0.30/M, input: $3/M → savings = $2.70/M
    // Need $10 savings → ~3.7M cache read tokens
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

  it("earns on-fire at 400M+ tokens (burning tier)", () => {
    const earned = evaluateBadges({
      totalTokens: 400_000_000,
      models: makeModels([{}]),
    });
    expect(earned.has("on-fire")).toBe(true);
  });

  it("does not earn on-fire below burning tier", () => {
    const earned = evaluateBadges({
      totalTokens: 200_000_000,
      models: makeModels([{}]),
    });
    expect(earned.has("on-fire")).toBe(false);
  });

  it("earns inferno-survivor at 2B+ tokens", () => {
    const earned = evaluateBadges({
      totalTokens: 2_000_000_000,
      models: makeModels([{}]),
    });
    expect(earned.has("inferno-survivor")).toBe(true);
    expect(earned.has("on-fire")).toBe(true);
  });

  it("does not earn inferno-survivor below inferno tier", () => {
    const earned = evaluateBadges({
      totalTokens: 1_500_000_000,
      models: makeModels([{}]),
    });
    expect(earned.has("inferno-survivor")).toBe(false);
    expect(earned.has("on-fire")).toBe(true);
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
  it("has 8 badges", () => {
    expect(BADGE_DEFINITIONS).toHaveLength(8);
  });

  it("all badges have unique ids", () => {
    const ids = BADGE_DEFINITIONS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
