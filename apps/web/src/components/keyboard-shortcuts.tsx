"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useKeyboardShortcuts, type ShortcutActions } from "@/hooks/use-keyboard-shortcuts";
import { useBurnEnabled } from "./burn-intensity";
import { ShortcutsModal } from "./shortcuts-modal";

const TIER_NAMES = ["cold", "spark", "warm", "burning", "blazing", "inferno", "meltdown"] as const;

export function KeyboardShortcuts() {
  const queryClient = useQueryClient();
  const { resolvedTheme, setTheme } = useTheme();
  const { toggle, tierOverride, setTierOverride } = useBurnEnabled();
  const [helpOpen, setHelpOpen] = useState(false);

  const actions: ShortcutActions = useMemo(
    () => ({
      onRefresh: () => queryClient.invalidateQueries(),
      onToggleTheme: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      onToggleFire: toggle,
      onPreviewTier: (n: number) => {
        const name = TIER_NAMES[n - 1];
        if (!name) return;
        setTierOverride(tierOverride === name ? null : name);
      },
      onToggleHelp: () => setHelpOpen((prev) => !prev),
      onEscape: () => {
        if (helpOpen) {
          setHelpOpen(false);
        } else if (tierOverride) {
          setTierOverride(null);
        }
      },
    }),
    [queryClient, resolvedTheme, setTheme, toggle, tierOverride, setTierOverride, helpOpen],
  );

  useKeyboardShortcuts(actions);

  return <ShortcutsModal open={helpOpen} onClose={() => setHelpOpen(false)} />;
}
