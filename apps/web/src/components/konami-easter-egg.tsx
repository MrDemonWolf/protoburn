"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Flame } from "lucide-react";
import { createFireProgram, type FireProgram } from "@/lib/fire-shaders";
import { renderFireShader, renderParticles, renderFallback } from "@/lib/fire-renderer";
import { FireEngine, tierToConfig, type TierConfig } from "@/lib/fire-engine";
import { TIERS } from "@/lib/burn-tiers";

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

// Configs for each phase of the easter egg, ramping up intensity
const PHASE_TIERS = [
  TIERS.spark,
  TIERS.blazing,
  TIERS.meltdown,
] as const;

export function KonamiEasterEgg() {
  const [sequence, setSequence] = useState<string[]>([]);
  const [activated, setActivated] = useState(false);
  const [phase, setPhase] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // WebGL refs
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const engineRef = useRef<FireEngine | null>(null);
  const webglRef = useRef<{ gl: WebGL2RenderingContext; prog: FireProgram } | null>(null);
  const phaseRef = useRef(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (activated) {
        if (e.key === "Escape") {
          if (timerRef.current) clearTimeout(timerRef.current);
          setActivated(false);
          setPhase(0);
          phaseRef.current = 0;
        }
        return;
      }

      const newSequence = [...sequence, e.key].slice(-KONAMI_CODE.length);
      setSequence(newSequence);

      if (
        newSequence.length === KONAMI_CODE.length &&
        newSequence.every((key, i) => key === KONAMI_CODE[i])
      ) {
        setActivated(true);
        setPhase(0);
        phaseRef.current = 0;

        // Phase transitions for dramatic timing
        setTimeout(() => { setPhase(1); phaseRef.current = 1; }, 300);
        setTimeout(() => { setPhase(2); phaseRef.current = 2; }, 1200);
        setTimeout(() => { setPhase(3); phaseRef.current = 3; }, 2500);

        timerRef.current = setTimeout(() => {
          setActivated(false);
          setPhase(0);
          phaseRef.current = 0;
        }, 5500);
        setSequence([]);
      }
    },
    [sequence, activated],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleKeyDown]);

  // WebGL fire animation when activated
  useEffect(() => {
    if (!activated) {
      // Cleanup on deactivation
      cancelAnimationFrame(rafRef.current);
      if (webglRef.current) {
        const { gl, prog } = webglRef.current;
        gl.deleteProgram(prog.program);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        webglRef.current = null;
      }
      engineRef.current = null;
      return;
    }

    const glCanvas = glCanvasRef.current;
    const particleCanvas = particleCanvasRef.current;
    if (!glCanvas || !particleCanvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    glCanvas.width = width * dpr;
    glCanvas.height = height * dpr;
    particleCanvas.width = width * dpr;
    particleCanvas.height = height * dpr;

    // Try WebGL2
    let gl: WebGL2RenderingContext | null = null;
    let prog: FireProgram | null = null;
    let ctx2d: CanvasRenderingContext2D | null = null;
    let particleCtx: CanvasRenderingContext2D | null = null;

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

    const useWebGL = gl !== null && prog !== null;

    if (!useWebGL) {
      ctx2d = glCanvas.getContext("2d", { alpha: true });
      if (!ctx2d) return;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    } else {
      particleCtx = particleCanvas.getContext("2d", { alpha: true });
      particleCtx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Start with spark config
    const initialConfig = tierToConfig(PHASE_TIERS[0]);
    engineRef.current = new FireEngine(initialConfig);
    const engine = engineRef.current;

    let lastTime = performance.now();

    function frame(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Update config based on current phase
      const currentPhase = phaseRef.current;
      let config: TierConfig;
      if (currentPhase >= 2) {
        config = tierToConfig(PHASE_TIERS[2]);
      } else if (currentPhase >= 1) {
        config = tierToConfig(PHASE_TIERS[1]);
      } else {
        config = tierToConfig(PHASE_TIERS[0]);
      }
      engine.configure(config);

      engine.update(dt, width, height);
      const engineConfig = engine.getConfig();
      const engineTime = engine.getTime();

      if (useWebGL && gl && prog) {
        renderFireShader(gl, prog, engineConfig, engineTime, width, height);
        if (particleCtx) {
          renderParticles(particleCtx, engine.getPool(), width, height);
        }
      } else if (ctx2d) {
        renderFallback(ctx2d, engine.getPool(), engineConfig, engineTime, width, height);
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [activated]);

  if (!activated) return null;

  return (
    <>
      <style>{`
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-3px, -2px); }
          20% { transform: translate(3px, 1px); }
          30% { transform: translate(-2px, 3px); }
          40% { transform: translate(2px, -2px); }
          50% { transform: translate(-3px, 2px); }
          60% { transform: translate(3px, -1px); }
          70% { transform: translate(-1px, -3px); }
          80% { transform: translate(2px, 2px); }
          90% { transform: translate(-2px, -1px); }
        }
        @keyframes titleSlam {
          0% {
            transform: scale(0) rotate(-10deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.3) rotate(2deg);
            opacity: 1;
          }
          80% {
            transform: scale(0.95) rotate(-1deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        @keyframes glowPulse {
          0%, 100% {
            text-shadow: 0 0 20px rgba(249,115,22,0.6), 0 0 40px rgba(249,115,22,0.3), 0 0 80px rgba(239,68,68,0.2);
          }
          50% {
            text-shadow: 0 0 40px rgba(249,115,22,0.9), 0 0 80px rgba(249,115,22,0.5), 0 0 120px rgba(239,68,68,0.4);
          }
        }
        .konami-shake {
          animation: screenShake 0.4s ease-in-out;
        }
      `}</style>
      <div
        className={`fixed inset-0 pointer-events-none z-50 overflow-hidden transition-colors duration-500 ${
          phase >= 1 ? "bg-black/40" : "bg-transparent"
        } ${phase >= 3 ? "opacity-0 transition-opacity duration-1000" : ""}`}
      >
        {/* WebGL fire canvas (back layer) */}
        <canvas
          ref={glCanvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: "none" }}
        />
        {/* Particle canvas (front layer) */}
        <canvas
          ref={particleCanvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: "none" }}
        />

        {/* Title slam */}
        {phase >= 1 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Flame
              className="text-orange-500"
              style={{
                width: 64,
                height: 64,
                animation: "titleSlam 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, glowPulse 1s ease-in-out infinite 0.6s",
                filter: "drop-shadow(0 0 30px rgba(249,115,22,0.8))",
              }}
            />
            <div
              className="text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600 md:text-5xl"
              style={{
                animation: "titleSlam 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both, glowPulse 1s ease-in-out infinite 0.75s",
                WebkitTextStroke: "1px rgba(249,115,22,0.3)",
              }}
            >
              PROTOBURN
            </div>
            <div
              className="text-sm font-medium tracking-[0.3em] text-orange-300/80"
              style={{
                animation: "titleSlam 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both",
              }}
            >
              EVERYTHING BURNS
            </div>
          </div>
        )}
      </div>
    </>
  );
}
