"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function ModelBreakdown() {
  const { data, isLoading } = trpc.tokenUsage.byModel.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Per-Model Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const models = data ?? [];
  const maxTotal = Math.max(...models.map((m) => m.totalTokens), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Per-Model Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {models.length === 0 ? (
          <p className="text-muted-foreground text-sm">No data yet.</p>
        ) : (
          models.map((model) => (
            <div key={model.model} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono font-medium">{model.model}</span>
                <span className="text-muted-foreground">
                  {formatNumber(model.totalTokens)} total
                </span>
              </div>
              <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-muted">
                <div
                  className="bg-primary/80 rounded-l-full"
                  style={{
                    width: `${(model.inputTokens / maxTotal) * 100}%`,
                  }}
                />
                <div
                  className="bg-primary/40 rounded-r-full"
                  style={{
                    width: `${(model.outputTokens / maxTotal) * 100}%`,
                  }}
                />
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Input: {formatNumber(model.inputTokens)}</span>
                <span>Output: {formatNumber(model.outputTokens)}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
