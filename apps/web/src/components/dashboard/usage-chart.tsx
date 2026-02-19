"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { trpc } from "@/utils/trpc";
import { mergeMonthlyTimeSeries } from "@/lib/comparison";

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(y, m - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

const chartConfig = {
  inputTokens: {
    label: "Input",
    color: "#00ACED",
  },
  outputTokens: {
    label: "Output",
    color: "#0B7CC1",
  },
  cacheCreationTokens: {
    label: "Cache Write",
    color: "#F59E0B",
  },
  cacheReadTokens: {
    label: "Cache Read",
    color: "#8B5CF6",
  },
} satisfies ChartConfig;

const comparisonChartConfig = {
  ...chartConfig,
  cmp_inputTokens: {
    label: "Input (prev)",
    color: "#00ACED",
  },
  cmp_outputTokens: {
    label: "Output (prev)",
    color: "#0B7CC1",
  },
  cmp_cacheCreationTokens: {
    label: "CW (prev)",
    color: "#F59E0B",
  },
  cmp_cacheReadTokens: {
    label: "CR (prev)",
    color: "#8B5CF6",
  },
} satisfies ChartConfig;

export function UsageChart({ compareMonth }: { compareMonth?: string | null }) {
  const { data, isLoading } = useQuery(
    trpc.tokenUsage.timeSeries.queryOptions(),
  );

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: currentMonthlyData } = useQuery({
    ...trpc.tokenUsage.timeSeriesMonthly.queryOptions({ month: currentMonthStr }),
    enabled: !!compareMonth,
  });

  const { data: comparisonData } = useQuery({
    ...trpc.tokenUsage.timeSeriesMonthly.queryOptions({ month: compareMonth! }),
    enabled: !!compareMonth,
  });

  const isComparing = !!compareMonth && !!currentMonthlyData && !!comparisonData;

  const mergedData = isComparing
    ? mergeMonthlyTimeSeries(currentMonthlyData, comparisonData)
    : null;

  const title = isComparing
    ? `${formatMonthLabel(currentMonthStr)} vs ${formatMonthLabel(compareMonth!)}`
    : "Daily Token Usage";

  const activeConfig = isComparing ? comparisonChartConfig : chartConfig;

  return (
    <Card className="flex min-h-[250px] flex-col md:flex-1">
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {isLoading ? (
          <Skeleton className="min-h-[200px] w-full flex-1" />
        ) : isComparing && mergedData ? (
          <ChartContainer config={activeConfig} className="min-h-[200px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mergedData}>
                <defs>
                  <linearGradient id="fillInput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ACED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00ACED" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillOutput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B7CC1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0B7CC1" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillCacheWrite" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillCacheRead" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillCmpInput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ACED" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#00ACED" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillCmpOutput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B7CC1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0B7CC1" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillCmpCacheWrite" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillCmpCacheRead" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickFormatter={(v: number) => String(v)}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  tickFormatter={(v: number) =>
                    v >= 1_000_000_000 ? `${(v / 1_000_000_000).toFixed(0)}B`
                    : v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M`
                    : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K`
                    : String(v)
                  }
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  fontSize={11}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend content={<ChartLegendContent />} />
                {/* Comparison data (behind, dashed, lower opacity) */}
                <Area
                  type="monotone"
                  dataKey="cmp_inputTokens"
                  stackId="cmp"
                  stroke="#00ACED"
                  strokeOpacity={0.4}
                  strokeDasharray="4 4"
                  fill="url(#fillCmpInput)"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="cmp_outputTokens"
                  stackId="cmp"
                  stroke="#0B7CC1"
                  strokeOpacity={0.4}
                  strokeDasharray="4 4"
                  fill="url(#fillCmpOutput)"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="cmp_cacheCreationTokens"
                  stackId="cmp"
                  stroke="#F59E0B"
                  strokeOpacity={0.4}
                  strokeDasharray="4 4"
                  fill="url(#fillCmpCacheWrite)"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="cmp_cacheReadTokens"
                  stackId="cmp"
                  stroke="#8B5CF6"
                  strokeOpacity={0.4}
                  strokeDasharray="4 4"
                  fill="url(#fillCmpCacheRead)"
                  strokeWidth={1.5}
                />
                {/* Current month data (on top, solid) */}
                <Area
                  type="monotone"
                  dataKey="inputTokens"
                  stackId="1"
                  stroke="#00ACED"
                  fill="url(#fillInput)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="outputTokens"
                  stackId="1"
                  stroke="#0B7CC1"
                  fill="url(#fillOutput)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="cacheCreationTokens"
                  stackId="1"
                  stroke="#F59E0B"
                  fill="url(#fillCacheWrite)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="cacheReadTokens"
                  stackId="1"
                  stroke="#8B5CF6"
                  fill="url(#fillCacheRead)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : !data?.length ? (
          <div className="flex min-h-[200px] flex-1 items-center justify-center text-muted-foreground">
            No data yet. Push usage data via the API.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="fillInput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ACED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00ACED" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillOutput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B7CC1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0B7CC1" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillCacheWrite" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillCacheRead" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => {
                    const d = new Date(v + "T00:00:00");
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  tickFormatter={(v: number) =>
                    v >= 1_000_000_000 ? `${(v / 1_000_000_000).toFixed(0)}B`
                    : v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M`
                    : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K`
                    : String(v)
                  }
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  fontSize={11}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="inputTokens"
                  stackId="1"
                  stroke="#00ACED"
                  fill="url(#fillInput)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="outputTokens"
                  stackId="1"
                  stroke="#0B7CC1"
                  fill="url(#fillOutput)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="cacheCreationTokens"
                  stackId="1"
                  stroke="#F59E0B"
                  fill="url(#fillCacheWrite)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="cacheReadTokens"
                  stackId="1"
                  stroke="#8B5CF6"
                  fill="url(#fillCacheRead)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
