import { describe, it, expect } from "vitest";
import { getBurnTier } from "@/lib/burn-tiers";

describe("getBurnTier", () => {
  it("returns cold for < 20M tokens", () => {
    const tier = getBurnTier(0);
    expect(tier.name).toBe("cold");
    expect(tier.embers).toBe(0);
    expect(tier.flames).toBe(0);
    expect(tier.sideGlow).toBe(false);
    expect(tier.topGlow).toBe(false);
  });

  it("returns cold for 19,999,999 tokens", () => {
    expect(getBurnTier(19_999_999).name).toBe("cold");
  });

  it("returns spark for >= 20M tokens", () => {
    const tier = getBurnTier(20_000_000);
    expect(tier.name).toBe("spark");
    expect(tier.embers).toBe(16);
    expect(tier.flames).toBe(6);
    expect(tier.sideGlow).toBe(false);
  });

  it("returns warm for >= 100M tokens", () => {
    const tier = getBurnTier(100_000_000);
    expect(tier.name).toBe("warm");
    expect(tier.embers).toBe(22);
    expect(tier.flames).toBe(10);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("2.5vw");
  });

  it("returns burning for >= 200M tokens", () => {
    const tier = getBurnTier(200_000_000);
    expect(tier.name).toBe("burning");
    expect(tier.embers).toBe(32);
    expect(tier.flames).toBe(16);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("3.5vw");
  });

  it("returns blazing for >= 1B tokens", () => {
    const tier = getBurnTier(1_000_000_000);
    expect(tier.name).toBe("blazing");
    expect(tier.embers).toBe(40);
    expect(tier.flames).toBe(20);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("5vw");
    expect(tier.topGlow).toBe(false);
  });

  it("returns inferno for >= 2B tokens", () => {
    const tier = getBurnTier(2_000_000_000);
    expect(tier.name).toBe("inferno");
    expect(tier.embers).toBe(45);
    expect(tier.flames).toBe(22);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("6vw");
    expect(tier.topGlow).toBe(true);
    expect(tier.topGlowHeight).toBe("12vh");
    expect(tier.isInferno).toBe(true);
  });

  it("returns meltdown for >= 4B tokens", () => {
    const tier = getBurnTier(4_000_000_000);
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
