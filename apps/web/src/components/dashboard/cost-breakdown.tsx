"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { trpc } from "@/utils/trpc";
import { getTier } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const SEGMENTS = [
  { key: "regular", label: "Regular", color: "#00ACED" },
  { key: "cached", label: "Cached", color: "#8B5CF6" },
] as const;

export function CostBreakdown({ className }: { className?: string }) {
  const { data, isLoading } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );

  const isFetching = useIsFetching();
  const wasFetchingRef = useRef(false);
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    if (isFetching > 0) {
      wasFetchingRef.current = true;
    } else if (wasFetchingRef.current) {
      wasFetchingRef.current = false;
      setAnimateKey((k) => k + 1);
    }
  }, [isFetching]);

  const { chartData, totalCost } = useMemo(() => {
    if (!data?.models?.length) return { chartData: [], totalCost: 0 };

    let regularCost = 0;
    let cachedCost = 0;

    for (const m of data.models) {
      const tier = getTier(m.model);
      regularCost += (m.inputTokens / 1_000_000) * tier.inputPerMillion;
      regularCost += (m.outputTokens / 1_000_000) * tier.outputPerMillion;
      cachedCost += (m.cacheCreationTokens / 1_000_000) * tier.cacheWritePerMillion;
      cachedCost += (m.cacheReadTokens / 1_000_000) * tier.cacheReadPerMillion;
    }

    const costs: Record<string, number> = {
      regular: regularCost,
      cached: cachedCost,
    };

    const entries = SEGMENTS
      .map((s) => ({ ...s, cost: costs[s.key]! }))
      .filter((e) => e.cost > 0);

    return {
      chartData: entries,
      totalCost: regularCost + cachedCost,
    };
  }, [data]);

  if (isLoading) {
    return (
      <Card size="sm" className={cn("", className)}>
        <CardContent className="py-3">
          <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
            <PieChartIcon className="h-3.5 w-3.5 text-primary" />
            <span className="font-heading font-semibold">Cost Split</span>
          </div>
          <Skeleton className="mx-auto h-16 w-16 rounded-full" />
          <Skeleton className="mt-2 h-4 w-12 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card size="sm" className={cn("", className)}>
        <CardContent className="py-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <PieChartIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-heading font-semibold">Cost Split</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">No cost data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm" className={cn("", className)}>
      <CardContent className="py-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <PieChartIcon className="h-3.5 w-3.5 text-primary" />
          <span className="font-heading font-semibold">Cost Split</span>
          <InfoTooltip text="Monthly cost split by token type: regular input/output vs cached (write/read). Shows where your spend goes." />
        </div>
        <div className="relative mx-auto mt-1 h-[72px] w-[72px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="cost"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={34}
                strokeWidth={1}
                stroke="var(--background)"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatedNumber
              value={`$${Math.ceil(totalCost)}`}
              animateKey={animateKey}
              className="text-[10px] font-bold"
            />
          </div>
        </div>
        <div className="mt-1 space-y-0.5">
          {chartData.map((entry) => (
            <div key={entry.key} className="flex items-center gap-1.5 text-[10px]">
              <span
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate text-muted-foreground">{entry.label}</span>
              <span className="ml-auto shrink-0 font-medium">${entry.cost.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
