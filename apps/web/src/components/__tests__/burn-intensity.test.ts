import { describe, it, expect } from "vitest";
import { getBurnTier } from "@/lib/burn-tiers";

describe("getBurnTier", () => {
  it("returns cold for < 5M tokens", () => {
    const tier = getBurnTier(0);
    expect(tier.name).toBe("cold");
    expect(tier.embers).toBe(0);
    expect(tier.flames).toBe(0);
    expect(tier.sideGlow).toBe(false);
    expect(tier.topGlow).toBe(false);
  });

  it("returns cold for 4,999,999 tokens", () => {
    expect(getBurnTier(4_999_999).name).toBe("cold");
  });

  it("returns spark for >= 5M tokens", () => {
    const tier = getBurnTier(5_000_000);
    expect(tier.name).toBe("spark");
    expect(tier.embers).toBe(20);
    expect(tier.flames).toBe(8);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("1.5vw");
  });

  it("returns warm for >= 100M tokens", () => {
    const tier = getBurnTier(100_000_000);
    expect(tier.name).toBe("warm");
    expect(tier.embers).toBe(28);
    expect(tier.flames).toBe(14);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("3vw");
  });

  it("returns burning for >= 400M tokens", () => {
    const tier = getBurnTier(400_000_000);
    expect(tier.name).toBe("burning");
    expect(tier.embers).toBe(38);
    expect(tier.flames).toBe(18);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("4vw");
  });

  it("returns blazing for >= 1B tokens", () => {
    const tier = getBurnTier(1_000_000_000);
    expect(tier.name).toBe("blazing");
    expect(tier.embers).toBe(48);
    expect(tier.flames).toBe(24);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("5.5vw");
    expect(tier.topGlow).toBe(true);
    expect(tier.topGlowHeight).toBe("8vh");
  });

  it("returns inferno for >= 2B tokens", () => {
    const tier = getBurnTier(2_000_000_000);
    expect(tier.name).toBe("inferno");
    expect(tier.embers).toBe(55);
    expect(tier.flames).toBe(28);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("7vw");
    expect(tier.topGlow).toBe(true);
    expect(tier.topGlowHeight).toBe("14vh");
    expect(tier.isInferno).toBe(true);
  });

  it("returns meltdown for >= 3B tokens", () => {
    const tier = getBurnTier(3_000_000_000);
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
    expect(getBurnTier(20_000_000_000).name).toBe("meltdown");
  });
});
