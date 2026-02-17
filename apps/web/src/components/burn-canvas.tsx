"use client";

import { useEffect, useRef } from "react";
import type { BurnTier } from "@/lib/burn-tiers";
import { FireEngine, tierToConfig } from "@/lib/fire-engine";
import { renderFireShader, renderParticles, renderFallback } from "@/lib/fire-renderer";
import { createFireProgram, type FireProgram } from "@/lib/fire-shaders";

interface BurnCanvasProps {
  tier: BurnTier;
}

export function BurnCanvas({ tier }: BurnCanvasProps) {
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FireEngine | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const webglRef = useRef<{ gl: WebGL2RenderingContext; prog: FireProgram } | null>(null);
  const fallbackRef = useRef(false);

  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    const particleCanvas = particleCanvasRef.current;
    if (!glCanvas || !particleCanvas) return;

    // Check reduced motion preference
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = motionQuery.matches;

    const config = tierToConfig(tier);

    if (!engineRef.current) {
      engineRef.current = new FireEngine(config);
    } else {
      engineRef.current.configure(config);
    }
    const engine = engineRef.current;

    // Try WebGL2 for the fire shader
    let gl: WebGL2RenderingContext | null = null;
    let prog: FireProgram | null = null;
    let ctx2d: CanvasRenderingContext2D | null = null;

    if (!fallbackRef.current) {
      try {
        gl = glCanvas.getContext("webgl2", { alpha: true, premultipliedAlpha: false });
        if (gl) {
          prog = createFireProgram(gl);
          webglRef.current = { gl, prog };
        }
      } catch {
        gl = null;
        prog = null;
      }
    }

    const useWebGL = gl !== null && prog !== null;

    if (!useWebGL) {
      // Fallback: use the GL canvas as a 2D canvas for full rendering
      fallbackRef.current = true;
      ctx2d = glCanvas.getContext("2d", { alpha: true });
      if (!ctx2d) return;
    }

    // Particle canvas always uses 2D
    const particleCtx = useWebGL
      ? particleCanvas.getContext("2d", { alpha: true })
      : null;

    // Handle DPI scaling and resize
    const dpr = window.devicePixelRatio || 1;
    let width = 0;
    let height = 0;

    function resize() {
      if (!glCanvas || !particleCanvas) return;
      const rect = glCanvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      // Size both canvases
      glCanvas.width = width * dpr;
      glCanvas.height = height * dpr;
      particleCanvas.width = width * dpr;
      particleCanvas.height = height * dpr;

      if (useWebGL) {
        // WebGL handles viewport in render call
        particleCtx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      } else {
        ctx2d?.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }

    const ro = new ResizeObserver(resize);
    ro.observe(glCanvas);
    resize();

    // If reduced motion, render a single static frame
    if (prefersReducedMotion) {
      if (useWebGL && gl && prog) {
        renderFireShader(gl, prog, config, 0, width, height);
      } else if (ctx2d) {
        renderFallback(ctx2d, engine.getPool(), config, 0, width, height);
      }
      return () => {
        ro.disconnect();
      };
    }

    // Animation loop
    let running = true;
    lastTimeRef.current = performance.now();

    function frame(now: number) {
      if (!running) return;

      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      engine.update(dt, width, height);
      const engineConfig = engine.getConfig();
      const engineTime = engine.getTime();

      if (useWebGL && gl && prog) {
        // Layer 1: WebGL procedural fire
        renderFireShader(gl, prog, engineConfig, engineTime, width, height);
        // Layer 2: Canvas 2D particles on top
        if (particleCtx) {
          renderParticles(particleCtx, engine.getPool(), width, height);
        }
      } else if (ctx2d) {
        // Fallback: everything on one canvas
        renderFallback(ctx2d, engine.getPool(), engineConfig, engineTime, width, height);
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    // Pause when tab hidden
    function onVisibilityChange() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafRef.current);
      } else {
        running = true;
        lastTimeRef.current = performance.now();
        rafRef.current = requestAnimationFrame(frame);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      ro.disconnect();
    };
  }, [tier]);

  return (
    <>
      {/* Back layer: WebGL fire shader (or 2D fallback) */}
      <canvas
        ref={glCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
      />
      {/* Front layer: Canvas 2D particles (only used in WebGL mode) */}
      <canvas
        ref={particleCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
      />
    </>
  );
}
