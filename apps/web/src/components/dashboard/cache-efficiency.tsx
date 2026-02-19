"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import {
  Layers,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { SparkLine } from "@/components/ui/spark-line";
import { trpc } from "@/utils/trpc";
import { computeCacheAnalytics } from "@/lib/cache-analytics";

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up")
    return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
  if (trend === "down")
    return <TrendingDown className="h-3.5 w-3.5 text-orange-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function CacheEfficiency() {
  const { data: modelData, isLoading: modelsLoading } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );
  const { data: timeSeriesData, isLoading: timeSeriesLoading } = useQuery(
    trpc.tokenUsage.timeSeries.queryOptions({ days: 30 }),
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

  const isLoading = modelsLoading || timeSeriesLoading;

  if (isLoading) {
    return (
      <Card size="sm" className="md:w-fit md:shrink-0 md:min-w-[140px]">
        <CardContent className="py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="h-3.5 w-3.5 text-purple-500" />
            <span className="font-heading font-semibold">
              Cache Efficiency
            </span>
          </div>
          <Skeleton className="h-5 w-24" />
        </CardContent>
      </Card>
    );
  }

  const models = (modelData?.models ?? []).map((m) => ({
    model: m.model,
    cacheCreationTokens: m.cacheCreationTokens,
    cacheReadTokens: m.cacheReadTokens,
  }));

  const timeSeries = (timeSeriesData ?? []).map((d) => ({
    date: d.date,
    cacheCreationTokens: d.cacheCreationTokens,
    cacheReadTokens: d.cacheReadTokens,
  }));

  const analytics = computeCacheAnalytics(models, timeSeries);

  if (!analytics.hasCacheData) {
    return (
      <Card size="sm" className="md:w-fit md:shrink-0 md:min-w-[140px]">
        <CardContent className="py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-heading font-semibold">
              Cache Efficiency
            </span>
          </div>
          <p className="text-xs text-muted-foreground">No cache data yet</p>
        </CardContent>
      </Card>
    );
  }

  const ratioPercent = (analytics.hitRatio * 100).toFixed(1);

  return (
    <Card size="sm" className="md:w-fit md:shrink-0 md:min-w-[140px]">
      <CardContent className="py-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="h-3.5 w-3.5 text-purple-500" />
            <span className="font-heading font-semibold">
              Cache Efficiency
            </span>
          </div>
          <AnimatedNumber
            value={`${ratioPercent}%`}
            animateKey={animateKey}
            className="text-lg font-bold"
          />
          <SparkLine
            data={analytics.dailyRatios}
            width={80}
            height={20}
            className="text-purple-500"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Saved:</span>
            <AnimatedNumber
              value={`$${analytics.savings.toFixed(2)}`}
              animateKey={animateKey}
              className="text-xs font-semibold"
            />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendIcon trend={analytics.trend} />
            <span>
              {analytics.trend === "up"
                ? "improving"
                : analytics.trend === "down"
                  ? "declining"
                  : "stable"}
            </span>
          </div>
          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <Lightbulb className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-2">{analytics.tip}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
