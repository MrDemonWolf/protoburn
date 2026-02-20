import { describe, it, expect } from "vitest";
import { tierToSoundConfig } from "../sound-tiers";

describe("tierToSoundConfig", () => {
  it("returns all null for cold tier", () => {
    const config = tierToSoundConfig("cold");
    expect(config.crackle).toBeNull();
    expect(config.rumble).toBeNull();
    expect(config.hiss).toBeNull();
    expect(config.alarm).toBeNull();
  });

  it("returns subtle crackle for spark tier", () => {
    const config = tierToSoundConfig("spark");
    expect(config.crackle).toEqual({ volume: 0.15, rate: 3 });
    expect(config.rumble).toBeNull();
    expect(config.hiss).toBeNull();
    expect(config.alarm).toBeNull();
  });

  it("adds rumble for warm tier", () => {
    const config = tierToSoundConfig("warm");
    expect(config.crackle).toEqual({ volume: 0.25, rate: 5 });
    expect(config.rumble).toEqual({ volume: 0.08, frequency: 60 });
    expect(config.hiss).toBeNull();
    expect(config.alarm).toBeNull();
  });

  it("adds hiss for burning tier", () => {
    const config = tierToSoundConfig("burning");
    expect(config.crackle).toEqual({ volume: 0.35, rate: 8 });
    expect(config.rumble).toEqual({ volume: 0.15, frequency: 50 });
    expect(config.hiss).toEqual({ volume: 0.05 });
    expect(config.alarm).toBeNull();
  });

  it("increases intensity for blazing tier", () => {
    const config = tierToSoundConfig("blazing");
    expect(config.crackle).toEqual({ volume: 0.45, rate: 12 });
    expect(config.rumble).toEqual({ volume: 0.25, frequency: 45 });
    expect(config.hiss).toEqual({ volume: 0.1 });
    expect(config.alarm).toBeNull();
  });

  it("near max for inferno tier", () => {
    const config = tierToSoundConfig("inferno");
    expect(config.crackle).toEqual({ volume: 0.55, rate: 18 });
    expect(config.rumble).toEqual({ volume: 0.35, frequency: 40 });
    expect(config.hiss).toEqual({ volume: 0.15 });
    expect(config.alarm).toBeNull();
  });

  it("enables alarm for meltdown tier", () => {
    const config = tierToSoundConfig("meltdown");
    expect(config.crackle).toEqual({ volume: 0.7, rate: 25 });
    expect(config.rumble).toEqual({ volume: 0.5, frequency: 35 });
    expect(config.hiss).toEqual({ volume: 0.2 });
    expect(config.alarm).toEqual({ volume: 0.3 });
  });

  it("returns cold config for unknown tier names", () => {
    const config = tierToSoundConfig("unknown");
    expect(config.crackle).toBeNull();
    expect(config.rumble).toBeNull();
    expect(config.hiss).toBeNull();
    expect(config.alarm).toBeNull();
  });

  it("increases crackle volume monotonically across tiers", () => {
    const tiers = ["spark", "warm", "burning", "blazing", "inferno", "meltdown"];
    let prevVolume = 0;
    for (const tier of tiers) {
      const config = tierToSoundConfig(tier);
      expect(config.crackle!.volume).toBeGreaterThan(prevVolume);
      prevVolume = config.crackle!.volume;
    }
  });

  it("decreases rumble frequency as tiers increase", () => {
    const tiers = ["warm", "burning", "blazing", "inferno", "meltdown"];
    let prevFreq = Infinity;
    for (const tier of tiers) {
      const config = tierToSoundConfig(tier);
      expect(config.rumble!.frequency).toBeLessThan(prevFreq);
      prevFreq = config.rumble!.frequency;
    }
  });
});
