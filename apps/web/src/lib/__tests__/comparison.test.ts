import { describe, it, expect } from "vitest";
import { computeDelta, computeRankChange, mergeMonthlyTimeSeries } from "../comparison";

describe("computeDelta", () => {
  it("returns up when current > previous", () => {
    const result = computeDelta(150, 100);
    expect(result.direction).toBe("up");
    expect(result.percent).toBe(50);
    expect(result.label).toBe("+50%");
  });

  it("returns down when current < previous", () => {
    const result = computeDelta(75, 100);
    expect(result.direction).toBe("down");
    expect(result.percent).toBe(-25);
    expect(result.label).toBe("-25%");
  });

  it("returns flat when both are zero", () => {
    const result = computeDelta(0, 0);
    expect(result.direction).toBe("flat");
    expect(result.percent).toBe(0);
  });

  it("returns +100% when previous is zero and current is positive", () => {
    const result = computeDelta(500, 0);
    expect(result.direction).toBe("up");
    expect(result.percent).toBe(100);
    expect(result.label).toBe("+100%");
  });

  it("returns flat when values are equal", () => {
    const result = computeDelta(100, 100);
    expect(result.direction).toBe("flat");
    expect(result.percent).toBe(0);
  });

  it("rounds to one decimal place", () => {
    const result = computeDelta(133, 100);
    expect(result.percent).toBe(33);
  });
});

describe("computeRankChange", () => {
  it("detects rank improvement", () => {
    const current = [
      { model: "opus", totalTokens: 1000 },
      { model: "sonnet", totalTokens: 500 },
    ];
    const previous = [
      { model: "sonnet", totalTokens: 1000 },
      { model: "opus", totalTokens: 500 },
    ];
    const result = computeRankChange(current, previous);
    expect(result.get("opus")!.change).toBe(1); // moved up from 2 to 1
    expect(result.get("sonnet")!.change).toBe(-1); // moved down from 1 to 2
  });

  it("marks new models with null change", () => {
    const current = [
      { model: "opus", totalTokens: 1000 },
      { model: "haiku", totalTokens: 500 },
    ];
    const previous = [{ model: "opus", totalTokens: 800 }];
    const result = computeRankChange(current, previous);
    expect(result.get("haiku")!.change).toBeNull();
    expect(result.get("haiku")!.previousRank).toBeNull();
  });

  it("returns empty map for empty inputs", () => {
    const result = computeRankChange([], []);
    expect(result.size).toBe(0);
  });

  it("returns zero change for identical rankings", () => {
    const models = [
      { model: "opus", totalTokens: 1000 },
      { model: "sonnet", totalTokens: 500 },
    ];
    const result = computeRankChange(models, models);
    expect(result.get("opus")!.change).toBe(0);
    expect(result.get("sonnet")!.change).toBe(0);
  });
});

describe("mergeMonthlyTimeSeries", () => {
  it("merges overlapping days", () => {
    const current = [{ day: 1, inputTokens: 100, outputTokens: 50, cacheCreationTokens: 0, cacheReadTokens: 0 }];
    const comparison = [{ day: 1, inputTokens: 200, outputTokens: 100, cacheCreationTokens: 0, cacheReadTokens: 0 }];
    const result = mergeMonthlyTimeSeries(current, comparison);
    expect(result).toHaveLength(1);
    expect(result[0]!.inputTokens).toBe(100);
    expect(result[0]!.cmp_inputTokens).toBe(200);
  });

  it("fills missing days with zeros", () => {
    const current = [{ day: 1, inputTokens: 100, outputTokens: 50, cacheCreationTokens: 0, cacheReadTokens: 0 }];
    const comparison = [{ day: 3, inputTokens: 200, outputTokens: 100, cacheCreationTokens: 0, cacheReadTokens: 0 }];
    const result = mergeMonthlyTimeSeries(current, comparison);
    expect(result).toHaveLength(2);
    expect(result[0]!.day).toBe(1);
    expect(result[0]!.cmp_inputTokens).toBe(0);
    expect(result[1]!.day).toBe(3);
    expect(result[1]!.inputTokens).toBe(0);
  });

  it("handles empty arrays", () => {
    expect(mergeMonthlyTimeSeries([], [])).toEqual([]);
  });

  it("sorts by day", () => {
    const current = [
      { day: 15, inputTokens: 100, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 },
      { day: 5, inputTokens: 50, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 },
    ];
    const result = mergeMonthlyTimeSeries(current, []);
    expect(result[0]!.day).toBe(5);
    expect(result[1]!.day).toBe(15);
  });
});
