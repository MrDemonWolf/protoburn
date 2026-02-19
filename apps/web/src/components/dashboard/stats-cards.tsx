"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { Zap, ArrowDownToLine, ArrowUpFromLine, Flame, PenLine, BookOpen, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { trpc } from "@/utils/trpc";
import { calculateCost } from "@/lib/pricing";
import { formatNumber, getFireLevel } from "@/lib/format";
import { computeDelta } from "@/lib/comparison";
import { env } from "@protoburn/env/web";

function DeltaBadge({ current, previous, invertColor, monthLabel }: { current: number; previous: number; invertColor?: boolean; monthLabel?: string }) {
  const delta = computeDelta(current, previous);
  if (delta.direction === "flat") return null;

  // For cost: up = red (bad), down = green (good). invertColor flips this.
  const isPositive = invertColor ? delta.direction === "down" : delta.direction === "up";
  const colorClass = isPositive ? "text-emerald-500" : "text-red-500";
  const Icon = delta.direction === "up" ? TrendingUp : TrendingDown;

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${colorClass}`}>
      <Icon className="h-3 w-3" />
      {delta.label}
      {monthLabel && <span className="text-muted-foreground"> vs {monthLabel}</span>}
    </span>
  );
}

export function StatsCards({ compareMonth }: { compareMonth?: string | null }) {
  const { data: totals, isLoading: totalsLoading } = useQuery(
    trpc.tokenUsage.totals.queryOptions(),
  );
  const { data: monthly, isLoading: monthlyLoading } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );
  const { data: comparisonMonthly } = useQuery({
    ...trpc.tokenUsage.byModelMonthly.queryOptions({ month: compareMonth! }),
    enabled: !!compareMonth,
  });

  const isLoading = totalsLoading || monthlyLoading;

  const monthlyCost = (monthly?.models ?? []).reduce(
    (sum, m) => sum + calculateCost(m.model, m.inputTokens, m.outputTokens, m.cacheCreationTokens, m.cacheReadTokens),
    0,
  );

  const comparisonCost = compareMonth
    ? (comparisonMonthly?.models ?? []).reduce(
        (sum, m) => sum + calculateCost(m.model, m.inputTokens, m.outputTokens, m.cacheCreationTokens, m.cacheReadTokens),
        0,
      )
    : 0;

  // Aggregate comparison month token totals
  const comparisonTotals = compareMonth
    ? (comparisonMonthly?.models ?? []).reduce(
        (acc, m) => ({
          input: acc.input + m.inputTokens,
          output: acc.output + m.outputTokens,
          cacheCreation: acc.cacheCreation + m.cacheCreationTokens,
          cacheRead: acc.cacheRead + m.cacheReadTokens,
          total: acc.total + m.totalTokens,
        }),
        { input: 0, output: 0, cacheCreation: 0, cacheRead: 0, total: 0 },
      )
    : null;

  // Current month token totals
  const currentMonthTotals = (monthly?.models ?? []).reduce(
    (acc, m) => ({
      input: acc.input + m.inputTokens,
      output: acc.output + m.outputTokens,
      cacheCreation: acc.cacheCreation + m.cacheCreationTokens,
      cacheRead: acc.cacheRead + m.cacheReadTokens,
      total: acc.total + m.totalTokens,
    }),
    { input: 0, output: 0, cacheCreation: 0, cacheRead: 0, total: 0 },
  );

  const currentMonth = monthly?.month
    ? new Date(monthly.month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";

  const comparisonMonthLabel = compareMonth
    ? new Date(compareMonth + "-01").toLocaleDateString("en-US", { month: "short" })
    : "";

  const fire = getFireLevel(monthlyCost);

  // Track refetch cycles: when isFetching goes from >0 to 0, increment animateKey
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

  const breakdownCards = [
    {
      title: "Input Tokens",
      display: formatNumber(totals?.totalInput ?? 0),
      icon: ArrowDownToLine,
      iconClass: "text-primary",
      currentMonthly: currentMonthTotals.input,
      comparisonMonthly: comparisonTotals?.input ?? 0,
    },
    {
      title: "Output Tokens",
      display: formatNumber(totals?.totalOutput ?? 0),
      icon: ArrowUpFromLine,
      iconClass: "text-primary",
      currentMonthly: currentMonthTotals.output,
      comparisonMonthly: comparisonTotals?.output ?? 0,
    },
    {
      title: "Cache Write",
      display: formatNumber(totals?.totalCacheCreation ?? 0),
      icon: PenLine,
      iconClass: "text-amber-500",
      currentMonthly: currentMonthTotals.cacheCreation,
      comparisonMonthly: comparisonTotals?.cacheCreation ?? 0,
    },
    {
      title: "Cache Read",
      display: formatNumber(totals?.totalCacheRead ?? 0),
      icon: BookOpen,
      iconClass: "text-violet-500",
      currentMonthly: currentMonthTotals.cacheRead,
      comparisonMonthly: comparisonTotals?.cacheRead ?? 0,
    },
  ];

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Top row: Total Tokens + Est. Monthly Cost */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:gap-4">
        <Card size="sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-muted-foreground">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div>
                <AnimatedNumber value={formatNumber(totals?.totalTokens ?? 0)} animateKey={animateKey} className="text-lg font-bold sm:text-xl" />
                {compareMonth && comparisonTotals && (
                  <div className="mt-0.5">
                    <DeltaBadge current={currentMonthTotals.total} previous={comparisonTotals.total} monthLabel={comparisonMonthLabel} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <Card size="sm" className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-muted-foreground">
              Est. Monthly Cost
              {currentMonth && (
                <span className="ml-1 text-xs font-normal">({currentMonth})</span>
              )}
              <span className="ml-1 text-xs font-normal text-primary">({env.NEXT_PUBLIC_API_PLAN} plan)</span>
            </CardTitle>
            <div className="flex items-center">
              {Array.from({ length: fire.flames }).map((_, i) => (
                <Flame
                  key={i}
                  className={`h-4 w-4 ${fire.color} ${fire.animation}`}
                  style={{
                    marginLeft: i > 0 ? "-6px" : 0,
                    animationDelay: fire.animation ? `${i * 120}ms` : undefined,
                  }}
                />
              ))}
              {fire.flames === 0 && (
                <Flame className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div>
                <AnimatedNumber value={`$${monthlyCost.toFixed(2)}`} animateKey={animateKey} className="text-lg font-bold sm:text-xl" />
                {compareMonth && comparisonMonthly && (
                  <div className="mt-0.5">
                    <DeltaBadge current={monthlyCost} previous={comparisonCost} invertColor monthLabel={comparisonMonthLabel} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Bottom row: breakdown cards */}
      <div className="grid gap-3 grid-cols-2 md:gap-4 md:grid-cols-4">
        {breakdownCards.map((card) => (
          <Card size="sm" key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.iconClass}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <div>
                  <AnimatedNumber value={card.display} animateKey={animateKey} className="text-lg font-bold sm:text-xl" />
                  {compareMonth && comparisonTotals && (
                    <div className="mt-0.5">
                      <DeltaBadge current={card.currentMonthly} previous={card.comparisonMonthly} monthLabel={comparisonMonthLabel} />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
