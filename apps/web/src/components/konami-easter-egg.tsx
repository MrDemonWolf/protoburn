"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Flame } from "lucide-react";

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

const FIRE_COLORS = [
  "text-yellow-300",
  "text-yellow-400",
  "text-orange-400",
  "text-orange-500",
  "text-red-500",
  "text-red-600",
];

const GLOW_COLORS = [
  "drop-shadow-[0_0_12px_rgba(253,224,71,0.9)]",
  "drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]",
  "drop-shadow-[0_0_12px_rgba(249,115,22,0.9)]",
  "drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]",
];

function FireParticle({ wave }: { wave: number }) {
  const left = Math.random() * 100;
  const delay = Math.random() * 1.5;
  const size = 20 + Math.random() * 44;
  const duration = 1.5 + Math.random() * 2.5;
  const drift = (Math.random() - 0.5) * 200;
  const spin = (Math.random() - 0.5) * 720;
  const color = FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)];
  const glow = GLOW_COLORS[Math.floor(Math.random() * GLOW_COLORS.length)];
  // Stagger waves: later waves start later
  const waveDelay = wave * 0.8 + delay;

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: `${left}%`,
        bottom: `-${size}px`,
        animation: `fireRise ${duration}s ease-out ${waveDelay}s forwards`,
      }}
    >
      <Flame
        className={`${color} ${glow}`}
        style={{
          width: size,
          height: size,
          ["--drift" as string]: `${drift}px`,
          ["--spin" as string]: `${spin}deg`,
        }}
      />
    </div>
  );
}

function Ember({ delay }: { delay: number }) {
  const left = Math.random() * 100;
  const size = 3 + Math.random() * 6;
  const duration = 2 + Math.random() * 3;
  const drift = (Math.random() - 0.5) * 300;

  return (
    <div
      className="fixed pointer-events-none rounded-full bg-orange-400"
      style={{
        left: `${left}%`,
        bottom: "0px",
        width: size,
        height: size,
        boxShadow: "0 0 6px 2px rgba(251,191,36,0.8)",
        animation: `emberRise ${duration}s ease-out ${delay}s forwards`,
        ["--drift" as string]: `${drift}px`,
      }}
    />
  );
}

export function KonamiEasterEgg() {
  const [sequence, setSequence] = useState<string[]>([]);
  const [activated, setActivated] = useState(false);
  const [phase, setPhase] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (activated) return;

      const newSequence = [...sequence, e.key].slice(-KONAMI_CODE.length);
      setSequence(newSequence);

      if (
        newSequence.length === KONAMI_CODE.length &&
        newSequence.every((key, i) => key === KONAMI_CODE[i])
      ) {
        setActivated(true);
        setPhase(0);

        // Phase transitions for dramatic timing
        setTimeout(() => setPhase(1), 300);
        setTimeout(() => setPhase(2), 1200);
        setTimeout(() => setPhase(3), 2500);

        timerRef.current = setTimeout(() => {
          setActivated(false);
          setPhase(0);
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

  if (!activated) return null;

  return (
    <>
      <style>{`
        @keyframes fireRise {
          0% {
            transform: translateY(0) scale(0.5) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(-10vh) scale(1.2) rotate(5deg);
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-110vh) translateX(var(--drift, 0px)) scale(0.2) rotate(var(--spin, 30deg));
            opacity: 0;
          }
        }
        @keyframes emberRise {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(var(--drift, 0px)) scale(0);
            opacity: 0;
          }
        }
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
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
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
        {/* Wave 1: initial burst */}
        {Array.from({ length: 30 }).map((_, i) => (
          <FireParticle key={`w1-${i}`} wave={0} />
        ))}

        {/* Wave 2: bigger burst */}
        {phase >= 1 &&
          Array.from({ length: 40 }).map((_, i) => (
            <FireParticle key={`w2-${i}`} wave={1} />
          ))}

        {/* Wave 3: final inferno */}
        {phase >= 2 &&
          Array.from({ length: 50 }).map((_, i) => (
            <FireParticle key={`w3-${i}`} wave={2} />
          ))}

        {/* Embers throughout */}
        {Array.from({ length: 60 }).map((_, i) => (
          <Ember key={`e-${i}`} delay={Math.random() * 3} />
        ))}

        {/* Bottom fire glow */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-opacity duration-700"
          style={{
            height: "30vh",
            background:
              "linear-gradient(to top, rgba(249,115,22,0.4), rgba(239,68,68,0.15), transparent)",
            opacity: phase >= 1 ? 1 : 0,
          }}
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
              className="text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600"
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
