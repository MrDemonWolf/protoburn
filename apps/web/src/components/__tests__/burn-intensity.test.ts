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
    expect(tier.embers).toBe(24);
    expect(tier.flames).toBe(10);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("2.5vw");
  });

  it("returns warm for >= 100M tokens", () => {
    const tier = getBurnTier(100_000_000);
    expect(tier.name).toBe("warm");
    expect(tier.embers).toBe(34);
    expect(tier.flames).toBe(17);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("4vw");
  });

  it("returns burning for >= 400M tokens", () => {
    const tier = getBurnTier(400_000_000);
    expect(tier.name).toBe("burning");
    expect(tier.embers).toBe(46);
    expect(tier.flames).toBe(22);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("5vw");
  });

  it("returns blazing for >= 1B tokens", () => {
    const tier = getBurnTier(1_000_000_000);
    expect(tier.name).toBe("blazing");
    expect(tier.embers).toBe(58);
    expect(tier.flames).toBe(29);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("6.5vw");
    expect(tier.topGlow).toBe(true);
    expect(tier.topGlowHeight).toBe("10vh");
  });

  it("returns inferno for >= 2B tokens", () => {
    const tier = getBurnTier(2_000_000_000);
    expect(tier.name).toBe("inferno");
    expect(tier.embers).toBe(66);
    expect(tier.flames).toBe(34);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("8.5vw");
    expect(tier.topGlow).toBe(true);
    expect(tier.topGlowHeight).toBe("17vh");
    expect(tier.isInferno).toBe(true);
  });

  it("returns meltdown for >= 3B tokens", () => {
    const tier = getBurnTier(3_000_000_000);
    expect(tier.name).toBe("meltdown");
    expect(tier.embers).toBe(145);
    expect(tier.flames).toBe(73);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("12vw");
    expect(tier.topGlow).toBe(true);
    expect(tier.topGlowHeight).toBe("24vh");
    expect(tier.isMeltdown).toBe(true);
  });

  it("meltdown at high tokens still returns meltdown", () => {
    expect(getBurnTier(20_000_000_000).name).toBe("meltdown");
  });
});
