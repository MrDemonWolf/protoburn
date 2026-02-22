"use client";

import { Info } from "lucide-react";
import { Tooltip } from "@base-ui/react/tooltip";

export function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={
          <button
            type="button"
            className="ml-auto text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            aria-label="Info"
          >
            <Info className="h-3 w-3" />
          </button>
        }
      />
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={4} className="z-50">
          <Tooltip.Popup className="max-w-[220px] rounded-xl bg-card px-2.5 py-2 text-[11px] text-popover-foreground shadow-lg border border-[var(--glass-border)] backdrop-blur-xl backdrop-saturate-[180%] leading-relaxed">
            {text}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
