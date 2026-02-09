"use client";

<<<<<<< Updated upstream
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { calculateCost } from "@/lib/pricing";

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function StatsCards() {
  const { data: totals, isLoading: totalsLoading } = trpc.tokenUsage.totals.useQuery();
  const { data: byModel, isLoading: byModelLoading } = trpc.tokenUsage.byModel.useQuery();

  const isLoading = totalsLoading || byModelLoading;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalCost = (byModel ?? []).reduce(
    (sum: number, m: { model: string; inputTokens: number; outputTokens: number }) =>
      sum + calculateCost(m.model, m.inputTokens, m.outputTokens),
    0,
  );

  const stats = [
    { label: "Total Tokens", value: formatNumber(totals?.totalTokens ?? 0) },
    { label: "Input Tokens", value: formatNumber(totals?.totalInput ?? 0) },
    { label: "Output Tokens", value: formatNumber(totals?.totalOutput ?? 0) },
    { label: "Total Cost", value: `$${totalCost.toFixed(2)}` },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.value}
            </div>
=======
import { useQuery } from "@tanstack/react-query";
import { Zap, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function StatsCards() {
  const { data, isLoading } = useQuery(trpc.tokenUsage.totals.queryOptions());

  const cards = [
    {
      title: "Total Tokens",
      value: data?.totalTokens ?? 0,
      icon: Zap,
    },
    {
      title: "Input Tokens",
      value: data?.totalInput ?? 0,
      icon: ArrowDownToLine,
    },
    {
      title: "Output Tokens",
      value: data?.totalOutput ?? 0,
      icon: ArrowUpFromLine,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatNumber(card.value)}</div>
            )}
>>>>>>> Stashed changes
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
