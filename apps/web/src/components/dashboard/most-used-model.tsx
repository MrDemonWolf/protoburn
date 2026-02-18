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

export function MostUsedModel() {
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

  const topModel = [...(data ?? [])]
    .sort((a, b) => b.totalTokens - a.totalTokens)[0];

  if (isLoading) {
    return (
      <Card size="sm" className="md:w-fit md:shrink-0">
        <CardContent className="py-3">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!topModel) return null;

  const cost = calculateCost(
    topModel.model,
    topModel.inputTokens,
    topModel.outputTokens,
    topModel.cacheCreationTokens,
    topModel.cacheReadTokens,
  );

  return (
    <Card size="sm" className="md:w-fit md:shrink-0">
      <CardContent className="py-3">
        <div className="flex items-center gap-2">
          <Cpu className="size-4 text-primary" />
          <span className="text-xs text-muted-foreground">Most Used Model</span>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between gap-3">
          <span className="font-heading text-sm font-bold tracking-tight md:text-base">
            {cleanModelName(topModel.model)}
          </span>
          <AnimatedNumber
            value={`$${cost.toFixed(2)}`}
            animateKey={animateKey}
            className="font-heading text-sm font-bold shrink-0"
          />
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <AnimatedNumber
            value={formatNumber(topModel.totalTokens)}
            animateKey={animateKey}
            className="text-lg font-bold md:text-xl"
          />
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="flex">
              In:&nbsp;
              <AnimatedNumber
                value={formatNumber(topModel.inputTokens)}
                animateKey={animateKey}
                className="inline-flex"
              />
            </span>
            <span className="flex">
              Out:&nbsp;
              <AnimatedNumber
                value={formatNumber(topModel.outputTokens)}
                animateKey={animateKey}
                className="inline-flex"
              />
            </span>
            {topModel.cacheCreationTokens > 0 && (
              <span className="flex">
                CW:&nbsp;
                <AnimatedNumber
                  value={formatNumber(topModel.cacheCreationTokens)}
                  animateKey={animateKey}
                  className="inline-flex"
                />
              </span>
            )}
            {topModel.cacheReadTokens > 0 && (
              <span className="flex">
                CR:&nbsp;
                <AnimatedNumber
                  value={formatNumber(topModel.cacheReadTokens)}
                  animateKey={animateKey}
                  className="inline-flex"
                />
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
