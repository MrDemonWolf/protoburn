"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { SoundEngine } from "@/lib/sound-engine";
import { tierToSoundConfig } from "@/lib/sound-tiers";
import { useBurnEnabled, useEffectiveTier } from "./burn-intensity";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

interface SoundContextValue {
  enabled: boolean;
  toggle: () => void;
  volume: number;
  setVolume: (v: number) => void;
  engine: SoundEngine | null;
}

const SoundContext = createContext<SoundContextValue>({
  enabled: false,
  toggle: () => {},
  volume: 0.5,
  setVolume: () => {},
  engine: null,
});

export function useSoundEnabled() {
  return useContext(SoundContext);
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("sound-enabled");
    return stored === "true";
  });

  const [volume, setVolumeState] = useState(() => {
    if (typeof window === "undefined") return 0.5;
    const stored = localStorage.getItem("sound-volume");
    return stored ? parseFloat(stored) : 0.5;
  });

  const engineRef = useRef<SoundEngine | null>(null);
  const prevTierRef = useRef<string>("cold");

  const { enabled: burnEnabled } = useBurnEnabled();

  const { data: monthly } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );
  const monthlyTokens = (monthly?.models ?? []).reduce(
    (sum, m) => sum + m.totalTokens,
    0,
  );
  const tier = useEffectiveTier(monthlyTokens);

  // Lazy engine creation
  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      // Dynamic import at runtime to keep the module pure
      const { SoundEngine } = require("@/lib/sound-engine") as typeof import("@/lib/sound-engine");
      engineRef.current = new SoundEngine();
    }
    return engineRef.current;
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("sound-enabled", String(next));
      if (next) {
        const engine = getEngine();
        engine.ensureContext();
        engine.setVolume(volume);
      } else {
        engineRef.current?.stopAmbient();
      }
      return next;
    });
  }, [getEngine, volume]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    localStorage.setItem("sound-volume", String(clamped));
    engineRef.current?.setVolume(clamped);
  }, []);

  // Sync ambient layers with tier
  useEffect(() => {
    if (!enabled || !burnEnabled) {
      engineRef.current?.stopAmbient();
      return;
    }

    const engine = getEngine();
    const soundConfig = tierToSoundConfig(tier.name);
    engine.setTier(soundConfig);

    // Play transition sound if tier changed
    if (prevTierRef.current !== tier.name && prevTierRef.current !== "cold") {
      engine.playTierTransition(prevTierRef.current, tier.name);
    }
    prevTierRef.current = tier.name;
  }, [enabled, burnEnabled, tier.name, getEngine]);

  // Tab visibility: suspend/resume
  useEffect(() => {
    if (!enabled) return;

    function handleVisibility() {
      if (document.hidden) {
        engineRef.current?.suspend();
      } else {
        engineRef.current?.resume();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <SoundContext value={{ enabled, toggle, volume, setVolume, engine: enabled ? getEngine() : null }}>
      {children}
    </SoundContext>
  );
}
