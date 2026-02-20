"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ReactNode;
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        {children}
      </div>
    </ChartContext.Provider>
  );
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, itemConfig]) => itemConfig.color,
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
[data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) =>
    itemConfig.color ? `  --color-${key}: ${itemConfig.color};` : null,
  )
  .filter(Boolean)
  .join("\n")}
}`,
      }}
    />
  );
};

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  hideLabel = false,
  showTotal = false,
  labelFormatter,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string | number;
  }>;
  label?: string;
  className?: string;
  hideLabel?: boolean;
  showTotal?: boolean;
  labelFormatter?: (label: string) => string;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  const total = showTotal
    ? payload.reduce((sum, item) => sum + (item.value ?? 0), 0)
    : 0;

  return (
    <div
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-xl border border-glass-border bg-card px-2.5 py-1.5 text-xs shadow-xl backdrop-blur-xl backdrop-saturate-[180%]",
        className,
      )}
    >
      {!hideLabel && (
        <div className="font-medium">
          {labelFormatter ? labelFormatter(label ?? "") : label}
        </div>
      )}
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = String(item.dataKey || item.name || "value");
          const itemConfig = config[key];
          return (
            <div
              key={key}
              className="flex w-full items-center gap-2"
            >
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex flex-1 justify-between leading-none">
                <span className="text-muted-foreground">
                  {itemConfig?.label || item.name}
                </span>
                {item.value !== undefined && (
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {item.value.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {showTotal && (
          <div className="flex w-full items-center gap-2 border-t border-border pt-1.5">
            <div className="h-2.5 w-2.5 shrink-0" />
            <div className="flex flex-1 justify-between leading-none">
              <span className="font-medium text-foreground">Total</span>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {total.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChartLegendContent({
  payload,
  className,
  verticalAlign = "bottom",
}: {
  payload?: Array<{
    value?: string;
    color?: string;
    dataKey?: string;
  }>;
  className?: string;
  verticalAlign?: "top" | "bottom";
}) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className,
      )}
    >
      {payload.map((item) => {
        const key = item.dataKey || item.value || "value";
        const itemConfig = config[key];
        return (
          <div key={item.value} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-muted-foreground">
              {itemConfig?.label || item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  ChartStyle,
  useChart,
};
