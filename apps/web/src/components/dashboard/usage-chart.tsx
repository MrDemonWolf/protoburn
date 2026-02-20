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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { trpc } from "@/utils/trpc";

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

const LEGEND_ITEMS = [
  { key: "inputTokens", label: "Input", color: "#00ACED" },
  { key: "outputTokens", label: "Output", color: "#0B7CC1" },
  { key: "cacheCreationTokens", label: "Cache Write", color: "#F59E0B" },
  { key: "cacheReadTokens", label: "Cache Read", color: "#8B5CF6" },
] as const;

export function UsageChart() {
  const { data, isLoading } = useQuery(
    trpc.tokenUsage.timeSeries.queryOptions({ days: 7 }),
  );

  return (
    <Card className="flex min-h-[300px] flex-col">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <CardTitle>Usage Trend</CardTitle>
          <span className="text-xs text-muted-foreground">Last 7 days</span>
          <div className="ml-auto flex items-center gap-3">
            {LEGEND_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}80` }}
                />
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {isLoading ? (
          <Skeleton className="min-h-[120px] w-full flex-1" />
        ) : !data?.length ? (
          <div className="flex min-h-[120px] flex-1 items-center justify-center text-muted-foreground">
            No data yet. Push usage data via the API.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[120px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="fillInput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ACED" stopOpacity={0.45} />
                    <stop offset="60%" stopColor="#00ACED" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#00ACED" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillOutput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B7CC1" stopOpacity={0.4} />
                    <stop offset="60%" stopColor="#0B7CC1" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#0B7CC1" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillCacheWrite" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.45} />
                    <stop offset="60%" stopColor="#F59E0B" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="fillCacheRead" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.45} />
                    <stop offset="60%" stopColor="#8B5CF6" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
                  </linearGradient>
                  {/* Glow filters for stroke */}
                  <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feFlood floodColor="#00ACED" floodOpacity="0.6" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glowDarkBlue" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feFlood floodColor="#0B7CC1" floodOpacity="0.5" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feFlood floodColor="#F59E0B" floodOpacity="0.5" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feFlood floodColor="#8B5CF6" floodOpacity="0.5" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 6"
                  vertical={false}
                  stroke="var(--glass-border)"
                  strokeOpacity={0.5}
                />
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
                  dy={6}
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
                  dx={-4}
                />
                <Tooltip
                  content={
                    <ChartTooltipContent
                      showTotal
                      labelFormatter={(label: string) => {
                        const d = new Date(label + "T00:00:00");
                        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                      }}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="inputTokens"
                  stackId="1"
                  stroke="#00ACED"
                  fill="url(#fillInput)"
                  strokeWidth={2.5}
                  filter="url(#glowBlue)"
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                <Area
                  type="monotone"
                  dataKey="outputTokens"
                  stackId="1"
                  stroke="#0B7CC1"
                  fill="url(#fillOutput)"
                  strokeWidth={2}
                  filter="url(#glowDarkBlue)"
                  animationDuration={1400}
                  animationEasing="ease-out"
                />
                <Area
                  type="monotone"
                  dataKey="cacheCreationTokens"
                  stackId="1"
                  stroke="#F59E0B"
                  fill="url(#fillCacheWrite)"
                  strokeWidth={2}
                  filter="url(#glowAmber)"
                  animationDuration={1600}
                  animationEasing="ease-out"
                />
                <Area
                  type="monotone"
                  dataKey="cacheReadTokens"
                  stackId="1"
                  stroke="#8B5CF6"
                  fill="url(#fillCacheRead)"
                  strokeWidth={2}
                  filter="url(#glowPurple)"
                  animationDuration={1800}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
