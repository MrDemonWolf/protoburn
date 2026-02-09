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

function cleanModelName(model: string) {
  return model
    .replace(/^claude-/, "")
    .replace(/-\d{8}$/, "");
}

const RANK_LABELS = ["1st", "2nd", "3rd"];

export function TopModels() {
  const { data, isLoading } = trpc.tokenUsage.byModel.useQuery();

  if (isLoading) {
    return (
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
    );
  }

  type ModelData = { model: string; inputTokens: number; outputTokens: number; totalTokens: number };
  const models = (data ?? [] as ModelData[])
    .sort((a: ModelData, b: ModelData) => b.totalTokens - a.totalTokens)
    .slice(0, 3);

  if (models.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">Top Models</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {models.map((model: ModelData, index: number) => {
          const cost = calculateCost(model.model, model.inputTokens, model.outputTokens);
          return (
            <Card key={model.model}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                  <span className="font-mono">{cleanModelName(model.model)}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {RANK_LABELS[index]}
                  </span>
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
