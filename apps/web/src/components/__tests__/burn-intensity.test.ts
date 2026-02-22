import { describe, it, expect } from "vitest";
import { getBurnTier } from "@/lib/burn-tiers";

describe("getBurnTier", () => {
  it("returns cold for < 7.5M tokens", () => {
    const tier = getBurnTier(0);
    expect(tier.name).toBe("cold");
    expect(tier.embers).toBe(0);
    expect(tier.flames).toBe(0);
    expect(tier.sideGlow).toBe(false);
    expect(tier.topGlow).toBe(false);
  });

  it("returns cold for 7,499,999 tokens", () => {
    expect(getBurnTier(7_499_999).name).toBe("cold");
  });

  it("returns spark for >= 7.5M tokens", () => {
    const tier = getBurnTier(7_500_000);
    expect(tier.name).toBe("spark");
    expect(tier.embers).toBe(60);
    expect(tier.flames).toBe(25);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("6vw");
  });

  it("returns warm for >= 150M tokens", () => {
    const tier = getBurnTier(150_000_000);
    expect(tier.name).toBe("warm");
    expect(tier.embers).toBe(85);
    expect(tier.flames).toBe(42);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("10vw");
  });

  it("returns burning for >= 600M tokens", () => {
    const tier = getBurnTier(600_000_000);
    expect(tier.name).toBe("burning");
    expect(tier.embers).toBe(115);
    expect(tier.flames).toBe(55);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("12vw");
  });

  it("returns blazing for >= 1.5B tokens", () => {
    const tier = getBurnTier(1_500_000_000);
    expect(tier.name).toBe("blazing");
    expect(tier.embers).toBe(145);
    expect(tier.flames).toBe(72);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("16vw");
    expect(tier.topGlow).toBe(true);
    expect(tier.topGlowHeight).toBe("20vh");
  });

  it("returns inferno for >= 3B tokens", () => {
    const tier = getBurnTier(3_000_000_000);
    expect(tier.name).toBe("inferno");
    expect(tier.embers).toBe(165);
    expect(tier.flames).toBe(85);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("20vw");
    expect(tier.topGlow).toBe(true);
    expect(tier.topGlowHeight).toBe("30vh");
    expect(tier.isInferno).toBe(true);
  });

  it("returns meltdown for >= 4.5B tokens", () => {
    const tier = getBurnTier(4_500_000_000);
    expect(tier.name).toBe("meltdown");
    expect(tier.embers).toBe(360);
    expect(tier.flames).toBe(180);
    expect(tier.sideGlow).toBe(true);
    expect(tier.sideGlowWidth).toBe("25vw");
    expect(tier.topGlow).toBe(true);
    expect(tier.topGlowHeight).toBe("40vh");
    expect(tier.isMeltdown).toBe(true);
  });

  it("meltdown at high tokens still returns meltdown", () => {
    expect(getBurnTier(20_000_000_000).name).toBe("meltdown");
  });
});
