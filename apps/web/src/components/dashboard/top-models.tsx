"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { calculateCost } from "@/lib/pricing";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function cleanModelName(model: string) {
  return model
    .replace(/^claude-/, "")
    .replace(/-\d{8}$/, "");
}

const MEDALS = [
  { emoji: "\u{1F947}", label: "1st", bg: "bg-yellow-500/10 border-yellow-500/20" },
  { emoji: "\u{1F948}", label: "2nd", bg: "bg-gray-400/10 border-gray-400/20" },
  { emoji: "\u{1F949}", label: "3rd", bg: "bg-amber-600/10 border-amber-600/20" },
];

export function TopModels() {
  const { data, isLoading } = useQuery(
    trpc.tokenUsage.byModel.queryOptions(),
  );

  if (isLoading) {
    return (
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <h2 className="font-heading text-sm font-semibold tracking-tight">Top Models</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-3">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const models = [...(data ?? [])]
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .slice(0, 3);

  if (models.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-yellow-500" />
        <h2 className="font-heading text-sm font-semibold tracking-tight">Top Models</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {models.map((model, index) => {
          const cost = calculateCost(model.model, model.inputTokens, model.outputTokens);
          const medal = MEDALS[index]!;
          return (
            <Card key={model.model} className={`border ${medal.bg}`}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-bold tracking-tight">{cleanModelName(model.model)}</span>
                  <span className="text-base" title={medal.label}>{medal.emoji}</span>
                </div>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <div className="text-xl font-bold">{formatNumber(model.totalTokens)}</div>
                  <div className="font-heading text-sm font-bold">${cost.toFixed(2)}</div>
                </div>
                <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                  <span>In: {formatNumber(model.inputTokens)}</span>
                  <span>Out: {formatNumber(model.outputTokens)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
