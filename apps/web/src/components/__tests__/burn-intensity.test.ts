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
    expect(tier.embers).toBe(22);
    expect(tier.flames).toBe(9);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("2vw");
  });

  it("returns warm for >= 100M tokens", () => {
    const tier = getBurnTier(100_000_000);
    expect(tier.name).toBe("warm");
    expect(tier.embers).toBe(31);
    expect(tier.flames).toBe(15);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("3.5vw");
  });

  it("returns burning for >= 400M tokens", () => {
    const tier = getBurnTier(400_000_000);
    expect(tier.name).toBe("burning");
    expect(tier.embers).toBe(42);
    expect(tier.flames).toBe(20);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("4.5vw");
  });

  it("returns blazing for >= 1B tokens", () => {
    const tier = getBurnTier(1_000_000_000);
    expect(tier.name).toBe("blazing");
    expect(tier.embers).toBe(53);
    expect(tier.flames).toBe(26);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("6vw");
    expect(tier.topGlow).toBe(true);
    expect(tier.topGlowHeight).toBe("9vh");
  });

  it("returns inferno for >= 2B tokens", () => {
    const tier = getBurnTier(2_000_000_000);
    expect(tier.name).toBe("inferno");
    expect(tier.embers).toBe(60);
    expect(tier.flames).toBe(31);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("7.5vw");
    expect(tier.topGlow).toBe(true);
    expect(tier.topGlowHeight).toBe("15vh");
    expect(tier.isInferno).toBe(true);
  });

  it("returns meltdown for >= 3B tokens", () => {
    const tier = getBurnTier(3_000_000_000);
    expect(tier.name).toBe("meltdown");
    expect(tier.embers).toBe(132);
    expect(tier.flames).toBe(66);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("11vw");
    expect(tier.topGlow).toBe(true);
    expect(tier.topGlowHeight).toBe("22vh");
    expect(tier.isMeltdown).toBe(true);
  });

  it("meltdown at high tokens still returns meltdown", () => {
    expect(getBurnTier(20_000_000_000).name).toBe("meltdown");
  });
});
