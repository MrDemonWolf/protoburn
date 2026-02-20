"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { Zap, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { trpc } from "@/utils/trpc";
import { calculateCost } from "@/lib/pricing";
import { formatNumber, getFireLevel } from "@/lib/format";
import { env } from "@protoburn/env/web";

const breakdownItems = [
  { label: "Input", key: "totalInput" as const, dotClass: "bg-[#00ACED]" },
  { label: "Output", key: "totalOutput" as const, dotClass: "bg-[#0B7CC1]" },
  { label: "CW", key: "totalCacheCreation" as const, dotClass: "bg-amber-500" },
  { label: "CR", key: "totalCacheRead" as const, dotClass: "bg-violet-500" },
] as const;

export function StatsCards() {
  const { data: totals, isLoading: totalsLoading } = useQuery(
    trpc.tokenUsage.totals.queryOptions(),
  );
  const { data: monthly, isLoading: monthlyLoading } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );

  const isLoading = totalsLoading || monthlyLoading;

  const monthlyCost = (monthly?.models ?? []).reduce(
    (sum, m) => sum + calculateCost(m.model, m.inputTokens, m.outputTokens, m.cacheCreationTokens, m.cacheReadTokens),
    0,
  );

  const currentMonth = monthly?.month
    ? new Date(monthly.month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })
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

  return (
    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 sm:gap-3 md:gap-4">
      {/* Total Tokens + Breakdown combined */}
      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between pb-1">
          <CardTitle className="text-muted-foreground">Total Tokens</CardTitle>
          <Zap className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-7 w-full" />
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              <AnimatedNumber
                value={formatNumber(totals?.totalTokens ?? 0)}
                animateKey={animateKey}
                className="text-lg font-bold sm:text-xl shrink-0"
              />
              <div className="hidden sm:block h-8 w-px bg-border shrink-0" />
              <div className="hidden sm:grid grid-cols-2 gap-x-4 gap-y-0.5">
                {breakdownItems.map((item) => (
                  <div key={item.key} className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.dotClass}`} />
                    <span className="text-[10px] text-muted-foreground">{item.label}</span>
                    <AnimatedNumber
                      value={formatNumber(totals?.[item.key] ?? 0)}
                      animateKey={animateKey}
                      className="text-xs font-semibold"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Mobile breakdown: horizontal row below the total */}
          {!isLoading && (
            <div className="mt-2 grid grid-cols-4 gap-x-2 sm:hidden">
              {breakdownItems.map((item) => (
                <div key={item.key} className="flex items-center gap-1 min-w-0">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.dotClass}`} />
                  <div className="min-w-0">
                    <span className="text-[9px] leading-none text-muted-foreground">{item.label}</span>
                    <AnimatedNumber
                      value={formatNumber(totals?.[item.key] ?? 0)}
                      animateKey={animateKey}
                      className="block text-[11px] font-bold leading-tight"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Est. Monthly Cost */}
      <Card size="sm" className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-1">
          <CardTitle className="text-muted-foreground">
            Est. Monthly Cost
            {currentMonth && (
              <span className="ml-1 text-xs font-normal hidden sm:inline">({currentMonth})</span>
            )}
            {currentMonth && (
              <span className="ml-1 text-xs font-normal sm:hidden">
                ({new Date(monthly!.month + "-01").toLocaleDateString("en-US", { month: "short" })})
              </span>
            )}
            <span className="ml-1 text-xs font-normal text-primary hidden sm:inline">({env.NEXT_PUBLIC_API_PLAN} plan)</span>
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
            <AnimatedNumber value={`$${monthlyCost.toFixed(2)}`} animateKey={animateKey} className="text-lg font-bold sm:text-xl" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
