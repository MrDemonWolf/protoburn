import { describe, it, expect } from "vitest";
import { calculateCost, MODEL_PRICING } from "../pricing";

describe("calculateCost", () => {
  it("calculates cost for haiku model", () => {
    const cost = calculateCost("claude-haiku-4-5-20250101", 1_000_000, 1_000_000);
    // haiku: $1/M input + $5/M output = $6
    expect(cost).toBeCloseTo(6.0);
  });

  it("calculates cost for sonnet model", () => {
    const cost = calculateCost("claude-sonnet-4-5-20250101", 1_000_000, 1_000_000);
    // sonnet: $3/M input + $15/M output = $18
    expect(cost).toBeCloseTo(18.0);
  });

  it("calculates cost for opus model", () => {
    const cost = calculateCost("claude-opus-4-6-20250101", 1_000_000, 1_000_000);
    // opus: $5/M input + $25/M output = $30
    expect(cost).toBeCloseTo(30.0);
  });

  it("defaults unknown models to sonnet pricing", () => {
    const cost = calculateCost("unknown-model", 1_000_000, 1_000_000);
    // sonnet rates: $3/M input + $15/M output = $18
    expect(cost).toBeCloseTo(18.0);
  });

  it("returns 0 for zero tokens", () => {
    expect(calculateCost("claude-haiku-4-5", 0, 0)).toBe(0);
  });

  it("calculates correctly for small token counts", () => {
    const cost = calculateCost("claude-haiku-4-5", 1000, 500);
    // 1000/1M * $1 + 500/1M * $5 = $0.001 + $0.0025 = $0.0035
    expect(cost).toBeCloseTo(0.0035);
  });

  it("includes cache write cost", () => {
    const cost = calculateCost("claude-sonnet-4-5-20250101", 0, 0, 1_000_000, 0);
    // sonnet cache write: $3.75/M
    expect(cost).toBeCloseTo(3.75);
  });

  it("includes cache read cost", () => {
    const cost = calculateCost("claude-sonnet-4-5-20250101", 0, 0, 0, 1_000_000);
    // sonnet cache read: $0.30/M
    expect(cost).toBeCloseTo(0.3);
  });

  it("calculates full cost with all token types", () => {
    const cost = calculateCost("claude-opus-4-6-20250101", 1_000_000, 1_000_000, 1_000_000, 1_000_000);
    // opus: $5 input + $25 output + $6.25 cache write + $0.50 cache read = $36.75
    expect(cost).toBeCloseTo(36.75);
  });

  it("defaults cache tokens to 0 for backward compat", () => {
    const withCache = calculateCost("claude-haiku-4-5", 1_000_000, 1_000_000, 0, 0);
    const withoutCache = calculateCost("claude-haiku-4-5", 1_000_000, 1_000_000);
    expect(withCache).toBe(withoutCache);
  });

  it("calculates cache pricing per model correctly", () => {
    // Haiku cache write: 1.25x of $1 = $1.25
    expect(calculateCost("claude-haiku-4-5", 0, 0, 1_000_000, 0)).toBeCloseTo(1.25);
    // Haiku cache read: 0.1x of $1 = $0.10
    expect(calculateCost("claude-haiku-4-5", 0, 0, 0, 1_000_000)).toBeCloseTo(0.1);

    // Opus cache write: 1.25x of $5 = $6.25
    expect(calculateCost("claude-opus-4-6", 0, 0, 1_000_000, 0)).toBeCloseTo(6.25);
    // Opus cache read: 0.1x of $5 = $0.50
    expect(calculateCost("claude-opus-4-6", 0, 0, 0, 1_000_000)).toBeCloseTo(0.5);
  });
});

describe("MODEL_PRICING", () => {
  it("exports pricing for haiku, sonnet, and opus", () => {
    expect(MODEL_PRICING).toHaveProperty("haiku-4-5");
    expect(MODEL_PRICING).toHaveProperty("sonnet-4-5");
    expect(MODEL_PRICING).toHaveProperty("opus-4-6");
  });

  it("includes cache pricing fields for all models", () => {
    for (const [, pricing] of Object.entries(MODEL_PRICING)) {
      expect(pricing).toHaveProperty("cacheWritePerMillion");
      expect(pricing).toHaveProperty("cacheReadPerMillion");
      expect(pricing.cacheWritePerMillion).toBeCloseTo(pricing.inputPerMillion * 1.25);
      expect(pricing.cacheReadPerMillion).toBeCloseTo(pricing.inputPerMillion * 0.1);
    }
  });
});
