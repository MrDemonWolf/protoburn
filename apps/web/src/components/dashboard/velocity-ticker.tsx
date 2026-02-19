"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { Gauge, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { SparkLine } from "@/components/ui/spark-line";
import { trpc } from "@/utils/trpc";
import { formatNumber } from "@/lib/format";

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up")
    return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
  if (trend === "down")
    return <TrendingDown className="h-3.5 w-3.5 text-orange-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
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
      <Card size="sm" className="md:w-fit md:shrink-0 md:min-w-[140px]">
        <CardContent className="py-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Gauge className="h-3.5 w-3.5 text-primary" />
            <span className="font-heading font-semibold">Token Velocity</span>
          </div>
          <Skeleton className="h-5 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.hasEnoughData) {
    return (
      <Card size="sm" className="md:w-fit md:shrink-0 md:min-w-[140px]">
        <CardContent className="py-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-heading font-semibold">Token Velocity</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Need 2+ active days
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
    <Card size="sm" className="md:w-fit md:shrink-0 md:min-w-[140px]">
      <CardContent className="py-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Gauge className="h-3.5 w-3.5 text-primary" />
            <span className="font-heading font-semibold">Token Velocity</span>
          </div>
          <AnimatedNumber
            value={`~${formatNumber(data.tokensPerHour)}/hr`}
            animateKey={animateKey}
            className="text-lg font-bold"
          />
          <SparkLine
            data={data.sparkData}
            width={80}
            height={20}
            className="text-primary"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Proj:</span>
            <AnimatedNumber
              value={`~${formatNumber(data.projectedMonthEnd)}`}
              animateKey={animateKey}
              className="text-xs font-semibold"
            />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>
              by {monthName} {lastDay}
            </span>
            <TrendIcon trend={data.trend} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
