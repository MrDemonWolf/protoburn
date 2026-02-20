"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { Cpu } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { trpc } from "@/utils/trpc";
import { calculateCost } from "@/lib/pricing";
import { formatNumber, cleanModelName } from "@/lib/format";
import { cn } from "@/lib/utils";

const MEDALS = ["🥇", "🥈", "🥉"] as const;

export function MostUsedModel({ className }: { className?: string }) {
  const { data, isLoading } = useQuery(
    trpc.tokenUsage.byModel.queryOptions(),
  );

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

  const topModels = [...(data ?? [])]
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .slice(0, 3);

  if (isLoading) {
    return (
      <Card size="sm" className={cn("md:w-fit md:shrink-0 md:min-w-[180px]", className)}>
        <CardContent className="py-3">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="size-4 text-primary" />
            <span className="text-xs text-muted-foreground">Top Models</span>
          </div>
          <Skeleton className="h-5 w-32 mb-1.5" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (topModels.length === 0) {
    return (
      <Card size="sm" className={cn("md:w-fit md:shrink-0 md:min-w-[180px]", className)}>
        <CardContent className="py-3">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Top Models</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">No usage data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm" className={cn("md:w-fit md:shrink-0", className)}>
      <CardContent className="py-3">
        <div className="flex items-center gap-2">
          <Cpu className="size-4 text-primary" />
          <span className="text-xs text-muted-foreground">Top Models</span>
        </div>
        <div className="mt-1.5 space-y-0">
          {topModels.map((model, i) => {
            const cost = calculateCost(
              model.model,
              model.inputTokens,
              model.outputTokens,
              model.cacheCreationTokens,
              model.cacheReadTokens,
            );
            const isFirst = i === 0;

            return (
              <div
                key={model.model}
                className={`flex items-baseline justify-between gap-4 ${
                  i > 0 ? "border-t border-border/50 pt-1.5 mt-1.5" : ""
                } ${!isFirst ? "text-muted-foreground" : ""}`}
              >
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className={isFirst ? "text-sm" : "text-xs"}>{MEDALS[i]}</span>
                  <span
                    className={`font-heading font-bold tracking-tight truncate ${
                      isFirst ? "text-sm md:text-base" : "text-xs"
                    }`}
                  >
                    {cleanModelName(model.model)}
                  </span>
                </div>
                <div className="flex items-baseline gap-3 shrink-0">
                  <AnimatedNumber
                    value={formatNumber(model.totalTokens)}
                    animateKey={animateKey}
                    className={`font-bold ${isFirst ? "text-base md:text-lg" : "text-sm"}`}
                  />
                  <AnimatedNumber
                    value={`$${cost.toFixed(2)}`}
                    animateKey={animateKey}
                    className={`font-heading font-bold shrink-0 ${
                      isFirst ? "text-sm" : "text-xs"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
