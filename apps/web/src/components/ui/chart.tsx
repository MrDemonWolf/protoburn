"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  { label: string; color: string }
>;

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
}

export function ChartContainer({
  config,
  className,
  children,
  ...props
}: ChartContainerProps) {
  const style = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [`--color-${key}`, value.color]),
  ) as React.CSSProperties;

  return (
    <div className={cn("w-full", className)} style={style} {...props}>
      {children}
    </div>
  );
}

export function ChartTooltipContent({ payload, label }: any) {
  if (!payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function ChartLegendContent({ payload }: any) {
  if (!payload?.length) return null;
  return (
    <div className="flex gap-4 justify-center">
      {payload.map((entry: any) => (
        <div key={entry.value} className="flex items-center gap-1.5 text-sm">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
