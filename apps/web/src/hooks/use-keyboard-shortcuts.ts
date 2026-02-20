"use client";

import { useEffect } from "react";

export interface ShortcutActions {
  onRefresh: () => void;
  onToggleTheme: () => void;
  onToggleFire: () => void;
  onToggleSound: () => void;
  onPreviewTier: (tier: number) => void;
  onToggleHelp: () => void;
  onEscape: () => void;
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip when modifier keys are held
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Skip when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      switch (e.key) {
        case "r":
        case "R":
          e.preventDefault();
          actions.onRefresh();
          break;
        case "t":
        case "T":
          e.preventDefault();
          actions.onToggleTheme();
          break;
        case "f":
        case "F":
          e.preventDefault();
          actions.onToggleFire();
          break;
        case "s":
        case "S":
          e.preventDefault();
          actions.onToggleSound();
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
          e.preventDefault();
          actions.onPreviewTier(Number(e.key));
          break;
        case "?":
          e.preventDefault();
          actions.onToggleHelp();
          break;
        case "Escape":
          e.preventDefault();
          actions.onEscape();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions]);
}
