"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { Cpu, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { trpc } from "@/utils/trpc";
import { calculateCost } from "@/lib/pricing";
import { formatNumber, cleanModelName } from "@/lib/format";
import { computeRankChange } from "@/lib/comparison";

const MEDALS = ["🥇", "🥈", "🥉"] as const;

function RankBadge({ change }: { change: number | null }) {
  if (change === null) {
    return (
      <span className="ml-1 inline-flex items-center rounded bg-primary/15 px-1 py-0.5 text-[9px] font-bold leading-none text-primary">
        NEW
      </span>
    );
  }
  if (change === 0) return null;
  if (change > 0) {
    return (
      <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-500">
        <ArrowUp className="h-2.5 w-2.5" />
        {change}
      </span>
    );
  }
  return (
    <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-medium text-red-500">
      <ArrowDown className="h-2.5 w-2.5" />
      {Math.abs(change)}
    </span>
  );
}

export function MostUsedModel({ compareMonth }: { compareMonth?: string | null }) {
  const { data, isLoading } = useQuery(
    trpc.tokenUsage.byModel.queryOptions(),
  );

  const { data: currentMonthlyData } = useQuery({
    ...trpc.tokenUsage.byModelMonthly.queryOptions(),
    enabled: !!compareMonth,
  });

  const { data: comparisonData } = useQuery({
    ...trpc.tokenUsage.byModelMonthly.queryOptions({ month: compareMonth! }),
    enabled: !!compareMonth,
  });

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

  const isComparing = !!compareMonth && !!currentMonthlyData && !!comparisonData;

  // When comparing, use current month's data for apples-to-apples; otherwise use all-time
  const sourceData = isComparing ? currentMonthlyData.models : (data ?? []);

  const topModels = [...sourceData]
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .slice(0, 3);

  const rankChanges = isComparing
    ? computeRankChange(currentMonthlyData.models, comparisonData.models)
    : null;

  if (isLoading) {
    return (
      <Card size="sm" className="md:w-fit md:shrink-0 md:min-w-[180px]">
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
      <Card size="sm" className="md:w-fit md:shrink-0 md:min-w-[180px]">
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
    <Card size="sm" className="md:w-fit md:shrink-0">
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
            const rankChange = rankChanges?.get(model.model);

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
                  {rankChange !== undefined && <RankBadge change={rankChange?.change ?? null} />}
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
