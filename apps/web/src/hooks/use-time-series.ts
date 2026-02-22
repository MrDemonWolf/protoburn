import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

/**
 * Fetches timeSeries({ days: 90 }) once and returns a sliced subset.
 * All consumers share the same cache entry.
 */
export function useTimeSeries(days: number) {
  const query = useQuery(
    trpc.tokenUsage.timeSeries.queryOptions({ days: 90 }),
  );

  const data = useMemo(() => {
    if (!query.data) return undefined;
    if (days >= 90) return query.data;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0]!;

    return query.data.filter((d) => d.date >= cutoffStr);
  }, [query.data, days]);

  return { ...query, data };
}
