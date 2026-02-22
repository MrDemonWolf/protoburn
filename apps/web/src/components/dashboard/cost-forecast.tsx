"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { trpc } from "@/utils/trpc";
import { calculateCost } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function CostForecast({ className }: { className?: string }) {
  const { data: velocityData, isLoading: velocityLoading } = useQuery(
    trpc.tokenUsage.velocity.queryOptions(),
  );
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );
  const { data: historyData, isLoading: historyLoading } = useQuery(
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

  const isLoading = velocityLoading || monthlyLoading || historyLoading;

  const forecast = useMemo(() => {
    if (!velocityData?.hasEnoughData || !monthlyData) return null;

    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();

    // Current month cost so far (actual, per-model)
    let currentCost = 0;
    for (const m of monthlyData.models) {
      currentCost += calculateCost(
        m.model,
        m.inputTokens,
        m.outputTokens,
        m.cacheCreationTokens,
        m.cacheReadTokens,
      );
    }

    // Project to end of month using linear extrapolation
    const projectedCost =
      dayOfMonth > 0 ? (currentCost / dayOfMonth) * daysInMonth : 0;

    // Past months' costs from history
    const monthCosts = new Map<string, number>();
    for (const row of historyData ?? []) {
      const prev = monthCosts.get(row.month) ?? 0;
      monthCosts.set(
        row.month,
        prev +
          calculateCost(
            row.model,
            row.inputTokens,
            row.outputTokens,
            row.cacheCreationTokens,
            row.cacheReadTokens,
          ),
      );
    }

    const sorted = [...monthCosts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-4);

    // Last month's cost
    const lastMonthKey = `${now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()}-${String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, "0")}`;
    const lastMonthCost = monthCosts.get(lastMonthKey) ?? 0;

    // Confidence
    let confidence: string;
    if (dayOfMonth <= 7) confidence = "Early estimate";
    else if (dayOfMonth <= 14) confidence = "Trending";
    else if (dayOfMonth <= 21) confidence = "Likely range";
    else if (dayOfMonth <= 27) confidence = "Near final";
    else confidence = "Almost final";

    // Color based on comparison
    let color: string;
    if (lastMonthCost === 0) {
      color = "text-foreground";
    } else {
      const ratio = projectedCost / lastMonthCost;
      if (ratio <= 1) color = "text-green-500";
      else if (ratio <= 1.5) color = "text-amber-500";
      else color = "text-red-500";
    }

    return {
      projectedCost,
      currentCost,
      pastMonths: sorted,
      lastMonthCost,
      confidence,
      color,
      dayOfMonth,
      daysInMonth,
    };
  }, [velocityData, monthlyData, historyData]);

  if (isLoading) {
    return (
      <Card
        size="sm"
        className={cn("", className)}
      >
        <CardContent className="py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5 text-green-500" />
            <span className="font-heading font-semibold">Cost Forecast</span>
            <InfoTooltip text="Projected end-of-month cost using linear extrapolation from your current burn rate. Color indicates cost trend vs. last month." />
          </div>
          <Skeleton className="h-5 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (!forecast) {
    return (
      <Card
        size="sm"
        className={cn("", className)}
      >
        <CardContent className="py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-heading font-semibold">Cost Forecast</span>
          </div>
          <p className="text-xs text-muted-foreground">Need more data</p>
        </CardContent>
      </Card>
    );
  }

  // Mini bar chart: past months + projected (dotted)
  const allCosts = [
    ...forecast.pastMonths.map(([, c]) => c),
    forecast.projectedCost,
  ];
  const maxCost = Math.max(...allCosts, 1);

  return (
    <Card
      size="sm"
      className={cn("", className)}
    >
      <CardContent className="py-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5 text-green-500" />
            <span className="font-heading font-semibold">Cost Forecast</span>
            <InfoTooltip text="Projected end-of-month cost using linear extrapolation from your current burn rate. Color indicates cost trend vs. last month." />
          </div>
          <AnimatedNumber
            value={`$${Math.ceil(forecast.projectedCost)}`}
            animateKey={animateKey}
            className={cn("text-lg font-bold", forecast.color)}
          />
          <div className="flex items-end gap-0.5 h-5">
            {forecast.pastMonths.map(([month, cost]) => (
              <div
                key={month}
                className="w-2.5 rounded-sm bg-primary/40"
                style={{
                  height: `${Math.max((cost / maxCost) * 100, 8)}%`,
                }}
              />
            ))}
            <div
              className="w-2.5 rounded-sm border border-dashed border-primary bg-primary/20"
              style={{
                height: `${Math.max((forecast.projectedCost / maxCost) * 100, 8)}%`,
              }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {forecast.confidence}
            <span className="ml-1 text-[10px]">
              (day {forecast.dayOfMonth}/{forecast.daysInMonth})
            </span>
          </div>
          {forecast.lastMonthCost > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Last:</span>
              <AnimatedNumber
                value={`$${Math.ceil(forecast.lastMonthCost)}`}
                animateKey={animateKey}
                className="text-xs font-semibold"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
