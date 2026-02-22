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
  // Particle size multiplier (2.5x epic boost)
  particleSizeMultiplier: number;
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
        emberCount: 360, flameCount: 180,
        bottomGlowHeight: 0.98, bottomGlowOpacity: 0.99, bottomGlowPulseSpeed: Math.PI * 1.8,
        sideGlow: true, sideGlowWidth: 0.25, sideGlowOpacity: 0.92, sideGlowTop: 0, sideGlowPulse: false,
        topGlow: true, topGlowHeight: 0.40, topGlowOpacity: 0.55, topGlowPulseSpeed: Math.PI * 1.8,
        vignetteType: "meltdown", heatShimmer: true,
        emberSpeedMin: 260, emberSpeedMax: 650,
        flameSpeedMin: 218, flameSpeedMax: 436,
        driftStrength: 328,
        glowColorStops: GLOW_DEFAULT,
        particleSizeMultiplier: 2.0,
      };
    case "inferno":
      return {
        emberCount: 165, flameCount: 85,
        bottomGlowHeight: 0.80, bottomGlowOpacity: 0.92, bottomGlowPulseSpeed: Math.PI / 1.8,
        sideGlow: true, sideGlowWidth: 0.17, sideGlowOpacity: 0.72, sideGlowTop: 0.05, sideGlowPulse: true,
        topGlow: true, topGlowHeight: 0.30, topGlowOpacity: 0.42, topGlowPulseSpeed: Math.PI / 1.2,
        vignetteType: "inferno", heatShimmer: true,
        emberSpeedMin: 153, emberSpeedMax: 396,
        flameSpeedMin: 142, flameSpeedMax: 304,
        driftStrength: 240,
        glowColorStops: GLOW_DEFAULT,
        particleSizeMultiplier: 1.5,
      };
    case "blazing":
      return {
        emberCount: 145, flameCount: 72,
        bottomGlowHeight: 0.75, bottomGlowOpacity: 0.82, bottomGlowPulseSpeed: Math.PI * 1.2,
        sideGlow: true, sideGlowWidth: 0.13, sideGlowOpacity: 0.62, sideGlowTop: 0.1, sideGlowPulse: true,
        topGlow: true, topGlowHeight: 0.20, topGlowOpacity: 0.28, topGlowPulseSpeed: Math.PI / 1.8,
        vignetteType: "blazing", heatShimmer: true,
        emberSpeedMin: 119, emberSpeedMax: 328,
        flameSpeedMin: 119, flameSpeedMax: 261,
        driftStrength: 196,
        glowColorStops: GLOW_BLAZING,
        particleSizeMultiplier: 1.5,
      };
    case "burning":
      return {
        emberCount: 115, flameCount: 55,
        bottomGlowHeight: 0.65, bottomGlowOpacity: 0.72, bottomGlowPulseSpeed: Math.PI / 1.2,
        sideGlow: true, sideGlowWidth: 0.10, sideGlowOpacity: 0.55, sideGlowTop: 0.15, sideGlowPulse: false,
        topGlow: false, topGlowHeight: 0, topGlowOpacity: 0, topGlowPulseSpeed: 0,
        vignetteType: "none", heatShimmer: false,
        emberSpeedMin: 99, emberSpeedMax: 283,
        flameSpeedMin: 99, flameSpeedMax: 240,
        driftStrength: 153,
        glowColorStops: GLOW_BURNING,
        particleSizeMultiplier: 1.5,
      };
    case "warm":
      return {
        emberCount: 85, flameCount: 42,
        bottomGlowHeight: 0.50, bottomGlowOpacity: 0.62, bottomGlowPulseSpeed: Math.PI / 1.8,
        sideGlow: true, sideGlowWidth: 0.075, sideGlowOpacity: 0.48, sideGlowTop: 0.25, sideGlowPulse: false,
        topGlow: false, topGlowHeight: 0, topGlowOpacity: 0, topGlowPulseSpeed: 0,
        vignetteType: "none", heatShimmer: false,
        emberSpeedMin: 76, emberSpeedMax: 240,
        flameSpeedMin: 76, flameSpeedMax: 196,
        driftStrength: 131,
        glowColorStops: GLOW_WARM,
        particleSizeMultiplier: 1.5,
      };
    case "spark":
      return {
        emberCount: 60, flameCount: 25,
        bottomGlowHeight: 0.35, bottomGlowOpacity: 0.52, bottomGlowPulseSpeed: Math.PI / 2.4,
        sideGlow: true, sideGlowWidth: 0.045, sideGlowOpacity: 0.35, sideGlowTop: 0.4, sideGlowPulse: false,
        topGlow: false, topGlowHeight: 0, topGlowOpacity: 0, topGlowPulseSpeed: 0,
        vignetteType: "none", heatShimmer: false,
        emberSpeedMin: 65, emberSpeedMax: 196,
        flameSpeedMin: 61, flameSpeedMax: 164,
        driftStrength: 99,
        glowColorStops: GLOW_DEFAULT,
        particleSizeMultiplier: 1.5,
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
        particleSizeMultiplier: 1,
      };
  }
}

// Ember colors: yellow, amber, orange, red, white-hot
const EMBER_COLORS = [
  { r: 253, g: 224, b: 71 },  // yellow
  { r: 251, g: 191, b: 36 },  // amber
  { r: 249, g: 115, b: 22 },  // orange
  { r: 239, g: 68, b: 68 },   // red
  { r: 255, g: 255, b: 240 }, // white-hot
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
    this.pool = new ParticlePool(700); // max meltdown is 540 particles
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
    const sm = cfg.particleSizeMultiplier;
    p.kind[i] = kind;
    p.x[i] = Math.random() * w;
    p.y[i] = h + Math.random() * 20; // start just below bottom
    // Use 5-color palette (including white-hot) when size multiplier > 1.5
    p.colorIdx[i] = Math.floor(Math.random() * (sm > 1.5 ? 5 : 4));

    if (kind === 0) {
      // Ember
      p.size[i] = (2 + Math.random() * 5) * sm;
      p.vy[i] = -(cfg.emberSpeedMin + Math.random() * (cfg.emberSpeedMax - cfg.emberSpeedMin));
      p.vx[i] = (Math.random() - 0.5) * cfg.driftStrength * 0.5;
      p.maxLife[i] = 3 + Math.random() * 5;
      p.opacity[i] = sm > 1.2 ? 0.5 + Math.random() * 0.45 : 0.4 + Math.random() * 0.5;
    } else {
      // Flame
      p.size[i] = (12 + Math.random() * 20) * sm;
      p.vy[i] = -(cfg.flameSpeedMin + Math.random() * (cfg.flameSpeedMax - cfg.flameSpeedMin));
      p.vx[i] = (Math.random() - 0.5) * cfg.driftStrength * 0.3;
      p.maxLife[i] = 2 + Math.random() * 3;
      p.opacity[i] = sm > 1.2 ? 0.2 + Math.random() * 0.25 : 0.15 + Math.random() * 0.2;
    }
    p.life[i] = 0;
  }

  static decayMouse(mouse: MouseState, dt: number) {
    if (mouse.active) {
      mouse.strength = Math.min(1, mouse.strength + dt * 4.0);
    } else {
      mouse.strength = Math.max(0, mouse.strength - dt * 2.0);
    }
  }

  update(dt: number, width: number, height: number, mouse?: MouseState) {
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

      let attractX = 0;
      let attractY = 0;
      if (mouse && mouse.strength > 0) {
        const dx = mouse.x - p.x[i];
        const dy = mouse.y - p.y[i];
        const distSq = dx * dx + dy * dy;
        const radiusSq = 150 * 150;
        if (distSq < radiusSq && distSq > 1) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / 150) * 200 * mouse.strength;
          const nx = dx / dist;
          const ny = dy / dist;
          // Radial attraction + 30% tangential swirl
          attractX = nx * force + (-ny) * force * 0.3;
          attractY = ny * force + nx * force * 0.3;
        }
      }

      p.x[i] += (p.vx[i] + noiseX + jitterX + attractX) * dt;
      p.y[i] += (p.vy[i] + noiseY + jitterY + attractY) * dt;

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

export interface MouseState {
  x: number;
  y: number;
  active: boolean;
  strength: number; // 0..1, smoothed
}

export { EMBER_COLORS, FLAME_COLORS };
