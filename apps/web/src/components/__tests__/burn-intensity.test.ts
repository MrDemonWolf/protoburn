import { describe, it, expect } from "vitest";
import { getBurnTier } from "@/lib/burn-tiers";

describe("getBurnTier", () => {
  it("returns cold for < 100K tokens", () => {
    const tier = getBurnTier(0);
    expect(tier.name).toBe("cold");
    expect(tier.embers).toBe(0);
    expect(tier.flames).toBe(0);
    expect(tier.sideGlow).toBe(false);
    expect(tier.topGlow).toBe(false);
  });

  it("returns cold for 99,999 tokens", () => {
    expect(getBurnTier(99_999).name).toBe("cold");
  });

  it("returns spark for >= 100K tokens", () => {
    const tier = getBurnTier(100_000);
    expect(tier.name).toBe("spark");
    expect(tier.embers).toBe(8);
    expect(tier.flames).toBe(2);
    expect(tier.sideGlow).toBe(false);
  });

  it("returns warm for >= 500K tokens", () => {
    const tier = getBurnTier(500_000);
    expect(tier.name).toBe("warm");
    expect(tier.embers).toBe(14);
    expect(tier.flames).toBe(6);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("2vw");
  });

  it("returns burning for >= 1M tokens", () => {
    const tier = getBurnTier(1_000_000);
    expect(tier.name).toBe("burning");
    expect(tier.embers).toBe(25);
    expect(tier.flames).toBe(14);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("3.5vw");
  });

  it("returns blazing for >= 5M tokens", () => {
    const tier = getBurnTier(5_000_000);
    expect(tier.name).toBe("blazing");
    expect(tier.embers).toBe(32);
    expect(tier.flames).toBe(18);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("5vw");
    expect(tier.topGlow).toBe(false);
  });

  it("returns inferno for >= 10M tokens", () => {
    const tier = getBurnTier(10_000_000);
    expect(tier.name).toBe("inferno");
    expect(tier.embers).toBe(35);
    expect(tier.flames).toBe(18);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("6vw");
    expect(tier.topGlow).toBe(true);
    expect(tier.topGlowHeight).toBe("12vh");
    expect(tier.isInferno).toBe(true);
  });

  it("returns meltdown for >= 20M tokens", () => {
    const tier = getBurnTier(20_000_000);
    expect(tier.name).toBe("meltdown");
    expect(tier.embers).toBe(120);
    expect(tier.flames).toBe(60);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("10vw");
    expect(tier.topGlow).toBe(true);
    expect(tier.topGlowHeight).toBe("20vh");
    expect(tier.isMeltdown).toBe(true);
  });

  it("meltdown at high tokens still returns meltdown", () => {
    expect(getBurnTier(100_000_000).name).toBe("meltdown");
  });
});
