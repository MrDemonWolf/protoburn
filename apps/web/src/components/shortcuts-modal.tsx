"use client";

import { BADGE_DEFINITIONS } from "@/lib/achievements";

const SHORTCUTS = [
  { key: "R", description: "Refresh data" },
  { key: "T", description: "Toggle theme" },
  { key: "F", description: "Toggle fire effects" },
  { key: "1–7", description: "Preview burn tier" },
  { key: "Esc", description: "Clear preview / close" },
  { key: "?", description: "Toggle this help" },
] as const;

const BADGE_CATEGORIES = [
  {
    label: "Token Milestones",
    ids: ["first-million", "ten-million", "hundred-million", "billion"],
  },
  {
    label: "Cache",
    ids: ["cache-champion", "big-saver", "mega-saver"],
  },
  {
    label: "Model & Spending",
    ids: ["model-explorer", "pro-burner", "max-burner", "ultra-burner"],
  },
  {
    label: "Burn Tier Progression",
    ids: ["spark-starter", "on-fire", "blazing-glory", "inferno-survivor", "meltdown", "beyond-meltdown"],
  },
] as const;

const BURN_TIERS = [
  { name: "Cold", threshold: "< 5M tokens", color: "text-muted-foreground" },
  { name: "Spark", threshold: "5M+", color: "text-amber-400" },
  { name: "Warm", threshold: "100M+", color: "text-amber-500" },
  { name: "Burning", threshold: "400M+", color: "text-orange-500" },
  { name: "Blazing", threshold: "1B+", color: "text-orange-600" },
  { name: "Inferno", threshold: "2B+", color: "text-red-500" },
  { name: "Meltdown", threshold: "3B+", color: "text-red-600" },
] as const;

const badgeMap = new Map(BADGE_DEFINITIONS.map((b) => [b.id, b]));

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md max-h-[80vh] overflow-y-auto rounded-3xl border border-[var(--glass-border)] bg-card/80 backdrop-blur-xl p-6 shadow-xl glass-specular"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Keyboard Shortcuts */}
        <h2 className="mb-4 font-heading text-lg font-semibold">Keyboard Shortcuts</h2>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{s.description}</span>
              <kbd className="rounded-lg border border-[var(--glass-border)] bg-card/50 backdrop-blur-sm px-2 py-0.5 font-mono text-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <hr className="my-5 border-[var(--glass-border)]" />

        {/* Achievements */}
        <h2 className="mb-3 font-heading text-lg font-semibold">Achievements</h2>
        <div className="space-y-3">
          {BADGE_CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {cat.label}
              </h3>
              <div className="space-y-1">
                {cat.ids.map((id) => {
                  const badge = badgeMap.get(id);
                  if (!badge) return null;
                  return (
                    <div key={id} className="flex items-start gap-2 text-sm">
                      <span className="shrink-0 text-base leading-5">{badge.emoji}</span>
                      <div>
                        <span className="font-medium">{badge.name}</span>
                        <span className="ml-1.5 text-muted-foreground">— {badge.requirement}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <hr className="my-5 border-[var(--glass-border)]" />

        {/* Burn Tiers */}
        <h2 className="mb-3 font-heading text-lg font-semibold">Burn Tiers</h2>
        <div className="space-y-1.5">
          {BURN_TIERS.map((tier) => (
            <div key={tier.name} className="flex items-center justify-between text-sm">
              <span className={`font-medium ${tier.color}`}>{tier.name}</span>
              <span className="text-muted-foreground">{tier.threshold}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Toggle fire effects with <kbd className="rounded-lg border border-[var(--glass-border)] bg-card/50 backdrop-blur-sm px-1 py-0.5 font-mono text-[10px]">F</kbd> or the flame button in the header.
        </p>
      </div>
    </div>
  );
}
