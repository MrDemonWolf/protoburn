import { describe, it, expect } from "vitest";
import {
  mergeUsage,
  calculateCost,
  formatMinutes,
  getPricingTier,
  type UsageMap,
} from "../sync";

describe("mergeUsage", () => {
  it("merges non-overlapping data", () => {
    const statsCache: UsageMap = new Map([
      ["model-a", new Map([["2025-01-01", { input: 100, output: 200 }]])],
    ]);
    const sessions: UsageMap = new Map([
      ["model-b", new Map([["2025-01-02", { input: 300, output: 400 }]])],
    ]);

    const merged = mergeUsage(statsCache, sessions);
    expect(merged.get("model-a")?.get("2025-01-01")).toEqual({ input: 100, output: 200 });
    expect(merged.get("model-b")?.get("2025-01-02")).toEqual({ input: 300, output: 400 });
  });

  it("session data overwrites stats-cache for overlapping dates", () => {
    const statsCache: UsageMap = new Map([
      ["model-a", new Map([
        ["2025-01-01", { input: 100, output: 200 }],
        ["2025-01-02", { input: 50, output: 50 }],
      ])],
    ]);
    const sessions: UsageMap = new Map([
      ["model-a", new Map([["2025-01-01", { input: 999, output: 888 }]])],
    ]);

    const merged = mergeUsage(statsCache, sessions);
    // Session data replaces stats-cache for 2025-01-01
    expect(merged.get("model-a")?.get("2025-01-01")).toEqual({ input: 999, output: 888 });
    // Stats-cache entry for 2025-01-01 from other models would also be removed
    // (session covers that date entirely)
  });

  it("handles empty inputs", () => {
    const empty: UsageMap = new Map();
    expect(mergeUsage(empty, empty).size).toBe(0);
    expect(mergeUsage(new Map([["a", new Map()]]), empty).get("a")?.size).toBe(0);
  });

  it("removes stats-cache entries for dates covered by any session model", () => {
    const statsCache: UsageMap = new Map([
      ["model-a", new Map([
        ["2025-01-01", { input: 10, output: 20 }],
        ["2025-01-02", { input: 30, output: 40 }],
      ])],
    ]);
    const sessions: UsageMap = new Map([
      ["model-b", new Map([["2025-01-01", { input: 50, output: 60 }]])],
    ]);

    const merged = mergeUsage(statsCache, sessions);
    // model-a's 2025-01-01 is removed because sessions cover that date
    expect(merged.get("model-a")?.has("2025-01-01")).toBe(false);
    // model-a's 2025-01-02 is preserved
    expect(merged.get("model-a")?.get("2025-01-02")).toEqual({ input: 30, output: 40 });
    // model-b session data is added
    expect(merged.get("model-b")?.get("2025-01-01")).toEqual({ input: 50, output: 60 });
  });
});

describe("calculateCost", () => {
  it("calculates haiku cost", () => {
    const cost = calculateCost("claude-haiku-4-5", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(6.0);
  });

  it("calculates opus cost", () => {
    const cost = calculateCost("claude-opus-4-6", 2_000_000, 500_000);
    // 2M * $5/M + 0.5M * $25/M = $10 + $12.50 = $22.50
    expect(cost).toBeCloseTo(22.5);
  });

  it("defaults unknown to sonnet", () => {
    const cost = calculateCost("some-model", 1_000_000, 0);
    expect(cost).toBeCloseTo(3.0); // sonnet input rate
  });
});

describe("formatMinutes", () => {
  it("formats minutes under an hour", () => {
    expect(formatMinutes(30)).toBe("30m");
    expect(formatMinutes(1)).toBe("1m");
  });

  it("formats exact hours", () => {
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(120)).toBe("2h");
  });

  it("formats hours and minutes", () => {
    expect(formatMinutes(90)).toBe("1h 30m");
    expect(formatMinutes(150)).toBe("2h 30m");
  });
});

describe("getPricingTier", () => {
  it("returns haiku pricing for haiku models", () => {
    const tier = getPricingTier("claude-haiku-4-5-20250101");
    expect(tier.inputPerMillion).toBe(1.0);
    expect(tier.outputPerMillion).toBe(5.0);
  });

  it("returns sonnet pricing for sonnet models", () => {
    const tier = getPricingTier("claude-sonnet-4-5-20250101");
    expect(tier.inputPerMillion).toBe(3.0);
    expect(tier.outputPerMillion).toBe(15.0);
  });

  it("returns opus pricing for opus models", () => {
    const tier = getPricingTier("claude-opus-4-6-20250101");
    expect(tier.inputPerMillion).toBe(5.0);
    expect(tier.outputPerMillion).toBe(25.0);
  });

  it("returns sonnet (default) for unknown models", () => {
    const tier = getPricingTier("gpt-4o");
    expect(tier.inputPerMillion).toBe(3.0);
    expect(tier.outputPerMillion).toBe(15.0);
  });
});
