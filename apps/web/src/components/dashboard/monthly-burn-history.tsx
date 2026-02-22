"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { trpc } from "@/utils/trpc";
import { formatNumber } from "@/lib/format";
import { getBurnTier } from "@/lib/burn-tiers";
import { cn } from "@/lib/utils";

const TIER_COLORS: Record<string, string> = {
  cold: "bg-muted",
  spark: "bg-blue-400",
  warm: "bg-blue-500",
  burning: "bg-orange-400",
  blazing: "bg-orange-500",
  inferno: "bg-red-500",
  meltdown: "bg-red-600",
};

export function MonthlyBurnHistory({ className }: { className?: string }) {
  const { data, isLoading } = useQuery(
    trpc.tokenUsage.monthlyHistory.queryOptions(),
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

  const months = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Aggregate by month
    const monthTotals = new Map<string, number>();
    for (const row of data) {
      const prev = monthTotals.get(row.month) ?? 0;
      monthTotals.set(row.month, prev + row.totalTokens);
    }

    const sorted = [...monthTotals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8);

    if (sorted.length < 2) return null;

    // Month-over-month delta
    const current = sorted[sorted.length - 1]![1];
    const previous = sorted[sorted.length - 2]![1];
    const delta = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return {
      bars: sorted.map(([month, tokens]) => ({
        month,
        tokens,
        tier: getBurnTier(tokens).name,
        label: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
        }),
      })),
      delta,
      currentMonth: sorted[sorted.length - 1]![0],
    };
  }, [data]);

  if (isLoading) {
    return (
      <Card
        size="sm"
        className={cn("", className)}
      >
        <CardContent className="py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span className="font-heading font-semibold">Monthly Burn</span>
            <InfoTooltip text="Token usage per month over the last 8 months. Bar colors match burn tier intensity. Shows month-over-month change percentage." />
          </div>
          <Skeleton className="h-5 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (!months) {
    return (
      <Card
        size="sm"
        className={cn("", className)}
      >
        <CardContent className="py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-heading font-semibold">Monthly Burn</span>
          </div>
          <p className="text-xs text-muted-foreground">Need 2+ months</p>
        </CardContent>
      </Card>
    );
  }

  const maxTokens = Math.max(...months.bars.map((b) => b.tokens), 1);
  const deltaSign = months.delta >= 0 ? "+" : "";
  const deltaColor =
    months.delta > 10
      ? "text-red-500"
      : months.delta < -10
        ? "text-green-500"
        : "text-muted-foreground";

  return (
    <Card
      size="sm"
      className={cn("", className)}
    >
      <CardContent className="py-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span className="font-heading font-semibold">Monthly Burn</span>
            <InfoTooltip text="Token usage per month over the last 8 months. Bar colors match burn tier intensity. Shows month-over-month change percentage." />
          </div>
          {/* Mini bar chart */}
          <div className="flex items-end gap-0.5 h-8">
            {months.bars.map((bar) => (
              <div
                key={bar.month}
                className={cn(
                  "w-3 rounded-sm transition-all",
                  TIER_COLORS[bar.tier] ?? "bg-muted",
                  bar.month === months.currentMonth && "animate-pulse",
                )}
                style={{
                  height: `${Math.max((bar.tokens / maxTokens) * 100, 8)}%`,
                }}
                title={`${bar.label}: ${formatNumber(bar.tokens)}`}
              />
            ))}
          </div>
          {/* Month labels */}
          <div className="flex gap-0.5">
            {months.bars.map((bar) => (
              <span
                key={bar.month}
                className="w-3 text-center text-[8px] text-muted-foreground"
              >
                {bar.label.charAt(0)}
              </span>
            ))}
          </div>
          {/* MoM delta */}
          <AnimatedNumber
            value={`${deltaSign}${months.delta.toFixed(0)}% MoM`}
            animateKey={animateKey}
            className={cn("text-xs font-semibold", deltaColor)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
