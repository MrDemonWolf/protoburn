"use client";

<<<<<<< Updated upstream
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
=======
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
>>>>>>> Stashed changes

const chartConfig = {
  inputTokens: {
    label: "Input",
<<<<<<< Updated upstream
    color: "hsl(var(--chart-1))",
  },
  outputTokens: {
    label: "Output",
    color: "hsl(var(--chart-2))",
=======
    color: "#00ACED",
  },
  outputTokens: {
    label: "Output",
    color: "#0B7CC1",
>>>>>>> Stashed changes
  },
} satisfies ChartConfig;

export function UsageChart() {
<<<<<<< Updated upstream
  const { data, isLoading } = trpc.tokenUsage.timeSeries.useQuery();
=======
  const { data, isLoading } = useQuery(
    trpc.tokenUsage.timeSeries.queryOptions(),
  );
>>>>>>> Stashed changes

  return (
    <Card>
      <CardHeader>
<<<<<<< Updated upstream
        <CardTitle>Token Usage Over Time</CardTitle>
=======
        <CardTitle>Daily Token Usage</CardTitle>
>>>>>>> Stashed changes
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
<<<<<<< Updated upstream
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={data ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} />
              <YAxis fontSize={12} tickLine={false} />
              <Tooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="inputTokens"
                stackId="1"
                stroke="var(--color-inputTokens)"
                fill="var(--color-inputTokens)"
                fillOpacity={0.4}
              />
              <Area
                type="monotone"
                dataKey="outputTokens"
                stackId="1"
                stroke="var(--color-outputTokens)"
                fill="var(--color-outputTokens)"
                fillOpacity={0.4}
              />
            </AreaChart>
=======
        ) : !data?.length ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No data yet. Push usage data via the API.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
                />
                <YAxis
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                  }
                  tickLine={false}
                  axisLine={false}
                  width={48}
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
              </AreaChart>
            </ResponsiveContainer>
>>>>>>> Stashed changes
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
