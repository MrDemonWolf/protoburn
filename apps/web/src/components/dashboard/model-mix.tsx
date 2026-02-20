"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { PieChart } from "lucide-react";
import { Tooltip } from "@base-ui/react/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { trpc } from "@/utils/trpc";
import { calculateCost } from "@/lib/pricing";
import { cleanModelName } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEGMENT_COLORS = [
  "#00ACED",
  "#0B7CC1",
  "#F59E0B",
  "#8B5CF6",
  "#10B981",
  "#EF4444",
];

export function ModelMix({ className }: { className?: string }) {
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

  const mix = useMemo(() => {
    if (!data || data.length === 0) return null;

    const sorted = [...data].sort((a, b) => b.totalTokens - a.totalTokens);
    const total = sorted.reduce((s, m) => s + m.totalTokens, 0);
    if (total === 0) return null;

    let totalCost = 0;
    const segments = sorted.map((m, i) => {
      const cost = calculateCost(
        m.model,
        m.inputTokens,
        m.outputTokens,
        m.cacheCreationTokens,
        m.cacheReadTokens,
      );
      totalCost += cost;
      return {
        model: m.model,
        name: cleanModelName(m.model),
        tokens: m.totalTokens,
        percent: (m.totalTokens / total) * 100,
        cost,
        color: SEGMENT_COLORS[i % SEGMENT_COLORS.length]!,
      };
    });

    return {
      segments,
      dominant: segments[0]!.name,
      totalCost,
    };
  }, [data]);

  if (isLoading) {
    return (
      <Card
        size="sm"
        className={cn("md:w-fit md:shrink-0 md:min-w-[140px]", className)}
      >
        <CardContent className="py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <PieChart className="h-3.5 w-3.5 text-primary" />
            <span className="font-heading font-semibold">Model Mix</span>
          </div>
          <Skeleton className="h-5 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (!mix) {
    return (
      <Card
        size="sm"
        className={cn("md:w-fit md:shrink-0 md:min-w-[140px]", className)}
      >
        <CardContent className="py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <PieChart className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-heading font-semibold">Model Mix</span>
          </div>
          <p className="text-xs text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  // SVG donut math
  const size = 64;
  const radius = 24;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <Card
      size="sm"
      className={cn("md:w-fit md:shrink-0 md:min-w-[140px]", className)}
    >
      <CardContent className="py-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <PieChart className="h-3.5 w-3.5 text-primary" />
            <span className="font-heading font-semibold">Model Mix</span>
          </div>
          {/* Donut */}
          <div className="relative" style={{ width: size, height: size }}>
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              aria-hidden="true"
            >
              {mix.segments.map((seg) => {
                const dashLength = (seg.percent / 100) * circumference;
                const dashOffset = -offset;
                offset += dashLength;
                return (
                  <Tooltip.Root key={seg.model}>
                    <Tooltip.Trigger
                      render={
                        <circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          fill="none"
                          stroke={seg.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                          strokeDashoffset={dashOffset}
                          transform={`rotate(-90 ${size / 2} ${size / 2})`}
                          className="cursor-default"
                        />
                      }
                    />
                    <Tooltip.Portal>
                      <Tooltip.Positioner sideOffset={4} className="z-50">
                        <Tooltip.Popup className="rounded-xl bg-card px-2 py-1.5 text-[11px] leading-tight shadow-lg ring-1 ring-border">
                          <p className="font-semibold">{seg.name}</p>
                          <p className="text-muted-foreground">
                            {seg.percent.toFixed(1)}% · ${seg.cost.toFixed(2)}
                          </p>
                        </Tooltip.Popup>
                      </Tooltip.Positioner>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                );
              })}
            </svg>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[9px] font-bold leading-tight text-center max-w-[36px] truncate">
                {mix.dominant}
              </span>
            </div>
          </div>
          <AnimatedNumber
            value={`$${mix.totalCost.toFixed(2)}`}
            animateKey={animateKey}
            className="text-sm font-bold"
          />
          <span className="text-[10px] text-muted-foreground">all-time cost</span>
        </div>
      </CardContent>
    </Card>
  );
}
