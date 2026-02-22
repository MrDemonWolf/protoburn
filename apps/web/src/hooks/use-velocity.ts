import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useTimeSeries } from "./use-time-series";
import { calculateVelocity, type VelocityResult } from "@/lib/velocity";

/**
 * Derives velocity client-side from timeSeries(14) and byModelMonthly(),
 * eliminating the need for the separate `velocity` API call.
 */
export function useVelocity() {
  const { data: timeSeriesData, isLoading: tsLoading } = useTimeSeries(14);
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );

  const isLoading = tsLoading || monthlyLoading;

  const data = useMemo((): VelocityResult | undefined => {
    if (!timeSeriesData || !monthlyData) return undefined;

    const dailyPoints = timeSeriesData.map((d) => ({
      date: d.date,
      totalTokens:
        d.inputTokens + d.outputTokens + d.cacheCreationTokens + d.cacheReadTokens,
    }));

    const monthlyTotal = monthlyData.models.reduce(
      (sum, m) => sum + m.totalTokens,
      0,
    );

    return calculateVelocity(dailyPoints, monthlyTotal, new Date());
  }, [timeSeriesData, monthlyData]);

  return { data, isLoading };
}
