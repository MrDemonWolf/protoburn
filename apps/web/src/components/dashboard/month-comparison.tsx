"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { ArrowLeftRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { trpc } from "@/utils/trpc";
import { calculateCost } from "@/lib/pricing";
import { formatNumber, cleanModelName } from "@/lib/format";
import { cn } from "@/lib/utils";

function getPrevMonth(): string {
  const now = new Date();
  const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const m = now.getMonth() === 0 ? 12 : now.getMonth();
  return `${y}-${String(m).padStart(2, "0")}`;
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  const color =
    pct > 10
      ? "bg-red-500/15 text-red-500"
      : pct < -10
        ? "bg-green-500/15 text-green-500"
        : "bg-muted text-muted-foreground";

  return (
    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", color)}>
      {sign}{pct.toFixed(0)}%
    </span>
  );
}

export function MonthComparison({ className }: { className?: string }) {
  const prevMonth = useMemo(() => getPrevMonth(), []);
  const { data: currentData, isLoading: currentLoading } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );
  const { data: prevData, isLoading: prevLoading } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions({ month: prevMonth }),
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

  const isLoading = currentLoading || prevLoading;

  const comparison = useMemo(() => {
    if (!currentData || !prevData) return null;

    function aggregate(models: NonNullable<typeof currentData>["models"]) {
      let tokens = 0;
      let cost = 0;
      let topModel = "";
      let topTokens = 0;
      for (const m of models) {
        tokens += m.totalTokens;
        cost += calculateCost(
          m.model,
          m.inputTokens,
          m.outputTokens,
          m.cacheCreationTokens,
          m.cacheReadTokens,
        );
        if (m.totalTokens > topTokens) {
          topTokens = m.totalTokens;
          topModel = cleanModelName(m.model);
        }
      }
      return { tokens, cost, topModel };
    }

    const curr = aggregate(currentData.models);
    const prev = aggregate(prevData.models);

    // Pace calculation: are we on track to exceed last month?
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const projectedTokens =
      dayOfMonth > 0 ? (curr.tokens / dayOfMonth) * daysInMonth : 0;
    const pacePercent =
      prev.tokens > 0 ? (projectedTokens / prev.tokens) * 100 : 0;

    const currentMonthLabel = new Date().toLocaleDateString("en-US", {
      month: "short",
    });
    const prevMonthLabel = new Date(prevMonth + "-01").toLocaleDateString(
      "en-US",
      { month: "short" },
    );

    return {
      curr,
      prev,
      pacePercent,
      currentMonthLabel,
      prevMonthLabel,
    };
  }, [currentData, prevData, prevMonth]);

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
            <span className="font-heading font-semibold">Month vs Month</span>
          </div>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!comparison || (comparison.curr.tokens === 0 && comparison.prev.tokens === 0)) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-heading font-semibold">Month vs Month</span>
          </div>
          <p className="text-xs text-muted-foreground">Need data in 2 months</p>
        </CardContent>
      </Card>
    );
  }

  const paceColor =
    comparison.pacePercent > 120
      ? "bg-red-500"
      : comparison.pacePercent > 100
        ? "bg-amber-500"
        : "bg-green-500";

  return (
    <Card className={cn("", className)}>
      <CardContent className="py-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
            <span className="font-heading font-semibold">Month vs Month</span>
          </div>
          {/* Two-column comparison */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 gap-y-1 text-xs">
            {/* Headers */}
            <span className="font-semibold text-muted-foreground">
              {comparison.prevMonthLabel}
            </span>
            <span />
            <span className="font-semibold text-muted-foreground text-right">
              {comparison.currentMonthLabel}
            </span>

            {/* Tokens */}
            <AnimatedNumber
              value={formatNumber(comparison.prev.tokens)}
              animateKey={animateKey}
              className="font-semibold"
            />
            <DeltaBadge
              current={comparison.curr.tokens}
              previous={comparison.prev.tokens}
            />
            <AnimatedNumber
              value={formatNumber(comparison.curr.tokens)}
              animateKey={animateKey}
              className="font-semibold text-right"
            />

            {/* Cost */}
            <AnimatedNumber
              value={`$${Math.ceil(comparison.prev.cost)}`}
              animateKey={animateKey}
              className="font-semibold"
            />
            <DeltaBadge
              current={comparison.curr.cost}
              previous={comparison.prev.cost}
            />
            <AnimatedNumber
              value={`$${Math.ceil(comparison.curr.cost)}`}
              animateKey={animateKey}
              className="font-semibold text-right"
            />

            {/* Top model */}
            <span className="text-muted-foreground truncate">
              {comparison.prev.topModel || "—"}
            </span>
            <span />
            <span className="text-muted-foreground text-right truncate">
              {comparison.curr.topModel || "—"}
            </span>
          </div>

          {/* Pace bar */}
          {comparison.prev.tokens > 0 && (
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Pace vs last month</span>
                <span>{Math.round(comparison.pacePercent)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", paceColor)}
                  style={{
                    width: `${Math.min(comparison.pacePercent, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
