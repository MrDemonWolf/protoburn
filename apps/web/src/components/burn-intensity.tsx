"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { getBurnTier, TIERS, type BurnTier } from "@/lib/burn-tiers";

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

export { getBurnTier } from "@/lib/burn-tiers";

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

type TierIntensity = "normal" | "inferno" | "meltdown";

function generateParticles(
  count: number,
  type: "ember" | "flame",
  intensity: TierIntensity = "normal",
): ParticleData[] {
  return Array.from({ length: count }, () => {
    const isMeltdown = intensity === "meltdown";
    const isInferno = intensity === "inferno";
    return {
      left: Math.random() * 100,
      size: isMeltdown
        ? type === "ember" ? 3 + Math.random() * 8 : 20 + Math.random() * 40
        : isInferno
          ? type === "ember" ? 2.5 + Math.random() * 6 : 16 + Math.random() * 24
          : type === "ember" ? 2 + Math.random() * 4 : 14 + Math.random() * 18,
      duration: isMeltdown
        ? type === "ember" ? 1.5 + Math.random() * 3 : 1.5 + Math.random() * 2.5
        : isInferno
          ? type === "ember" ? 3 + Math.random() * 5 : 2.5 + Math.random() * 3.5
          : type === "ember" ? 4 + Math.random() * 6 : 3 + Math.random() * 4,
      delay: isMeltdown ? Math.random() * 4 : Math.random() * 10,
      drift: isMeltdown ? (Math.random() - 0.5) * 150 : isInferno ? (Math.random() - 0.5) * 100 : (Math.random() - 0.5) * 80,
      opacity: isMeltdown
        ? type === "ember" ? 0.5 + Math.random() * 0.5 : 0.25 + Math.random() * 0.35
        : isInferno
          ? type === "ember" ? 0.4 + Math.random() * 0.5 : 0.15 + Math.random() * 0.25
          : type === "ember" ? 0.3 + Math.random() * 0.5 : 0.12 + Math.random() * 0.2,
      colorIndex: Math.floor(Math.random() * 4),
    };
  });
}

export function BurnIntensity() {
  const { enabled } = useBurnEnabled();

  const { data: monthly } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );

  const monthlyTokens = (monthly?.models ?? []).reduce(
    (sum, m) => sum + m.totalTokens,
    0,
  );

  const tier = useEffectiveTier(monthlyTokens);

  const isMeltdown = tier.isMeltdown ?? false;
  const isInferno = tier.isInferno ?? false;
  const intensity: TierIntensity = isMeltdown ? "meltdown" : isInferno ? "inferno" : "normal";
  const embers = useMemo(
    () => generateParticles(tier.embers, "ember", intensity),
    [tier.embers, intensity],
  );
  const flames = useMemo(
    () => generateParticles(tier.flames, "flame", intensity),
    [tier.flames, intensity],
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
          50% { opacity: 0.85; }
        }
        @keyframes meltdownVignette {
          0%, 100% {
            box-shadow: inset 0 0 100px 40px rgba(239,68,68,0.4), inset 0 0 250px 80px rgba(249,115,22,0.2);
          }
          50% {
            box-shadow: inset 0 0 150px 70px rgba(239,68,68,0.55), inset 0 0 350px 120px rgba(249,115,22,0.3);
          }
        }
        @keyframes infernoVignette {
          0%, 100% {
            box-shadow: inset 0 0 60px 20px rgba(239,68,68,0.15), inset 0 0 150px 40px rgba(249,115,22,0.08);
          }
          50% {
            box-shadow: inset 0 0 80px 30px rgba(239,68,68,0.22), inset 0 0 200px 60px rgba(249,115,22,0.12);
          }
        }
        @keyframes heatShimmer {
          0% { transform: translateX(0) scaleY(1); }
          25% { transform: translateX(2px) scaleY(1.01); }
          50% { transform: translateX(-1px) scaleY(0.99); }
          75% { transform: translateX(1px) scaleY(1.005); }
          100% { transform: translateX(0) scaleY(1); }
        }
        @keyframes warningFlash {
          0%, 45% { opacity: 1; }
          50%, 95% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes hazardMarch {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
        @keyframes beaconSweep {
          0% { transform: rotate(-30deg); opacity: 0.6; }
          50% { transform: rotate(30deg); opacity: 0.9; }
          100% { transform: rotate(-30deg); opacity: 0.6; }
        }
        @keyframes edgeStrobe {
          0%, 40% { opacity: 0.9; }
          50%, 90% { opacity: 0; }
          100% { opacity: 0.9; }
        }
        @keyframes scanlineScroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 4px; }
        }
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-1px, 1px); }
          20% { transform: translate(2px, -1px); }
          30% { transform: translate(-1px, -1px); }
          40% { transform: translate(1px, 2px); }
          50% { transform: translate(-2px, 0px); }
          60% { transform: translate(1px, -1px); }
          70% { transform: translate(-1px, 1px); }
          80% { transform: translate(2px, 1px); }
          90% { transform: translate(0px, -2px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .burn-intensity * {
            animation: none !important;
          }
          .burn-intensity .meltdown-warning-text {
            display: none !important;
          }
        }
      `}</style>
      <div
        className="burn-intensity fixed inset-0 pointer-events-none z-10 overflow-hidden"
        style={isMeltdown ? { animation: "screenShake 0.15s linear infinite" } : undefined}
      >
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
                top: isMeltdown ? "0" : isInferno ? "20%" : "50%",
                width: tier.sideGlowWidth,
                background: isMeltdown
                  ? "linear-gradient(to right, rgba(239,68,68,0.35), rgba(249,115,22,0.12), transparent)"
                  : isInferno
                    ? "linear-gradient(to right, rgba(239,68,68,0.2), rgba(249,115,22,0.08), transparent)"
                    : "linear-gradient(to right, rgba(249,115,22,0.15), transparent)",
                opacity: tier.glowOpacity * 0.7,
              }}
            />
            <div
              className="absolute bottom-0 right-0 transition-opacity duration-1000"
              style={{
                top: isMeltdown ? "0" : isInferno ? "20%" : "50%",
                width: tier.sideGlowWidth,
                background: isMeltdown
                  ? "linear-gradient(to left, rgba(239,68,68,0.35), rgba(249,115,22,0.12), transparent)"
                  : isInferno
                    ? "linear-gradient(to left, rgba(239,68,68,0.2), rgba(249,115,22,0.08), transparent)"
                    : "linear-gradient(to left, rgba(249,115,22,0.15), transparent)",
                opacity: tier.glowOpacity * 0.7,
              }}
            />
          </>
        )}

        {/* Top glow for inferno and meltdown */}
        {tier.topGlow && (
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              height: tier.topGlowHeight,
              background: isMeltdown
                ? "linear-gradient(to bottom, rgba(239,68,68,0.3), rgba(249,115,22,0.12), transparent)"
                : "linear-gradient(to bottom, rgba(239,68,68,0.18), rgba(249,115,22,0.06), transparent)",
              animation: `meltdownPulse ${isMeltdown ? "2s" : "4s"} ease-in-out infinite`,
            }}
          />
        )}

        {/* INFERNO: light pulsing vignette */}
        {isInferno && (
          <div
            className="absolute inset-0"
            style={{
              animation: "infernoVignette 3.5s ease-in-out infinite",
            }}
          />
        )}

        {/* MELTDOWN-ONLY: pulsing red vignette border (faster, more intense) */}
        {isMeltdown && (
          <div
            className="absolute inset-0"
            style={{
              animation: "meltdownVignette 1.2s ease-in-out infinite",
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

        {/* MELTDOWN-ONLY: flashing warning text */}
        {isMeltdown && (
          <div
            className="meltdown-warning-text absolute top-16 left-0 right-0 flex justify-center"
            style={{
              animation: "warningFlash 0.6s step-end infinite",
              zIndex: 1,
            }}
          >
            <span
              style={{
                color: "#ef4444",
                fontSize: "1.25rem",
                fontWeight: 900,
                letterSpacing: "0.15em",
                textShadow: "0 0 10px rgba(239,68,68,0.8), 0 0 30px rgba(239,68,68,0.4)",
                fontFamily: "monospace",
              }}
            >
              {"⚠ MELTDOWN ⚠"}
            </span>
          </div>
        )}

        {/* MELTDOWN-ONLY: hazard stripe bar top */}
        {isMeltdown && (
          <div
            className="absolute top-0 left-0 right-0"
            style={{
              height: "8px",
              background: "repeating-linear-gradient(-45deg, #facc15, #facc15 10px, #1a1a1a 10px, #1a1a1a 20px)",
              backgroundSize: "40px 8px",
              animation: "hazardMarch 0.5s linear infinite",
              opacity: 0.85,
            }}
          />
        )}

        {/* MELTDOWN-ONLY: hazard stripe bar bottom */}
        {isMeltdown && (
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: "8px",
              background: "repeating-linear-gradient(-45deg, #facc15, #facc15 10px, #1a1a1a 10px, #1a1a1a 20px)",
              backgroundSize: "40px 8px",
              animation: "hazardMarch 0.5s linear infinite",
              opacity: 0.85,
            }}
          />
        )}

        {/* MELTDOWN-ONLY: warning beacon light (left) */}
        {isMeltdown && (
          <div
            className="absolute"
            style={{
              bottom: 0,
              left: 0,
              width: "200px",
              height: "60vh",
              background: "linear-gradient(to top, rgba(239,68,68,0.25), transparent 70%)",
              transformOrigin: "bottom left",
              animation: "beaconSweep 2s ease-in-out infinite",
              filter: "blur(8px)",
            }}
          />
        )}

        {/* MELTDOWN-ONLY: warning beacon light (right) */}
        {isMeltdown && (
          <div
            className="absolute"
            style={{
              bottom: 0,
              right: 0,
              width: "200px",
              height: "60vh",
              background: "linear-gradient(to top, rgba(239,68,68,0.25), transparent 70%)",
              transformOrigin: "bottom right",
              animation: "beaconSweep 2s ease-in-out infinite reverse",
              filter: "blur(8px)",
            }}
          />
        )}

        {/* MELTDOWN-ONLY: edge strobe lines (left) */}
        {isMeltdown && (
          <div
            className="absolute left-0 top-0 bottom-0"
            style={{
              width: "4px",
              background: "rgba(239,68,68,0.8)",
              boxShadow: "0 0 12px 4px rgba(239,68,68,0.5)",
              animation: "edgeStrobe 0.3s step-end infinite",
            }}
          />
        )}

        {/* MELTDOWN-ONLY: edge strobe lines (right) */}
        {isMeltdown && (
          <div
            className="absolute right-0 top-0 bottom-0"
            style={{
              width: "4px",
              background: "rgba(239,68,68,0.8)",
              boxShadow: "0 0 12px 4px rgba(239,68,68,0.5)",
              animation: "edgeStrobe 0.3s step-end infinite 0.15s",
            }}
          />
        )}

        {/* MELTDOWN-ONLY: scanline overlay */}
        {isMeltdown && (
          <div
            className="absolute inset-0"
            style={{
              background: "repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)",
              backgroundSize: "100% 4px",
              animation: "scanlineScroll 0.2s linear infinite",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </>
  );
}

export function MeltdownShake({ children }: { children: ReactNode }) {
  const { enabled } = useBurnEnabled();

  const { data: monthly } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );

  const monthlyTokens = (monthly?.models ?? []).reduce(
    (sum, m) => sum + m.totalTokens,
    0,
  );

  const tier = useEffectiveTier(monthlyTokens);
  const isMeltdown = enabled && (tier.isMeltdown ?? false);

  return (
    <div
      className="flex flex-1 flex-col overflow-hidden"
      style={isMeltdown ? { animation: "screenShake 0.15s linear infinite" } : undefined}
    >
      {children}
    </div>
  );
}
