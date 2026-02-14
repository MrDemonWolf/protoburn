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
});

describe("MODEL_PRICING", () => {
  it("exports pricing for haiku, sonnet, and opus", () => {
    expect(MODEL_PRICING).toHaveProperty("haiku-4-5");
    expect(MODEL_PRICING).toHaveProperty("sonnet-4-5");
    expect(MODEL_PRICING).toHaveProperty("opus-4-6");
  });
});
