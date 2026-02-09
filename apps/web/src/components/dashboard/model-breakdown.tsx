"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function ModelBreakdown() {
  const { data, isLoading } = useQuery(
    trpc.tokenUsage.byModel.queryOptions(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Per-Model Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground">No model data yet.</p>
        ) : (
          <div className="grid gap-3">
            {data.map((model) => {
              const inputPct =
                model.totalTokens > 0
                  ? (model.inputTokens / model.totalTokens) * 100
                  : 0;
              return (
                <div
                  key={model.model}
                  className="rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{model.model}</span>
                    <span className="text-sm font-mono text-muted-foreground">
                      {formatNumber(model.totalTokens)} total
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${inputPct}%`,
                        background:
                          "linear-gradient(90deg, #00ACED 0%, #0B7CC1 100%)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>Input: {formatNumber(model.inputTokens)}</span>
                    <span>Output: {formatNumber(model.outputTokens)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
