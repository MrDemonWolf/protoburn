"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { Gauge, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { SparkLine } from "@/components/ui/spark-line";
import { trpc } from "@/utils/trpc";
import { formatNumber } from "@/lib/format";

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up")
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === "down")
    return <TrendingDown className="h-4 w-4 text-orange-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export function VelocityTicker() {
  const { data, isLoading } = useQuery(
    trpc.tokenUsage.velocity.queryOptions(),
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-muted-foreground">
            Token Velocity
          </CardTitle>
          <Gauge className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-full max-w-xs" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.hasEnoughData) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-muted-foreground">
            Token Velocity
          </CardTitle>
          <Gauge className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Not enough data — need at least 2 active days
          </p>
        </CardContent>
      </Card>
    );
  }

  const monthEnd = new Date();
  const lastDay = new Date(
    monthEnd.getFullYear(),
    monthEnd.getMonth() + 1,
    0,
  ).getDate();
  const monthName = monthEnd.toLocaleDateString("en-US", { month: "short" });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-muted-foreground">Token Velocity</CardTitle>
        <Gauge className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          {/* Rate + sparkline */}
          <div className="flex items-center gap-3">
            <AnimatedNumber
              value={`~${formatNumber(data.tokensPerHour)}/hr`}
              animateKey={animateKey}
              className="text-lg font-bold sm:text-xl"
            />
            <SparkLine
              data={data.sparkData}
              width={80}
              height={24}
              className="text-primary"
            />
          </div>

          <span className="hidden text-muted-foreground sm:inline">|</span>

          {/* Projection + trend */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Projected:</span>
            <AnimatedNumber
              value={`~${formatNumber(data.projectedMonthEnd)}`}
              animateKey={animateKey}
              className="text-sm font-semibold"
            />
            <span className="text-sm text-muted-foreground">
              by {monthName} {lastDay}
            </span>
            <TrendIcon trend={data.trend} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
