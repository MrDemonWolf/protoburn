"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { getBurnTier, TIERS, type BurnTier } from "@/lib/burn-tiers";
import { BurnCanvas } from "@/components/burn-canvas";

// Context for toggle state + tier override
const BurnEnabledContext = createContext({
  enabled: true,
  toggle: () => {},
  tierOverride: null as string | null,
  setTierOverride: (_tier: string | null) => {},
});

export function useBurnEnabled() {
  return useContext(BurnEnabledContext);
}

export function BurnEnabledProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("burn-enabled");
    return stored === null ? true : stored === "true";
  });

  const [tierOverride, setTierOverride] = useState<string | null>(null);

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("burn-enabled", String(next));
      return next;
    });
  };

  return (
    <BurnEnabledContext value={{ enabled, toggle, tierOverride, setTierOverride }}>
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
  const queryParamOverride = useMemo(() => getQueryParamTier(), []);
  const { tierOverride } = useBurnEnabled();
  const contextOverride = tierOverride && tierOverride in TIERS ? TIERS[tierOverride] : null;
  return queryParamOverride ?? contextOverride ?? getBurnTier(monthlyTokens);
}

function MeltdownOverlays() {
  return (
    <>
      {/* Flashing warning text */}
      <div
        className="meltdown-warning-text absolute top-12 left-0 right-0 flex justify-center md:top-16"
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

      {/* Hazard stripe bar top */}
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

      {/* Hazard stripe bar bottom */}
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

      {/* Warning beacon light (left) */}
      <div
        className="absolute"
        style={{
          bottom: 0,
          left: 0,
          width: "clamp(100px, 40vw, 200px)",
          height: "60vh",
          background: "linear-gradient(to top, rgba(239,68,68,0.25), transparent 70%)",
          transformOrigin: "bottom left",
          animation: "beaconSweep 2s ease-in-out infinite",
          filter: "blur(8px)",
        }}
      />

      {/* Warning beacon light (right) */}
      <div
        className="absolute"
        style={{
          bottom: 0,
          right: 0,
          width: "clamp(100px, 40vw, 200px)",
          height: "60vh",
          background: "linear-gradient(to top, rgba(239,68,68,0.25), transparent 70%)",
          transformOrigin: "bottom right",
          animation: "beaconSweep 2s ease-in-out infinite reverse",
          filter: "blur(8px)",
        }}
      />

      {/* Edge strobe lines (left) */}
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: "4px",
          background: "rgba(239,68,68,0.8)",
          boxShadow: "0 0 12px 4px rgba(239,68,68,0.5)",
          animation: "edgeStrobe 0.3s step-end infinite",
        }}
      />

      {/* Edge strobe lines (right) */}
      <div
        className="absolute right-0 top-0 bottom-0"
        style={{
          width: "4px",
          background: "rgba(239,68,68,0.8)",
          boxShadow: "0 0 12px 4px rgba(239,68,68,0.5)",
          animation: "edgeStrobe 0.3s step-end infinite 0.15s",
        }}
      />

      {/* Scanline overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)",
          backgroundSize: "100% 4px",
          animation: "scanlineScroll 0.2s linear infinite",
          pointerEvents: "none",
        }}
      />
    </>
  );
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

  if (!enabled || tier.name === "cold") return null;

  return (
    <>
      <style>{`
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
        {/* Canvas-based particle system replaces all ember/flame DOM nodes */}
        <BurnCanvas tier={tier} />

        {/* Meltdown-only DOM overlays */}
        {isMeltdown && <MeltdownOverlays />}
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
