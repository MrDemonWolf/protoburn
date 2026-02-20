"use client";

import { useEffect, useRef } from "react";
import { createWallpaperProgram, type WallpaperProgram } from "@/lib/wallpaper-shaders";

export function WallpaperCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const webglRef = useRef<{ gl: WebGL2RenderingContext; prog: WallpaperProgram } | null>(null);
  const darkRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check reduced motion preference
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = motionQuery.matches;

    // Detect dark mode
    darkRef.current = document.documentElement.classList.contains("dark");

    // Try WebGL2
    let gl: WebGL2RenderingContext | null = null;
    let prog: WallpaperProgram | null = null;

    try {
      gl = canvas.getContext("webgl2", { alpha: false, premultipliedAlpha: false });
      if (gl) {
        prog = createWallpaperProgram(gl);
        webglRef.current = { gl, prog };
      }
    } catch {
      gl = null;
      prog = null;
    }

    // If no WebGL2, show CSS fallback (the canvas hides, CSS gradient shows)
    if (!gl || !prog) {
      canvas.style.display = "none";
      return;
    }

    // Handle resize
    const dpr = window.devicePixelRatio || 1;
    let width = 0;
    let height = 0;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    startTimeRef.current = performance.now() / 1000;

    // Watch for theme changes via MutationObserver on <html> class
    const observer = new MutationObserver(() => {
      darkRef.current = document.documentElement.classList.contains("dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    function render(time: number) {
      if (!gl || !prog) return;

      const elapsed = time - startTimeRef.current;

      gl.viewport(0, 0, canvas!.width, canvas!.height);
      gl.useProgram(prog.program);
      gl.bindVertexArray(prog.vao);

      gl.uniform1f(prog.uniforms.u_time, prefersReducedMotion ? 0 : elapsed);
      gl.uniform2f(prog.uniforms.u_resolution, width, height);
      gl.uniform1f(prog.uniforms.u_dark, darkRef.current ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    if (prefersReducedMotion) {
      // Render single static frame
      render(startTimeRef.current);
      return () => {
        ro.disconnect();
        observer.disconnect();
      };
    }

    // Animation loop
    let running = true;

    function frame() {
      if (!running) return;
      const now = performance.now() / 1000;
      render(now);
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
        rafRef.current = requestAnimationFrame(frame);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      ro.disconnect();
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* WebGL animated wallpaper */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 h-full w-full"
        style={{ pointerEvents: "none" }}
      />
      {/* CSS fallback gradient (shown if WebGL canvas is hidden) */}
      <div
        className="fixed inset-0 z-0 wallpaper-fallback"
        style={{ pointerEvents: "none" }}
        aria-hidden="true"
      />
      <style>{`
        .wallpaper-fallback {
          display: none;
          background:
            radial-gradient(ellipse at 20% 50%, oklch(0.55 0.17 230 / 30%) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, oklch(0.78 0.12 280 / 25%) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, oklch(0.56 0.14 180 / 20%) 0%, transparent 50%),
            oklch(0.97 0.005 250);
        }
        :is(.dark) .wallpaper-fallback {
          background:
            radial-gradient(ellipse at 20% 50%, oklch(0.15 0.08 260 / 50%) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, oklch(0.15 0.1 300 / 40%) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, oklch(0.12 0.08 180 / 35%) 0%, transparent 50%),
            oklch(0.12 0.03 260);
        }
        canvas[style*="display: none"] + .wallpaper-fallback {
          display: block;
        }
      `}</style>
    </>
  );
}
