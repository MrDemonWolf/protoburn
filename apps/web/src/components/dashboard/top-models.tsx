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
  { emoji: "\u{1F947}", label: "1st", color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20" },
  { emoji: "\u{1F948}", label: "2nd", color: "text-gray-400", bg: "bg-gray-400/10 border-gray-400/20" },
  { emoji: "\u{1F949}", label: "3rd", color: "text-amber-600", bg: "bg-amber-600/10 border-amber-600/20" },
];

export function TopModels() {
  const { data, isLoading } = useQuery(
    trpc.tokenUsage.byModel.queryOptions(),
  );

  if (isLoading) {
    return (
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Top Models</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
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
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-semibold">Top Models</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {models.map((model, index) => {
          const cost = calculateCost(model.model, model.inputTokens, model.outputTokens);
          const medal = MEDALS[index]!;
          return (
            <Card key={model.model} className={`border ${medal.bg}`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                  <span className="font-mono">{cleanModelName(model.model)}</span>
                  <span className="text-lg" title={medal.label}>{medal.emoji}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold">{formatNumber(model.totalTokens)}</div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>In: {formatNumber(model.inputTokens)}</span>
                  <span>Out: {formatNumber(model.outputTokens)}</span>
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  Cost: <span className="text-foreground">${cost.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
