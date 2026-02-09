"use client";

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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
