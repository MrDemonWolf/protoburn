import { createNoise2D } from "simplex-noise";
import type { BurnTier } from "./burn-tiers";

export interface TierConfig {
  emberCount: number;
  flameCount: number;
  // Glow parameters
  bottomGlowHeight: number; // 0-1 fraction of canvas height
  bottomGlowOpacity: number;
  bottomGlowPulseSpeed: number; // rad/s, 0 = no pulse
  sideGlow: boolean;
  sideGlowWidth: number; // 0-1 fraction of canvas width
  sideGlowOpacity: number;
  sideGlowTop: number; // 0-1, how far up the side glow reaches (0=top, 1=bottom)
  sideGlowPulse: boolean;
  topGlow: boolean;
  topGlowHeight: number;
  topGlowOpacity: number;
  topGlowPulseSpeed: number;
  // Vignette
  vignetteType: "none" | "blazing" | "inferno" | "meltdown";
  // Heat shimmer
  heatShimmer: boolean;
  // Particle behavior modifiers
  emberSpeedMin: number;
  emberSpeedMax: number;
  flameSpeedMin: number;
  flameSpeedMax: number;
  driftStrength: number;
  // Glow colors
  glowColorStops: Array<{ r: number; g: number; b: number; a: number }>;
}

const GLOW_WARM = [
  { r: 251, g: 191, b: 36, a: 0.35 },
  { r: 249, g: 115, b: 22, a: 0.12 },
];
const GLOW_BURNING = [
  { r: 249, g: 115, b: 22, a: 0.45 },
  { r: 239, g: 68, b: 68, a: 0.18 },
];
const GLOW_BLAZING = [
  { r: 249, g: 115, b: 22, a: 0.5 },
  { r: 239, g: 68, b: 68, a: 0.25 },
  { r: 253, g: 224, b: 71, a: 0.05 },
];
const GLOW_DEFAULT = [
  { r: 249, g: 115, b: 22, a: 0.4 },
  { r: 239, g: 68, b: 68, a: 0.15 },
];

export function tierToConfig(tier: BurnTier): TierConfig {
  const name = tier.name;
  switch (name) {
    case "meltdown":
      return {
        emberCount: 120, flameCount: 60,
        bottomGlowHeight: 0.75, bottomGlowOpacity: 0.9, bottomGlowPulseSpeed: Math.PI,
        sideGlow: true, sideGlowWidth: 0.08, sideGlowOpacity: 0.63, sideGlowTop: 0, sideGlowPulse: false,
        topGlow: true, topGlowHeight: 0.2, topGlowOpacity: 0.3, topGlowPulseSpeed: Math.PI,
        vignetteType: "meltdown", heatShimmer: true,
        emberSpeedMin: 120, emberSpeedMax: 300,
        flameSpeedMin: 100, flameSpeedMax: 200,
        driftStrength: 150,
        glowColorStops: GLOW_DEFAULT,
      };
    case "inferno":
      return {
        emberCount: 45, flameCount: 22,
        bottomGlowHeight: 0.35, bottomGlowOpacity: 0.5, bottomGlowPulseSpeed: 0,
        sideGlow: true, sideGlowWidth: 0.05, sideGlowOpacity: 0.35, sideGlowTop: 0.2, sideGlowPulse: false,
        topGlow: true, topGlowHeight: 0.12, topGlowOpacity: 0.18, topGlowPulseSpeed: Math.PI / 2,
        vignetteType: "inferno", heatShimmer: false,
        emberSpeedMin: 60, emberSpeedMax: 160,
        flameSpeedMin: 60, flameSpeedMax: 120,
        driftStrength: 100,
        glowColorStops: GLOW_DEFAULT,
      };
    case "blazing":
      return {
        emberCount: 40, flameCount: 20,
        bottomGlowHeight: 0.3, bottomGlowOpacity: 0.45, bottomGlowPulseSpeed: Math.PI * 2 / 3,
        sideGlow: true, sideGlowWidth: 0.04, sideGlowOpacity: 0.32, sideGlowTop: 0.3, sideGlowPulse: true,
        topGlow: false, topGlowHeight: 0, topGlowOpacity: 0, topGlowPulseSpeed: 0,
        vignetteType: "blazing", heatShimmer: true,
        emberSpeedMin: 50, emberSpeedMax: 140,
        flameSpeedMin: 50, flameSpeedMax: 110,
        driftStrength: 80,
        glowColorStops: GLOW_BLAZING,
      };
    case "burning":
      return {
        emberCount: 32, flameCount: 16,
        bottomGlowHeight: 0.25, bottomGlowOpacity: 0.35, bottomGlowPulseSpeed: Math.PI / 2,
        sideGlow: true, sideGlowWidth: 0.03, sideGlowOpacity: 0.25, sideGlowTop: 0.4, sideGlowPulse: false,
        topGlow: false, topGlowHeight: 0, topGlowOpacity: 0, topGlowPulseSpeed: 0,
        vignetteType: "none", heatShimmer: false,
        emberSpeedMin: 40, emberSpeedMax: 120,
        flameSpeedMin: 40, flameSpeedMax: 100,
        driftStrength: 60,
        glowColorStops: GLOW_BURNING,
      };
    case "warm":
      return {
        emberCount: 22, flameCount: 10,
        bottomGlowHeight: 0.18, bottomGlowOpacity: 0.28, bottomGlowPulseSpeed: Math.PI / 3,
        sideGlow: true, sideGlowWidth: 0.02, sideGlowOpacity: 0.2, sideGlowTop: 0.6, sideGlowPulse: false,
        topGlow: false, topGlowHeight: 0, topGlowOpacity: 0, topGlowPulseSpeed: 0,
        vignetteType: "none", heatShimmer: false,
        emberSpeedMin: 30, emberSpeedMax: 100,
        flameSpeedMin: 30, flameSpeedMax: 80,
        driftStrength: 50,
        glowColorStops: GLOW_WARM,
      };
    case "spark":
      return {
        emberCount: 16, flameCount: 6,
        bottomGlowHeight: 0.12, bottomGlowOpacity: 0.2, bottomGlowPulseSpeed: 0,
        sideGlow: false, sideGlowWidth: 0, sideGlowOpacity: 0, sideGlowTop: 1, sideGlowPulse: false,
        topGlow: false, topGlowHeight: 0, topGlowOpacity: 0, topGlowPulseSpeed: 0,
        vignetteType: "none", heatShimmer: false,
        emberSpeedMin: 25, emberSpeedMax: 80,
        flameSpeedMin: 25, flameSpeedMax: 70,
        driftStrength: 40,
        glowColorStops: GLOW_DEFAULT,
      };
    default: // cold
      return {
        emberCount: 0, flameCount: 0,
        bottomGlowHeight: 0, bottomGlowOpacity: 0, bottomGlowPulseSpeed: 0,
        sideGlow: false, sideGlowWidth: 0, sideGlowOpacity: 0, sideGlowTop: 1, sideGlowPulse: false,
        topGlow: false, topGlowHeight: 0, topGlowOpacity: 0, topGlowPulseSpeed: 0,
        vignetteType: "none", heatShimmer: false,
        emberSpeedMin: 0, emberSpeedMax: 0,
        flameSpeedMin: 0, flameSpeedMax: 0,
        driftStrength: 0,
        glowColorStops: [],
      };
  }
}

// Ember colors: yellow, amber, orange, red
const EMBER_COLORS = [
  { r: 253, g: 224, b: 71 },  // yellow
  { r: 251, g: 191, b: 36 },  // amber
  { r: 249, g: 115, b: 22 },  // orange
  { r: 239, g: 68, b: 68 },   // red
];

// Flame colors: white core → yellow → orange → red
const FLAME_COLORS = [
  { r: 255, g: 250, b: 220 }, // white-yellow core
  { r: 253, g: 224, b: 71 },  // yellow
  { r: 249, g: 115, b: 22 },  // orange
  { r: 239, g: 68, b: 68 },   // red-orange
];

// Struct-of-arrays particle pool for zero GC
export class ParticlePool {
  readonly capacity: number;
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly size: Float32Array;
  readonly life: Float32Array;
  readonly maxLife: Float32Array;
  readonly opacity: Float32Array;
  readonly colorIdx: Uint8Array;
  /** 0 = ember, 1 = flame */
  readonly kind: Uint8Array;
  count = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.x = new Float32Array(capacity);
    this.y = new Float32Array(capacity);
    this.vx = new Float32Array(capacity);
    this.vy = new Float32Array(capacity);
    this.size = new Float32Array(capacity);
    this.life = new Float32Array(capacity);
    this.maxLife = new Float32Array(capacity);
    this.opacity = new Float32Array(capacity);
    this.colorIdx = new Uint8Array(capacity);
    this.kind = new Uint8Array(capacity);
  }
}

export class FireEngine {
  private pool: ParticlePool;
  private config: TierConfig;
  private noise2D: ReturnType<typeof createNoise2D>;
  private time = 0;
  private targetEmbers = 0;
  private targetFlames = 0;

  constructor(config?: TierConfig) {
    this.pool = new ParticlePool(256); // max meltdown is 180 particles
    this.config = config ?? tierToConfig({ name: "cold", embers: 0, flames: 0, glowOpacity: 0, glowHeight: "0", sideGlow: false, sideGlowWidth: "0", topGlow: false, topGlowHeight: "0" });
    this.noise2D = createNoise2D();
    if (config) {
      this.targetEmbers = config.emberCount;
      this.targetFlames = config.flameCount;
    }
  }

  configure(config: TierConfig) {
    this.config = config;
    this.targetEmbers = config.emberCount;
    this.targetFlames = config.flameCount;
    // Don't kill excess particles immediately — let them die naturally
  }

  getConfig(): TierConfig {
    return this.config;
  }

  getPool(): ParticlePool {
    return this.pool;
  }

  getTime(): number {
    return this.time;
  }

  private spawnParticle(i: number, kind: 0 | 1, w: number, h: number) {
    const p = this.pool;
    const cfg = this.config;
    p.kind[i] = kind;
    p.x[i] = Math.random() * w;
    p.y[i] = h + Math.random() * 20; // start just below bottom
    p.colorIdx[i] = Math.floor(Math.random() * 4);

    if (kind === 0) {
      // Ember
      p.size[i] = 2 + Math.random() * 5;
      p.vy[i] = -(cfg.emberSpeedMin + Math.random() * (cfg.emberSpeedMax - cfg.emberSpeedMin));
      p.vx[i] = (Math.random() - 0.5) * cfg.driftStrength * 0.5;
      p.maxLife[i] = 3 + Math.random() * 5;
      p.opacity[i] = 0.4 + Math.random() * 0.5;
    } else {
      // Flame
      p.size[i] = 12 + Math.random() * 20;
      p.vy[i] = -(cfg.flameSpeedMin + Math.random() * (cfg.flameSpeedMax - cfg.flameSpeedMin));
      p.vx[i] = (Math.random() - 0.5) * cfg.driftStrength * 0.3;
      p.maxLife[i] = 2 + Math.random() * 3;
      p.opacity[i] = 0.15 + Math.random() * 0.2;
    }
    p.life[i] = 0;
  }

  update(dt: number, width: number, height: number) {
    this.time += dt;
    const p = this.pool;
    const cfg = this.config;
    const t = this.time;

    // Count current embers and flames
    let currentEmbers = 0;
    let currentFlames = 0;
    for (let i = 0; i < p.count; i++) {
      if (p.kind[i] === 0) currentEmbers++;
      else currentFlames++;
    }

    // Spawn new particles if needed
    const needEmbers = this.targetEmbers - currentEmbers;
    const needFlames = this.targetFlames - currentFlames;

    // Spawn rate: fill up over ~2 seconds
    const spawnRate = dt * 30; // ~30 particles/second spawn budget
    const embersToSpawn = Math.min(needEmbers, Math.ceil(spawnRate));
    const flamesToSpawn = Math.min(needFlames, Math.ceil(spawnRate * 0.5));

    for (let s = 0; s < embersToSpawn && p.count < p.capacity; s++) {
      this.spawnParticle(p.count, 0, width, height);
      // Stagger initial life so they don't all cluster at bottom
      p.life[p.count] = -Math.random() * 2;
      p.count++;
    }
    for (let s = 0; s < flamesToSpawn && p.count < p.capacity; s++) {
      this.spawnParticle(p.count, 1, width, height);
      p.life[p.count] = -Math.random() * 1.5;
      p.count++;
    }

    // Update all particles
    for (let i = p.count - 1; i >= 0; i--) {
      p.life[i] += dt;

      // Skip if in spawn delay
      if (p.life[i] < 0) continue;

      // Noise-driven wind
      const noiseX = this.noise2D(p.x[i] * 0.003, t * 0.4) * cfg.driftStrength;
      const noiseY = this.noise2D(p.x[i] * 0.003 + 100, t * 0.3) * cfg.driftStrength * 0.3;

      // Turbulence jitter per particle
      const jitterX = this.noise2D(i * 0.7 + t * 2, p.y[i] * 0.01) * 20;
      const jitterY = this.noise2D(i * 0.7 + 50, t * 1.5 + p.y[i] * 0.01) * 10;

      p.x[i] += (p.vx[i] + noiseX + jitterX) * dt;
      p.y[i] += (p.vy[i] + noiseY + jitterY) * dt;

      // Remove dead particles (life exceeded or off-screen)
      const lifeRatio = p.life[i] / p.maxLife[i];
      if (lifeRatio >= 1 || p.y[i] < -50 || p.x[i] < -50 || p.x[i] > width + 50) {
        // Check if we should respawn or remove
        const isEmber = p.kind[i] === 0;
        const currentCount = isEmber ? currentEmbers : currentFlames;
        const target = isEmber ? this.targetEmbers : this.targetFlames;

        if (currentCount <= target) {
          // Respawn in place
          this.spawnParticle(i, p.kind[i] as 0 | 1, width, height);
        } else {
          // Remove by swapping with last
          p.count--;
          if (i < p.count) {
            p.x[i] = p.x[p.count];
            p.y[i] = p.y[p.count];
            p.vx[i] = p.vx[p.count];
            p.vy[i] = p.vy[p.count];
            p.size[i] = p.size[p.count];
            p.life[i] = p.life[p.count];
            p.maxLife[i] = p.maxLife[p.count];
            p.opacity[i] = p.opacity[p.count];
            p.colorIdx[i] = p.colorIdx[p.count];
            p.kind[i] = p.kind[p.count];
          }
          if (isEmber) currentEmbers--;
          else currentFlames--;
        }
      }
    }
  }
}

export { EMBER_COLORS, FLAME_COLORS };
