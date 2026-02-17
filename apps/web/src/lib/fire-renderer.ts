import type { ParticlePool, TierConfig } from "./fire-engine";
import { EMBER_COLORS, FLAME_COLORS } from "./fire-engine";
import type { FireProgram } from "./fire-shaders";

// --- WebGL fire shader rendering ---

function vignetteTypeToFloat(type: TierConfig["vignetteType"]): number {
  switch (type) {
    case "blazing": return 1;
    case "inferno": return 2;
    case "meltdown": return 3;
    default: return 0;
  }
}

export function renderFireShader(
  gl: WebGL2RenderingContext,
  prog: FireProgram,
  config: TierConfig,
  time: number,
  width: number,
  height: number,
) {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(prog.program);
  gl.bindVertexArray(prog.vao);

  // Enable blending for transparent background
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const u = prog.uniforms;
  gl.uniform1f(u.u_time, time);
  gl.uniform2f(u.u_resolution, width, height);

  // Map TierConfig to shader uniforms
  gl.uniform1f(u.u_bottomHeight, config.bottomGlowHeight);
  gl.uniform1f(u.u_bottomIntensity, config.bottomGlowOpacity);
  gl.uniform1f(u.u_sideWidth, config.sideGlow ? config.sideGlowWidth : 0);
  gl.uniform1f(u.u_sideIntensity, config.sideGlow ? config.sideGlowOpacity : 0);
  gl.uniform1f(u.u_sideTop, config.sideGlowTop);
  gl.uniform1f(u.u_topHeight, config.topGlow ? config.topGlowHeight : 0);
  gl.uniform1f(u.u_topIntensity, config.topGlow ? config.topGlowOpacity : 0);
  gl.uniform1f(u.u_pulseSpeed, config.bottomGlowPulseSpeed);
  gl.uniform1f(u.u_heatShimmer, config.heatShimmer ? 1 : 0);
  gl.uniform1f(u.u_vignetteType, vignetteTypeToFloat(config.vignetteType));
  gl.uniform1f(u.u_vignetteIntensity, 1);

  // Draw fullscreen triangle (3 vertices, no buffer needed — vertex ID trick)
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  gl.bindVertexArray(null);
}

// --- Canvas 2D particle rendering ---

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  pool: ParticlePool,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < pool.count; i++) {
    if (pool.life[i] < 0) continue;

    const lifeRatio = pool.life[i] / pool.maxLife[i];
    let alpha = pool.opacity[i];
    if (lifeRatio < 0.1) alpha *= lifeRatio / 0.1;
    else if (lifeRatio > 0.85) alpha *= (1 - lifeRatio) / 0.15;

    if (alpha <= 0.01) continue;

    const x = pool.x[i];
    const y = pool.y[i];
    const size = pool.size[i] * (1 - lifeRatio * 0.3);

    if (pool.kind[i] === 0) {
      drawEmber(ctx, x, y, size, alpha, pool.colorIdx[i]);
    } else {
      drawFlame(ctx, x, y, size, alpha, pool.colorIdx[i]);
    }
  }

  ctx.restore();
}

// --- Canvas 2D fallback: full render (glows + particles) for no-WebGL ---

export function renderFallback(
  ctx: CanvasRenderingContext2D,
  pool: ParticlePool,
  config: TierConfig,
  time: number,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);

  // Bottom glow
  if (config.bottomGlowHeight > 0) {
    const glowH = config.bottomGlowHeight * height;
    let opacity = config.bottomGlowOpacity;
    if (config.bottomGlowPulseSpeed > 0) {
      const pulse = 0.7 + 0.3 * Math.sin(time * config.bottomGlowPulseSpeed);
      opacity *= pulse;
    }
    const grad = ctx.createLinearGradient(0, height, 0, height - glowH);
    const stops = config.glowColorStops;
    if (stops.length >= 2) {
      grad.addColorStop(0, `rgba(${stops[0].r},${stops[0].g},${stops[0].b},${stops[0].a * opacity / config.bottomGlowOpacity})`);
      grad.addColorStop(0.5, `rgba(${stops[1].r},${stops[1].g},${stops[1].b},${stops[1].a * opacity / config.bottomGlowOpacity})`);
      grad.addColorStop(1, "transparent");
    } else if (stops.length === 1) {
      grad.addColorStop(0, `rgba(${stops[0].r},${stops[0].g},${stops[0].b},${stops[0].a * opacity / config.bottomGlowOpacity})`);
      grad.addColorStop(1, "transparent");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, height - glowH, width, glowH);
  }

  // Side glows
  if (config.sideGlow) {
    let sideOpacity = config.sideGlowOpacity;
    if (config.sideGlowPulse) {
      sideOpacity *= 0.7 + 0.3 * Math.sin(time * (Math.PI * 2 / 3));
    }
    const sw = config.sideGlowWidth * width;
    const top = config.sideGlowTop * height;
    const lg = ctx.createLinearGradient(0, 0, sw, 0);
    lg.addColorStop(0, `rgba(249,115,22,${sideOpacity})`);
    lg.addColorStop(1, "transparent");
    ctx.fillStyle = lg;
    ctx.fillRect(0, top, sw, height - top);
    const rg = ctx.createLinearGradient(width, 0, width - sw, 0);
    rg.addColorStop(0, `rgba(249,115,22,${sideOpacity})`);
    rg.addColorStop(1, "transparent");
    ctx.fillStyle = rg;
    ctx.fillRect(width - sw, top, sw, height - top);
  }

  // Top glow
  if (config.topGlow) {
    const th = config.topGlowHeight * height;
    let topOpacity = config.topGlowOpacity;
    if (config.topGlowPulseSpeed > 0) {
      topOpacity *= 0.5 + 0.5 * Math.sin(time * config.topGlowPulseSpeed);
    }
    const tg = ctx.createLinearGradient(0, 0, 0, th);
    tg.addColorStop(0, `rgba(239,68,68,${topOpacity})`);
    tg.addColorStop(0.5, `rgba(249,115,22,${topOpacity * 0.4})`);
    tg.addColorStop(1, "transparent");
    ctx.fillStyle = tg;
    ctx.fillRect(0, 0, width, th);
  }

  // Vignette
  if (config.vignetteType !== "none") {
    drawVignette(ctx, config.vignetteType, time, width, height);
  }

  // Heat shimmer
  if (config.heatShimmer) {
    const shimmerH = 0.15 * height;
    const shimmerOpacity = 0.06 + 0.04 * Math.sin(time * 4);
    const sg = ctx.createLinearGradient(0, height, 0, height - shimmerH);
    sg.addColorStop(0, `rgba(249,115,22,${shimmerOpacity})`);
    sg.addColorStop(1, "transparent");
    ctx.fillStyle = sg;
    ctx.fillRect(0, height - shimmerH, width, shimmerH);
  }

  // Particles
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < pool.count; i++) {
    if (pool.life[i] < 0) continue;
    const lifeRatio = pool.life[i] / pool.maxLife[i];
    let alpha = pool.opacity[i];
    if (lifeRatio < 0.1) alpha *= lifeRatio / 0.1;
    else if (lifeRatio > 0.85) alpha *= (1 - lifeRatio) / 0.15;
    if (alpha <= 0.01) continue;
    const x = pool.x[i];
    const y = pool.y[i];
    const size = pool.size[i] * (1 - lifeRatio * 0.3);
    if (pool.kind[i] === 0) drawEmber(ctx, x, y, size, alpha, pool.colorIdx[i]);
    else drawFlame(ctx, x, y, size, alpha, pool.colorIdx[i]);
  }
  ctx.restore();
}

// --- Shared particle drawing helpers ---

function drawEmber(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number, alpha: number,
  colorIdx: number,
) {
  const c = EMBER_COLORS[colorIdx];
  const r = size;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
  grad.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${alpha})`);
  grad.addColorStop(0.4, `rgba(${c.r},${c.g},${c.b},${alpha * 0.6})`);
  grad.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
}

function drawFlame(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size: number, alpha: number,
  colorIdx: number,
) {
  const c = FLAME_COLORS[colorIdx];
  const rx = size * 0.5;
  const ry = size * 1.2;
  const cy = y - ry * 0.3;

  ctx.save();
  ctx.translate(x, cy);
  ctx.scale(1, ry / rx);

  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  grad.addColorStop(0, `rgba(255,255,240,${alpha * 0.8})`);
  grad.addColorStop(0.2, `rgba(${c.r},${c.g},${c.b},${alpha * 0.6})`);
  grad.addColorStop(0.6, `rgba(${c.r},${c.g},${c.b},${alpha * 0.3})`);
  grad.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawVignette(
  ctx: CanvasRenderingContext2D,
  type: "blazing" | "inferno" | "meltdown",
  time: number,
  width: number, height: number,
) {
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  let innerR: number;
  let color: string;
  let baseAlpha: number;

  switch (type) {
    case "meltdown": {
      const pulse = 0.4 + 0.15 * Math.sin(time * (Math.PI * 2 / 1.2));
      innerR = maxR * 0.3;
      baseAlpha = pulse;
      color = "239,68,68";
      break;
    }
    case "inferno": {
      const pulse = 0.12 + 0.06 * Math.sin(time * (Math.PI * 2 / 3.5));
      innerR = maxR * 0.5;
      baseAlpha = pulse;
      color = "239,68,68";
      break;
    }
    case "blazing": {
      const pulse = 0.06 + 0.04 * Math.sin(time * (Math.PI * 2 / 5));
      innerR = maxR * 0.55;
      baseAlpha = pulse;
      color = "249,115,22";
      break;
    }
  }

  const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, maxR);
  grad.addColorStop(0, "transparent");
  grad.addColorStop(1, `rgba(${color},${baseAlpha})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}
