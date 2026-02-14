"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { Zap, ArrowDownToLine, ArrowUpFromLine, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { trpc } from "@/utils/trpc";
import { calculateCost } from "@/lib/pricing";
import { formatNumber, getFireLevel } from "@/lib/format";

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

  const cards = [
    {
      title: "Total Tokens",
      display: formatNumber(totals?.totalTokens ?? 0),
      icon: Zap,
      iconClass: "text-primary",
    },
    {
      title: "Input Tokens",
      display: formatNumber(totals?.totalInput ?? 0),
      icon: ArrowDownToLine,
      iconClass: "text-primary",
    },
    {
      title: "Output Tokens",
      display: formatNumber(totals?.totalOutput ?? 0),
      icon: ArrowUpFromLine,
      iconClass: "text-primary",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.iconClass}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <AnimatedNumber value={card.display} animateKey={animateKey} className="text-2xl font-bold" />
            )}
          </CardContent>
        </Card>
      ))}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Monthly Cost
            {currentMonth && (
              <span className="ml-1 text-xs font-normal">({currentMonth})</span>
            )}
          </CardTitle>
          <div className="flex items-center">
            {Array.from({ length: fire.flames }).map((_, i) => (
              <Flame
                key={i}
                className={`h-4 w-4 ${fire.color} ${fire.flames >= 8 ? "animate-pulse" : ""}`}
                style={{ marginLeft: i > 0 ? "-6px" : 0 }}
              />
            ))}
            {fire.flames === 0 && (
              <Flame className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <AnimatedNumber value={`$${monthlyCost.toFixed(2)}`} animateKey={animateKey} className="text-2xl font-bold" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
