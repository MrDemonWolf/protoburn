import { describe, it, expect } from "vitest";
import { calculateVelocity } from "../velocity";
import type { DailyPoint } from "../velocity";

function makeDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 12, 0, 0);
}

function makeDailyPoints(values: [string, number][]): DailyPoint[] {
  return values.map(([date, totalTokens]) => ({ date, totalTokens }));
}

describe("calculateVelocity", () => {
  it("returns hasEnoughData=false with empty data", () => {
    const result = calculateVelocity([], 0, makeDate(2026, 2, 15));
    expect(result.hasEnoughData).toBe(false);
    expect(result.tokensPerDay).toBe(0);
    expect(result.tokensPerHour).toBe(0);
    expect(result.sparkData).toEqual([]);
  });

  it("returns hasEnoughData=false with single day of data", () => {
    const points = makeDailyPoints([["2026-02-15", 1000000]]);
    const result = calculateVelocity(points, 1000000, makeDate(2026, 2, 15));
    expect(result.hasEnoughData).toBe(false);
    expect(result.sparkData).toEqual([1000000]);
  });

  it("returns hasEnoughData=false when only one non-zero day", () => {
    const points = makeDailyPoints([
      ["2026-02-14", 0],
      ["2026-02-15", 1000000],
    ]);
    const result = calculateVelocity(points, 1000000, makeDate(2026, 2, 15));
    expect(result.hasEnoughData).toBe(false);
  });

  it("calculates remaining days correctly", () => {
    // Feb 15 at noon, Feb has 28 days in 2026
    const result = calculateVelocity([], 0, makeDate(2026, 2, 15));
    // remaining = 28 - 15 + (24-12)/24 = 13 + 0.5 = 13.5
    expect(result.remainingDays).toBe(13.5);
  });

  it("calculates velocity with uniform daily data", () => {
    const points = makeDailyPoints([
      ["2026-02-10", 1000000],
      ["2026-02-11", 1000000],
      ["2026-02-12", 1000000],
      ["2026-02-13", 1000000],
      ["2026-02-14", 1000000],
    ]);
    const result = calculateVelocity(points, 5000000, makeDate(2026, 2, 15));

    expect(result.hasEnoughData).toBe(true);
    // Uniform data: weighted avg should equal the uniform value
    expect(result.tokensPerDay).toBe(1000000);
    expect(result.tokensPerHour).toBeCloseTo(1000000 / 24);
  });

  it("returns sparkData as last 7 days in chronological order", () => {
    const points = makeDailyPoints([
      ["2026-02-08", 100],
      ["2026-02-09", 200],
      ["2026-02-10", 300],
      ["2026-02-11", 400],
      ["2026-02-12", 500],
      ["2026-02-13", 600],
      ["2026-02-14", 700],
      ["2026-02-15", 800],
    ]);
    const result = calculateVelocity(points, 3600, makeDate(2026, 2, 15));

    // Last 7 chronological: 200,300,400,500,600,700,800
    expect(result.sparkData).toEqual([200, 300, 400, 500, 600, 700, 800]);
  });

  it("detects 'up' trend with increasing data", () => {
    const points = makeDailyPoints([
      ["2026-02-09", 100000],
      ["2026-02-10", 100000],
      ["2026-02-11", 100000],
      ["2026-02-12", 100000],
      ["2026-02-13", 500000],
      ["2026-02-14", 500000],
      ["2026-02-15", 500000],
    ]);
    const result = calculateVelocity(points, 1900000, makeDate(2026, 2, 15));

    expect(result.trend).toBe("up");
  });

  it("detects 'down' trend with decreasing data", () => {
    const points = makeDailyPoints([
      ["2026-02-09", 500000],
      ["2026-02-10", 500000],
      ["2026-02-11", 500000],
      ["2026-02-12", 500000],
      ["2026-02-13", 100000],
      ["2026-02-14", 100000],
      ["2026-02-15", 100000],
    ]);
    const result = calculateVelocity(points, 2200000, makeDate(2026, 2, 15));

    expect(result.trend).toBe("down");
  });

  it("detects 'flat' trend with uniform data", () => {
    const points = makeDailyPoints([
      ["2026-02-09", 1000000],
      ["2026-02-10", 1000000],
      ["2026-02-11", 1000000],
      ["2026-02-12", 1000000],
      ["2026-02-13", 1000000],
      ["2026-02-14", 1000000],
      ["2026-02-15", 1000000],
    ]);
    const result = calculateVelocity(points, 7000000, makeDate(2026, 2, 15));

    expect(result.trend).toBe("flat");
  });

  it("projects month-end correctly", () => {
    const points = makeDailyPoints([
      ["2026-02-14", 2000000],
      ["2026-02-15", 2000000],
    ]);
    // At noon on Feb 15, remaining = 13.5 days
    const result = calculateVelocity(points, 10000000, makeDate(2026, 2, 15));

    expect(result.hasEnoughData).toBe(true);
    // projected = 10M + tokensPerDay * 13.5
    expect(result.projectedMonthEnd).toBe(
      10000000 + result.tokensPerDay * 13.5,
    );
  });

  it("handles all-zero data as insufficient", () => {
    const points = makeDailyPoints([
      ["2026-02-14", 0],
      ["2026-02-15", 0],
    ]);
    const result = calculateVelocity(points, 0, makeDate(2026, 2, 15));

    expect(result.hasEnoughData).toBe(false);
  });
});
