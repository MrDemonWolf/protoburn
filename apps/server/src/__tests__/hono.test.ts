import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../index";
import db, { schema } from "@protoburn/db";

beforeEach(async () => {
  await db.delete(schema.tokenUsage);
});

describe("GET /", () => {
  it("returns OK", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
  });
});

describe("POST /api/usage", () => {
  it("rejects without auth", async () => {
    const res = await app.request("/api/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        records: [
          { model: "claude-sonnet-4-5", inputTokens: 100, outputTokens: 50, date: "2025-01-15" },
        ],
      }),
    });
    expect(res.status).toBe(401);
  });

  it("accepts with valid auth", async () => {
    const res = await app.request("/api/usage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-api-key",
      },
      body: JSON.stringify({
        records: [
          { model: "claude-sonnet-4-5", inputTokens: 100, outputTokens: 50, date: "2025-01-15" },
        ],
      }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; count: number };
    expect(json.ok).toBe(true);
    expect(json.count).toBe(1);
  });

  it("rejects with wrong auth", async () => {
    const res = await app.request("/api/usage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer wrong-key",
      },
      body: JSON.stringify({
        records: [
          { model: "test", inputTokens: 100, outputTokens: 50, date: "2025-01-15" },
        ],
      }),
    });
    expect(res.status).toBe(401);
  });

  it("rejects invalid payload", async () => {
    const res = await app.request("/api/usage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-api-key",
      },
      body: JSON.stringify({ records: [{ model: "test" }] }),
    });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/usage", () => {
  it("requires auth", async () => {
    const res = await app.request("/api/usage", { method: "DELETE" });
    expect(res.status).toBe(401);
  });

  it("clears all data with valid auth", async () => {
    // Insert some data first
    await app.request("/api/usage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-api-key",
      },
      body: JSON.stringify({
        records: [
          { model: "claude-sonnet-4-5", inputTokens: 100, outputTokens: 50, date: "2025-01-15" },
        ],
      }),
    });

    // Delete all
    const res = await app.request("/api/usage", {
      method: "DELETE",
      headers: { Authorization: "Bearer test-api-key" },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean };
    expect(json.ok).toBe(true);
  });
});
