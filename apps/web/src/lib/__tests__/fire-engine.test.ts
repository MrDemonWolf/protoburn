import { describe, it, expect } from "vitest";
import { FireEngine, tierToConfig, ParticlePool } from "@/lib/fire-engine";
import { TIERS } from "@/lib/burn-tiers";

describe("tierToConfig", () => {
  it("maps cold tier to zero particles", () => {
    const cfg = tierToConfig(TIERS.cold);
    expect(cfg.emberCount).toBe(0);
    expect(cfg.flameCount).toBe(0);
    expect(cfg.bottomGlowHeight).toBe(0);
  });

  it("maps spark tier correctly", () => {
    const cfg = tierToConfig(TIERS.spark);
    expect(cfg.emberCount).toBe(24);
    expect(cfg.flameCount).toBe(10);
    expect(cfg.sideGlow).toBe(true);
    expect(cfg.bottomGlowHeight).toBeGreaterThan(0);
  });

  it("maps meltdown tier to max particles", () => {
    const cfg = tierToConfig(TIERS.meltdown);
    expect(cfg.emberCount).toBe(145);
    expect(cfg.flameCount).toBe(73);
    expect(cfg.sideGlow).toBe(true);
    expect(cfg.topGlow).toBe(true);
    expect(cfg.vignetteType).toBe("meltdown");
    expect(cfg.heatShimmer).toBe(true);
  });

  it("maps all tiers to matching ember/flame counts", () => {
    for (const [name, tier] of Object.entries(TIERS)) {
      const cfg = tierToConfig(tier);
      expect(cfg.emberCount).toBe(tier.embers);
      expect(cfg.flameCount).toBe(tier.flames);
    }
  });

  it("blazing has vignette and shimmer", () => {
    const cfg = tierToConfig(TIERS.blazing);
    expect(cfg.vignetteType).toBe("blazing");
    expect(cfg.heatShimmer).toBe(true);
  });

  it("inferno has vignette and shimmer", () => {
    const cfg = tierToConfig(TIERS.inferno);
    expect(cfg.vignetteType).toBe("inferno");
    expect(cfg.heatShimmer).toBe(true);
  });
});

describe("ParticlePool", () => {
  it("initializes with correct capacity and zero count", () => {
    const pool = new ParticlePool(64);
    expect(pool.capacity).toBe(64);
    expect(pool.count).toBe(0);
    expect(pool.x.length).toBe(64);
    expect(pool.kind.length).toBe(64);
  });
});

describe("FireEngine", () => {
  it("spawns particles up to target on update", () => {
    const cfg = tierToConfig(TIERS.spark);
    const engine = new FireEngine(cfg);

    // Run several updates to let particles spawn
    for (let i = 0; i < 20; i++) {
      engine.update(0.05, 800, 600);
    }

    const pool = engine.getPool();
    expect(pool.count).toBeGreaterThan(0);
    expect(pool.count).toBeLessThanOrEqual(cfg.emberCount + cfg.flameCount);
  });

  it("all particles stay within reasonable bounds after updates", () => {
    const cfg = tierToConfig(TIERS.burning);
    const engine = new FireEngine(cfg);
    const W = 1000;
    const H = 800;

    // Spawn and run
    for (let i = 0; i < 60; i++) {
      engine.update(1 / 60, W, H);
    }

    const pool = engine.getPool();
    for (let i = 0; i < pool.count; i++) {
      // Particles should be within expanded bounds (they get removed at -50 / W+50)
      expect(pool.x[i]).toBeGreaterThanOrEqual(-50);
      expect(pool.x[i]).toBeLessThanOrEqual(W + 50);
    }
  });

  it("configure reduces particles naturally over time", () => {
    const meltdownCfg = tierToConfig(TIERS.meltdown);
    const engine = new FireEngine(meltdownCfg);

    // Fill up with meltdown particles
    for (let i = 0; i < 100; i++) {
      engine.update(0.05, 800, 600);
    }

    const countBefore = engine.getPool().count;
    expect(countBefore).toBeGreaterThan(0);

    // Switch to spark (far fewer particles)
    const sparkCfg = tierToConfig(TIERS.spark);
    engine.configure(sparkCfg);

    // Run for a long time to let excess particles die off
    for (let i = 0; i < 300; i++) {
      engine.update(0.05, 800, 600);
    }

    const countAfter = engine.getPool().count;
    expect(countAfter).toBeLessThanOrEqual(sparkCfg.emberCount + sparkCfg.flameCount);
  });

  it("cold config produces no particles", () => {
    const cfg = tierToConfig(TIERS.cold);
    const engine = new FireEngine(cfg);

    for (let i = 0; i < 20; i++) {
      engine.update(0.05, 800, 600);
    }

    expect(engine.getPool().count).toBe(0);
  });

  it("getTime advances with updates", () => {
    const engine = new FireEngine(tierToConfig(TIERS.spark));
    expect(engine.getTime()).toBe(0);
    engine.update(0.5, 800, 600);
    expect(engine.getTime()).toBeCloseTo(0.5);
    engine.update(0.3, 800, 600);
    expect(engine.getTime()).toBeCloseTo(0.8);
  });
});
