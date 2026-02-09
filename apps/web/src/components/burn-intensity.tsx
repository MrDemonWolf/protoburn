"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { trpc } from "@/utils/trpc";

// Context for toggle state
const BurnEnabledContext = createContext({ enabled: true, toggle: () => {} });

export function useBurnEnabled() {
  return useContext(BurnEnabledContext);
}

export function BurnEnabledProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("burn-enabled");
    return stored === null ? true : stored === "true";
  });

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("burn-enabled", String(next));
      return next;
    });
  };

  return (
    <BurnEnabledContext value={{ enabled, toggle }}>
      {children}
    </BurnEnabledContext>
  );
}

interface BurnTier {
  name: string;
  embers: number;
  flames: number;
  glowOpacity: number;
  glowHeight: string;
  sideGlow: boolean;
  isMeltdown?: boolean;
}

const TIERS: Record<string, BurnTier> = {
  meltdown: { name: "meltdown", embers: 70, flames: 40, glowOpacity: 0.8, glowHeight: "65vh", sideGlow: true, isMeltdown: true },
  inferno:  { name: "inferno",  embers: 15, flames: 8,  glowOpacity: 0.35, glowHeight: "20vh", sideGlow: true },
  blazing:  { name: "blazing",  embers: 12, flames: 6,  glowOpacity: 0.25, glowHeight: "15vh", sideGlow: true },
  burning:  { name: "burning",  embers: 8,  flames: 4,  glowOpacity: 0.18, glowHeight: "12vh", sideGlow: false },
  warm:     { name: "warm",     embers: 5,  flames: 0,  glowOpacity: 0.1,  glowHeight: "8vh",  sideGlow: false },
  spark:    { name: "spark",    embers: 3,  flames: 0,  glowOpacity: 0.05, glowHeight: "5vh",  sideGlow: false },
  cold:     { name: "cold",     embers: 0,  flames: 0,  glowOpacity: 0,    glowHeight: "0",    sideGlow: false },
};

export function getBurnTier(monthlyTokens: number): BurnTier {
  if (monthlyTokens >= 50_000_000) return TIERS.meltdown;
  if (monthlyTokens >= 10_000_000) return TIERS.inferno;
  if (monthlyTokens >= 5_000_000)  return TIERS.blazing;
  if (monthlyTokens >= 1_000_000)  return TIERS.burning;
  if (monthlyTokens >= 500_000)    return TIERS.warm;
  if (monthlyTokens >= 100_000)    return TIERS.spark;
  return TIERS.cold;
}

function getQueryParamTier(): BurnTier | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const override = params.get("flametier")?.toLowerCase();
  if (override && override in TIERS) return TIERS[override];
  return null;
}

export function useEffectiveTier(monthlyTokens: number): BurnTier {
  const override = useMemo(() => getQueryParamTier(), []);
  return override ?? getBurnTier(monthlyTokens);
}

const EMBER_COLORS = [
  "rgba(253, 224, 71, 0.8)",
  "rgba(251, 191, 36, 0.8)",
  "rgba(249, 115, 22, 0.7)",
  "rgba(239, 68, 68, 0.6)",
];

const FLAME_CLASSES = [
  "text-yellow-400",
  "text-orange-400",
  "text-orange-500",
  "text-red-500",
];

const FLAME_GLOWS = [
  "drop-shadow(0 0 8px rgba(253,224,71,0.6))",
  "drop-shadow(0 0 8px rgba(251,191,36,0.6))",
  "drop-shadow(0 0 8px rgba(249,115,22,0.6))",
  "drop-shadow(0 0 8px rgba(239,68,68,0.5))",
];

interface ParticleData {
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  opacity: number;
  colorIndex: number;
}

function generateParticles(
  count: number,
  type: "ember" | "flame",
  meltdown = false,
): ParticleData[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    size: meltdown
      ? type === "ember" ? 3 + Math.random() * 8 : 20 + Math.random() * 40
      : type === "ember" ? 2 + Math.random() * 4 : 14 + Math.random() * 18,
    duration: meltdown
      ? type === "ember" ? 2 + Math.random() * 4 : 2 + Math.random() * 3
      : type === "ember" ? 4 + Math.random() * 6 : 3 + Math.random() * 4,
    delay: meltdown ? Math.random() * 5 : Math.random() * 10,
    drift: meltdown ? (Math.random() - 0.5) * 150 : (Math.random() - 0.5) * 80,
    opacity: meltdown
      ? type === "ember" ? 0.5 + Math.random() * 0.5 : 0.25 + Math.random() * 0.35
      : type === "ember" ? 0.3 + Math.random() * 0.5 : 0.12 + Math.random() * 0.2,
    colorIndex: Math.floor(Math.random() * 4),
  }));
}

export function BurnIntensity() {
  const { enabled } = useBurnEnabled();

  const { data: monthly } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );

  const monthlyTokens = (monthly?.models ?? []).reduce(
    (sum, m) => sum + m.inputTokens + m.outputTokens,
    0,
  );

  const tier = useEffectiveTier(monthlyTokens);

  const isMeltdown = tier.isMeltdown ?? false;
  const embers = useMemo(
    () => generateParticles(tier.embers, "ember", isMeltdown),
    [tier.embers, isMeltdown],
  );
  const flames = useMemo(
    () => generateParticles(tier.flames, "flame", isMeltdown),
    [tier.flames, isMeltdown],
  );

  if (!enabled || tier.name === "cold") return null;

  return (
    <>
      <style>{`
        @keyframes ambientEmber {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          8% {
            opacity: var(--ember-opacity, 0.5);
          }
          85% {
            opacity: var(--ember-opacity, 0.5);
          }
          100% {
            transform: translateY(-100vh) translateX(var(--drift, 0px)) scale(0);
            opacity: 0;
          }
        }
        @keyframes ambientFlame {
          0% {
            transform: translateY(0) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: var(--flame-opacity, 0.2);
            transform: translateY(-3vh) scale(1) rotate(3deg);
          }
          80% {
            opacity: var(--flame-opacity, 0.2);
          }
          100% {
            transform: translateY(-35vh) translateX(var(--drift, 0px)) scale(0.2) rotate(-5deg);
            opacity: 0;
          }
        }
        @keyframes meltdownPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        @keyframes meltdownVignette {
          0%, 100% {
            box-shadow: inset 0 0 80px 30px rgba(239,68,68,0.3), inset 0 0 200px 60px rgba(249,115,22,0.15);
          }
          50% {
            box-shadow: inset 0 0 120px 50px rgba(239,68,68,0.45), inset 0 0 300px 100px rgba(249,115,22,0.25);
          }
        }
        @keyframes heatShimmer {
          0% { transform: translateX(0) scaleY(1); }
          25% { transform: translateX(2px) scaleY(1.01); }
          50% { transform: translateX(-1px) scaleY(0.99); }
          75% { transform: translateX(1px) scaleY(1.005); }
          100% { transform: translateX(0) scaleY(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .burn-intensity * {
            animation: none !important;
          }
        }
      `}</style>
      <div className="burn-intensity fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Floating embers */}
        {embers.map((p, i) => (
          <div
            key={`ember-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              bottom: `-${p.size}px`,
              width: p.size,
              height: p.size,
              backgroundColor: EMBER_COLORS[p.colorIndex],
              boxShadow: `0 0 ${p.size * 2}px ${p.size}px ${EMBER_COLORS[p.colorIndex]}`,
              animation: `ambientEmber ${p.duration}s ease-in-out ${p.delay}s infinite`,
              ["--drift" as string]: `${p.drift}px`,
              ["--ember-opacity" as string]: p.opacity,
            }}
          />
        ))}

        {/* Edge flames rising from bottom */}
        {flames.map((p, i) => (
          <div
            key={`flame-${i}`}
            className="absolute"
            style={{
              left: `${p.left}%`,
              bottom: `-${p.size / 2}px`,
              animation: `ambientFlame ${p.duration}s ease-in-out ${p.delay}s infinite`,
              ["--drift" as string]: `${p.drift}px`,
              ["--flame-opacity" as string]: p.opacity,
            }}
          >
            <Flame
              className={FLAME_CLASSES[p.colorIndex]}
              style={{
                width: p.size,
                height: p.size,
                filter: FLAME_GLOWS[p.colorIndex],
              }}
            />
          </div>
        ))}

        {/* Bottom glow gradient */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-opacity duration-1000"
          style={{
            height: tier.glowHeight,
            background:
              "linear-gradient(to top, rgba(249,115,22,0.4), rgba(239,68,68,0.15), transparent)",
            opacity: tier.glowOpacity,
          }}
        />

        {/* Side glows for higher tiers */}
        {tier.sideGlow && (
          <>
            <div
              className="absolute bottom-0 left-0 transition-opacity duration-1000"
              style={{
                top: isMeltdown ? "0" : "50%",
                width: isMeltdown ? "8vw" : "3vw",
                background: isMeltdown
                  ? "linear-gradient(to right, rgba(239,68,68,0.3), rgba(249,115,22,0.1), transparent)"
                  : "linear-gradient(to right, rgba(249,115,22,0.15), transparent)",
                opacity: tier.glowOpacity * 0.6,
              }}
            />
            <div
              className="absolute bottom-0 right-0 transition-opacity duration-1000"
              style={{
                top: isMeltdown ? "0" : "50%",
                width: isMeltdown ? "8vw" : "3vw",
                background: isMeltdown
                  ? "linear-gradient(to left, rgba(239,68,68,0.3), rgba(249,115,22,0.1), transparent)"
                  : "linear-gradient(to left, rgba(249,115,22,0.15), transparent)",
                opacity: tier.glowOpacity * 0.6,
              }}
            />
          </>
        )}

        {/* MELTDOWN-ONLY: pulsing red vignette border */}
        {isMeltdown && (
          <div
            className="absolute inset-0"
            style={{
              animation: "meltdownVignette 2s ease-in-out infinite",
            }}
          />
        )}

        {/* MELTDOWN-ONLY: top edge glow (fire everywhere) */}
        {isMeltdown && (
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              height: "15vh",
              background: "linear-gradient(to bottom, rgba(239,68,68,0.25), rgba(249,115,22,0.1), transparent)",
              animation: "meltdownPulse 3s ease-in-out infinite",
            }}
          />
        )}

        {/* MELTDOWN-ONLY: heat shimmer distortion at bottom */}
        {isMeltdown && (
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: "30vh",
              background: "linear-gradient(to top, rgba(249,115,22,0.15), transparent)",
              animation: "heatShimmer 0.8s ease-in-out infinite",
              filter: "blur(1px)",
            }}
          />
        )}
      </div>
    </>
  );
}
