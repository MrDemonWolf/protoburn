import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

/**
 * Derives all-time totals from `byModel` data client-side,
 * eliminating the need for a separate `totals` API call.
 */
export function useTotals() {
  const query = useQuery(trpc.tokenUsage.byModel.queryOptions());

  const data = useMemo(() => {
    if (!query.data) return undefined;

    let totalInput = 0;
    let totalOutput = 0;
    let totalCacheCreation = 0;
    let totalCacheRead = 0;

    for (const m of query.data) {
      totalInput += m.inputTokens;
      totalOutput += m.outputTokens;
      totalCacheCreation += m.cacheCreationTokens;
      totalCacheRead += m.cacheReadTokens;
    }

    return {
      totalInput,
      totalOutput,
      totalCacheCreation,
      totalCacheRead,
      totalTokens: totalInput + totalOutput + totalCacheCreation + totalCacheRead,
    };
  }, [query.data]);

  return { ...query, data };
}
