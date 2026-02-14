import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "@protoburn/api/routers/index";
import db, { schema } from "@protoburn/db";

// Create a direct caller (no HTTP, no context needed)
const caller = appRouter.createCaller({ session: null });

beforeEach(async () => {
  await db.delete(schema.tokenUsage);
});

describe("tokenUsage.push", () => {
  it("inserts records and returns count", async () => {
    const result = await caller.tokenUsage.push({
      records: [
        { model: "claude-sonnet-4-5", inputTokens: 1000, outputTokens: 500, date: "2025-01-15" },
        { model: "claude-haiku-4-5", inputTokens: 2000, outputTokens: 1000, date: "2025-01-15" },
      ],
    });
    expect(result.count).toBe(2);
  });
});

describe("tokenUsage.totals", () => {
  it("returns zeros when no data", async () => {
    const result = await caller.tokenUsage.totals();
    expect(result.totalInput).toBe(0);
    expect(result.totalOutput).toBe(0);
    expect(result.totalTokens).toBe(0);
  });

  it("sums all records", async () => {
    await caller.tokenUsage.push({
      records: [
        { model: "claude-sonnet-4-5", inputTokens: 1000, outputTokens: 500, date: "2025-01-15" },
        { model: "claude-haiku-4-5", inputTokens: 3000, outputTokens: 1500, date: "2025-01-16" },
      ],
    });

    const result = await caller.tokenUsage.totals();
    expect(result.totalInput).toBe(4000);
    expect(result.totalOutput).toBe(2000);
    expect(result.totalTokens).toBe(6000);
  });
});

describe("tokenUsage.byModel", () => {
  it("returns empty array when no data", async () => {
    const result = await caller.tokenUsage.byModel();
    expect(result).toEqual([]);
  });

  it("groups by model", async () => {
    await caller.tokenUsage.push({
      records: [
        { model: "claude-sonnet-4-5", inputTokens: 1000, outputTokens: 500, date: "2025-01-15" },
        { model: "claude-sonnet-4-5", inputTokens: 2000, outputTokens: 1000, date: "2025-01-16" },
        { model: "claude-haiku-4-5", inputTokens: 500, outputTokens: 250, date: "2025-01-15" },
      ],
    });

    const result = await caller.tokenUsage.byModel();
    const sonnet = result.find((r) => r.model === "claude-sonnet-4-5");
    const haiku = result.find((r) => r.model === "claude-haiku-4-5");

    expect(sonnet).toBeDefined();
    expect(sonnet!.inputTokens).toBe(3000);
    expect(sonnet!.outputTokens).toBe(1500);
    expect(sonnet!.totalTokens).toBe(4500);

    expect(haiku).toBeDefined();
    expect(haiku!.inputTokens).toBe(500);
    expect(haiku!.totalTokens).toBe(750);
  });
});

describe("tokenUsage.byModelMonthly", () => {
  it("filters to the specified month", async () => {
    await caller.tokenUsage.push({
      records: [
        { model: "claude-sonnet-4-5", inputTokens: 1000, outputTokens: 500, date: "2025-01-15" },
        { model: "claude-sonnet-4-5", inputTokens: 2000, outputTokens: 1000, date: "2025-02-15" },
      ],
    });

    const result = await caller.tokenUsage.byModelMonthly({ month: "2025-01" });
    expect(result.month).toBe("2025-01");
    expect(result.models).toHaveLength(1);
    expect(result.models[0]!.inputTokens).toBe(1000);
  });

  it("returns empty models for a month with no data", async () => {
    const result = await caller.tokenUsage.byModelMonthly({ month: "2020-06" });
    expect(result.models).toEqual([]);
  });
});

describe("tokenUsage.timeSeries", () => {
  it("returns daily aggregation", async () => {
    const today = new Date().toISOString().split("T")[0]!;

    await caller.tokenUsage.push({
      records: [
        { model: "claude-sonnet-4-5", inputTokens: 1000, outputTokens: 500, date: today },
        { model: "claude-haiku-4-5", inputTokens: 2000, outputTokens: 1000, date: today },
      ],
    });

    const result = await caller.tokenUsage.timeSeries({ days: 7 });
    expect(result.length).toBeGreaterThanOrEqual(1);

    const todayEntry = result.find((r) => r.date === today);
    expect(todayEntry).toBeDefined();
    expect(todayEntry!.inputTokens).toBe(3000);
    expect(todayEntry!.outputTokens).toBe(1500);
  });

  it("returns empty for no data in range", async () => {
    const result = await caller.tokenUsage.timeSeries({ days: 1 });
    expect(result).toEqual([]);
  });
});

describe("healthCheck", () => {
  it("returns OK", async () => {
    const result = await caller.healthCheck();
    expect(result).toBe("OK");
  });
});
