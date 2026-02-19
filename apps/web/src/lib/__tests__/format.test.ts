import { describe, it, expect } from "vitest";
import { formatNumber, cleanModelName, getFireLevel } from "../format";

describe("formatNumber", () => {
  it("formats trillions", () => {
    expect(formatNumber(1_500_000_000_000)).toBe("1.5T");
    expect(formatNumber(1_000_000_000_000)).toBe("1.0T");
  });

  it("formats billions", () => {
    expect(formatNumber(1_500_000_000)).toBe("1.5B");
    expect(formatNumber(1_000_000_000)).toBe("1.0B");
  });

  it("formats millions", () => {
    expect(formatNumber(1_500_000)).toBe("1.5M");
    expect(formatNumber(10_000_000)).toBe("10.0M");
  });

  it("formats thousands", () => {
    expect(formatNumber(1_500)).toBe("1.5K");
    expect(formatNumber(999_999)).toBe("1000.0K");
  });

  it("formats small numbers with locale string", () => {
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(0)).toBe("0");
  });

  it("handles exactly 1M boundary", () => {
    expect(formatNumber(1_000_000)).toBe("1.0M");
  });

  it("handles exactly 1K boundary", () => {
    expect(formatNumber(1_000)).toBe("1.0K");
  });
});

describe("cleanModelName", () => {
  it("strips claude- prefix", () => {
    expect(cleanModelName("claude-sonnet-4-5")).toBe("sonnet-4-5");
  });

  it("strips date suffix", () => {
    expect(cleanModelName("claude-opus-4-6-20250101")).toBe("opus-4-6");
  });

  it("strips both prefix and suffix", () => {
    expect(cleanModelName("claude-haiku-4-5-20250301")).toBe("haiku-4-5");
  });

  it("leaves non-matching names unchanged", () => {
    expect(cleanModelName("gpt-4")).toBe("gpt-4");
  });
});

describe("getFireLevel", () => {
  it("returns 0 flames for zero cost", () => {
    const result = getFireLevel(0);
    expect(result.flames).toBe(0);
    expect(result.color).toBe("text-muted-foreground");
    expect(result.animation).toBe("");
  });

  it("returns 1 flame for cost > $0", () => {
    expect(getFireLevel(0.01).flames).toBe(1);
    expect(getFireLevel(0.01).animation).toBe("");
    expect(getFireLevel(24.99).flames).toBe(1);
  });

  it("returns 2 flames for cost >= $25", () => {
    expect(getFireLevel(25).flames).toBe(2);
    expect(getFireLevel(124.99).flames).toBe(2);
  });

  it("returns flicker animation for cost >= $125", () => {
    expect(getFireLevel(125).animation).toBe("animate-flame-flicker");
    expect(getFireLevel(300).animation).toBe("animate-flame-flicker");
    expect(getFireLevel(500).animation).toBe("animate-flame-flicker");
  });

  it("returns dance animation for cost >= $800", () => {
    expect(getFireLevel(800).animation).toBe("animate-flame-dance");
    expect(getFireLevel(1100).animation).toBe("animate-flame-dance");
    expect(getFireLevel(1500).animation).toBe("animate-flame-dance");
  });

  it("returns rage animation for cost >= $2000", () => {
    expect(getFireLevel(2000).animation).toBe("animate-flame-rage");
    expect(getFireLevel(2500).animation).toBe("animate-flame-rage");
  });

  it("returns correct flame counts at each threshold", () => {
    expect(getFireLevel(25).flames).toBe(2);
    expect(getFireLevel(125).flames).toBe(3);
    expect(getFireLevel(300).flames).toBe(4);
    expect(getFireLevel(500).flames).toBe(5);
    expect(getFireLevel(800).flames).toBe(6);
    expect(getFireLevel(1100).flames).toBe(7);
    expect(getFireLevel(1500).flames).toBe(8);
    expect(getFireLevel(2000).flames).toBe(9);
    expect(getFireLevel(2500).flames).toBe(10);
    expect(getFireLevel(10000).flames).toBe(10);
  });
});
