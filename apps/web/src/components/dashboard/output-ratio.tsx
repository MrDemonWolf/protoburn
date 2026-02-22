"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { SparkLine } from "@/components/ui/spark-line";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";

interface PersonalityLabel {
  label: string;
  color: string;
}

function getPersonality(ratio: number): PersonalityLabel {
  if (ratio < 0.2) return { label: "Deep Listener", color: "text-blue-500" };
  if (ratio < 0.4) return { label: "Absorber", color: "text-cyan-500" };
  if (ratio < 0.6) return { label: "Balanced", color: "text-green-500" };
  if (ratio < 1.0) return { label: "Chatty", color: "text-amber-500" };
  if (ratio < 2.0) return { label: "Verbose", color: "text-orange-500" };
  return { label: "Monologue Mode", color: "text-red-500" };
}

export function OutputRatio({ className }: { className?: string }) {
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );
  const { data: timeSeriesData, isLoading: timeSeriesLoading } = useQuery(
    trpc.tokenUsage.timeSeries.queryOptions({ days: 14 }),
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

  const isLoading = monthlyLoading || timeSeriesLoading;

  const analysis = useMemo(() => {
    if (!monthlyData?.models?.length) return null;

    let totalInput = 0;
    let totalOutput = 0;
    for (const m of monthlyData.models) {
      totalInput += m.inputTokens + m.cacheCreationTokens + m.cacheReadTokens;
      totalOutput += m.outputTokens;
    }

    if (totalInput === 0) return null;

    const ratio = totalOutput / totalInput;
    const personality = getPersonality(ratio);

    // Daily ratios for sparkline
    const dailyRatios = (timeSeriesData ?? []).map((d) => {
      const inp =
        d.inputTokens + d.cacheCreationTokens + d.cacheReadTokens;
      return inp > 0 ? d.outputTokens / inp : 0;
    });

    return { ratio, personality, dailyRatios };
  }, [monthlyData, timeSeriesData]);

  if (isLoading) {
    return (
      <Card
        size="sm"
        className={cn("", className)}
      >
        <CardContent className="py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="font-heading font-semibold">Output Ratio</span>
            <InfoTooltip text="Ratio of output tokens to input tokens (including cache). Shows how verbose Claude's responses are relative to your prompts." />
          </div>
          <Skeleton className="h-5 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card
        size="sm"
        className={cn("", className)}
      >
        <CardContent className="py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-heading font-semibold">Output Ratio</span>
          </div>
          <p className="text-xs text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  // SVG semicircular gauge
  const gaugeRadius = 28;
  const gaugeStroke = 6;
  const cx = 35;
  const cy = 32;
  // Arc from 180° to 0° (left to right semicircle)
  const circumference = Math.PI * gaugeRadius;
  // Clamp ratio to 0-3 range for gauge display
  const clampedRatio = Math.min(analysis.ratio, 3);
  const fillPercent = clampedRatio / 3;
  const fillLength = fillPercent * circumference;

  // Needle angle: 180° (left) to 0° (right)
  const needleAngle = Math.PI * (1 - fillPercent);
  const needleX = cx + gaugeRadius * Math.cos(needleAngle);
  const needleY = cy - gaugeRadius * Math.sin(needleAngle);

  return (
    <Card
      size="sm"
      className={cn("", className)}
    >
      <CardContent className="py-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="font-heading font-semibold">Output Ratio</span>
            <InfoTooltip text="Ratio of output tokens to input tokens (including cache). Shows how verbose Claude's responses are relative to your prompts." />
          </div>
          {/* Gauge */}
          <svg
            width={70}
            height={38}
            viewBox="0 0 70 38"
            aria-hidden="true"
          >
            {/* Background arc */}
            <path
              d={`M ${cx - gaugeRadius} ${cy} A ${gaugeRadius} ${gaugeRadius} 0 0 1 ${cx + gaugeRadius} ${cy}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={gaugeStroke}
              className="text-muted"
              strokeLinecap="round"
            />
            {/* Fill arc */}
            <path
              d={`M ${cx - gaugeRadius} ${cy} A ${gaugeRadius} ${gaugeRadius} 0 0 1 ${cx + gaugeRadius} ${cy}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={gaugeStroke}
              className={analysis.personality.color}
              strokeLinecap="round"
              strokeDasharray={`${fillLength} ${circumference}`}
            />
            {/* Needle dot */}
            <circle cx={needleX} cy={needleY} r={3} fill="currentColor" className={analysis.personality.color} />
          </svg>
          <AnimatedNumber
            value={`${analysis.ratio.toFixed(2)}x`}
            animateKey={animateKey}
            className="text-lg font-bold"
          />
          <span
            className={cn(
              "text-xs font-semibold",
              analysis.personality.color,
            )}
          >
            {analysis.personality.label}
          </span>
          {analysis.dailyRatios.length > 1 && (
            <SparkLine
              data={analysis.dailyRatios}
              width={80}
              height={20}
              className="text-primary"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
