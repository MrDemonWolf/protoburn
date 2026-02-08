"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

const chartConfig = {
  inputTokens: {
    label: "Input",
    color: "hsl(var(--chart-1))",
  },
  outputTokens: {
    label: "Output",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function UsageChart() {
  const { data, isLoading } = trpc.tokenUsage.timeSeries.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Usage Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
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
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
