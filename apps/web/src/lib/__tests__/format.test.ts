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
  });

  it("returns 1 flame for cost > $0", () => {
    expect(getFireLevel(0.01).flames).toBe(1);
    expect(getFireLevel(99.99).flames).toBe(1);
  });

  it("returns 2 flames for cost >= $100", () => {
    expect(getFireLevel(100).flames).toBe(2);
    expect(getFireLevel(199.99).flames).toBe(2);
  });

  it("returns 3 flames for cost >= $200", () => {
    expect(getFireLevel(200).flames).toBe(3);
    expect(getFireLevel(399.99).flames).toBe(3);
  });

  it("returns 4 flames for cost >= $400", () => {
    expect(getFireLevel(400).flames).toBe(4);
    expect(getFireLevel(699.99).flames).toBe(4);
  });

  it("returns 5 flames for cost >= $700", () => {
    expect(getFireLevel(700).flames).toBe(5);
    expect(getFireLevel(999.99).flames).toBe(5);
  });

  it("returns 6 flames for cost >= $1000", () => {
    expect(getFireLevel(1000).flames).toBe(6);
    expect(getFireLevel(1499.99).flames).toBe(6);
  });

  it("returns 7 flames for cost >= $1500", () => {
    expect(getFireLevel(1500).flames).toBe(7);
    expect(getFireLevel(1999.99).flames).toBe(7);
  });

  it("returns 8 flames for cost >= $2000", () => {
    expect(getFireLevel(2000).flames).toBe(8);
    expect(getFireLevel(2999.99).flames).toBe(8);
  });

  it("returns 9 flames for cost >= $3000", () => {
    expect(getFireLevel(3000).flames).toBe(9);
    expect(getFireLevel(3999.99).flames).toBe(9);
  });

  it("returns 10 flames for cost >= $4000", () => {
    expect(getFireLevel(4000).flames).toBe(10);
    expect(getFireLevel(10000).flames).toBe(10);
  });
});
