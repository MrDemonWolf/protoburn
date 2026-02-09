"use client";

import { useQuery } from "@tanstack/react-query";
import { Zap, ArrowDownToLine, ArrowUpFromLine, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { calculateCost } from "@/lib/pricing";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function getFireLevel(cost: number): { flames: number; color: string } {
  if (cost >= 100) return { flames: 5, color: "text-red-500" };
  if (cost >= 50) return { flames: 4, color: "text-red-500" };
  if (cost >= 20) return { flames: 3, color: "text-orange-500" };
  if (cost >= 5) return { flames: 2, color: "text-orange-400" };
  if (cost > 0) return { flames: 1, color: "text-yellow-500" };
  return { flames: 0, color: "text-muted-foreground" };
}

export function StatsCards() {
  const { data: totals, isLoading: totalsLoading } = useQuery(
    trpc.tokenUsage.totals.queryOptions(),
  );
  const { data: monthly, isLoading: monthlyLoading } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );

  const isLoading = totalsLoading || monthlyLoading;

  const monthlyCost = (monthly?.models ?? []).reduce(
    (sum, m) => sum + calculateCost(m.model, m.inputTokens, m.outputTokens),
    0,
  );

  const currentMonth = monthly?.month
    ? new Date(monthly.month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";

  const fire = getFireLevel(monthlyCost);

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
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.iconClass}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{card.display}</div>
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
                className={`h-4 w-4 ${fire.color} ${fire.flames >= 4 ? "animate-pulse" : ""}`}
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
            <div className="text-2xl font-bold">${monthlyCost.toFixed(2)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
