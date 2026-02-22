"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Menu, X, RefreshCw, Flame, Volume2, VolumeX, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import { useBurnEnabled, useEffectiveTier } from "./burn-intensity";
import { useSoundEnabled } from "./sound-provider";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

const TIER_COLORS: Record<string, string> = {
  cold: "text-muted-foreground",
  spark: "text-yellow-500",
  warm: "text-orange-400",
  burning: "text-orange-500",
  blazing: "text-orange-600",
  inferno: "text-red-500",
  meltdown: "text-red-600",
};

export function MobileDrawer() {
  const { enabled, toggle } = useBurnEnabled();
  const { enabled: soundEnabled, toggle: toggleSound, engine: soundEngine } = useSoundEnabled();
  const { resolvedTheme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);

  const { data: monthly } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );

  const monthlyTokens = (monthly?.models ?? []).reduce(
    (sum, m) => sum + m.totalTokens,
    0,
  );
  const tier = useEffectiveTier(monthlyTokens);

  const handleRefresh = async () => {
    setRefreshing(true);
    soundEngine?.playClick();
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setRefreshing(false);
      setOpen(false);
    }, 600);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--glass-border)] bg-card/40 backdrop-blur-sm transition-colors hover:bg-accent md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4 text-muted-foreground" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity duration-200" />
        <Dialog.Popup className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col gap-1 border-l border-[var(--glass-border)] bg-card/80 p-4 backdrop-blur-xl transition-transform duration-200 data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
          <div className="flex items-center justify-between mb-4">
            <span className="font-heading text-sm font-bold">Menu</span>
            <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--glass-border)] bg-card/40 backdrop-blur-sm transition-colors hover:bg-accent">
              <X className="h-4 w-4 text-muted-foreground" />
            </Dialog.Close>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh data</span>
          </button>

          <button
            onClick={() => {
              toggle();
              setOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent"
          >
            <Flame className={`h-4 w-4 ${enabled ? (TIER_COLORS[tier.name] ?? "text-orange-500") : "text-muted-foreground"}`} />
            <span>Fire effects</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {enabled ? (tier.name !== "cold" ? <span className={`capitalize ${TIER_COLORS[tier.name]}`}>{tier.name}</span> : "On") : "Off"}
            </span>
          </button>

          <button
            onClick={() => {
              soundEngine?.ensureContext();
              toggleSound();
              setOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
            <span>Sound effects</span>
            <span className="ml-auto text-xs text-muted-foreground">{soundEnabled ? "On" : "Off"}</span>
          </button>

          <button
            onClick={() => {
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
              setOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent"
          >
            {resolvedTheme === "dark" ? (
              <Moon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Sun className="h-4 w-4 text-muted-foreground" />
            )}
            <span>Theme</span>
            <span className="ml-auto text-xs text-muted-foreground capitalize">{resolvedTheme}</span>
          </button>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
