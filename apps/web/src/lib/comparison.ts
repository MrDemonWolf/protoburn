export type DeltaResult = {
  percent: number;
  direction: "up" | "down" | "flat";
  label: string;
};

export function computeDelta(current: number, previous: number): DeltaResult {
  if (previous === 0 && current === 0) {
    return { percent: 0, direction: "flat", label: "0%" };
  }
  if (previous === 0) {
    return { percent: 100, direction: "up", label: "+100%" };
  }
  const percent = ((current - previous) / previous) * 100;
  const rounded = Math.round(percent * 10) / 10;
  if (rounded === 0) {
    return { percent: 0, direction: "flat", label: "0%" };
  }
  const direction = rounded > 0 ? "up" : "down";
  const label = rounded > 0 ? `+${rounded}%` : `${rounded}%`;
  return { percent: rounded, direction, label };
}

export type RankChange = {
  currentRank: number;
  previousRank: number | null;
  change: number | null; // null = new model
};

export function computeRankChange(
  currentModels: { model: string; totalTokens: number }[],
  previousModels: { model: string; totalTokens: number }[],
): Map<string, RankChange> {
  const sorted = (list: typeof currentModels) =>
    [...list].sort((a, b) => b.totalTokens - a.totalTokens);

  const currentSorted = sorted(currentModels);
  const previousSorted = sorted(previousModels);

  const prevRankMap = new Map<string, number>();
  previousSorted.forEach((m, i) => prevRankMap.set(m.model, i + 1));

  const result = new Map<string, RankChange>();
  currentSorted.forEach((m, i) => {
    const currentRank = i + 1;
    const previousRank = prevRankMap.get(m.model) ?? null;
    const change = previousRank === null ? null : previousRank - currentRank;
    result.set(m.model, { currentRank, previousRank, change });
  });

  return result;
}

type DayData = {
  day: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
};

type MergedDay = {
  day: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cmp_inputTokens: number;
  cmp_outputTokens: number;
  cmp_cacheCreationTokens: number;
  cmp_cacheReadTokens: number;
};

export function mergeMonthlyTimeSeries(
  currentDays: DayData[],
  comparisonDays: DayData[],
): MergedDay[] {
  const currentMap = new Map<number, DayData>();
  currentDays.forEach((d) => currentMap.set(d.day, d));

  const comparisonMap = new Map<number, DayData>();
  comparisonDays.forEach((d) => comparisonMap.set(d.day, d));

  const allDays = new Set<number>();
  currentDays.forEach((d) => allDays.add(d.day));
  comparisonDays.forEach((d) => allDays.add(d.day));

  const zero = { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 };

  return [...allDays]
    .sort((a, b) => a - b)
    .map((day) => {
      const curr = currentMap.get(day) ?? { day, ...zero };
      const cmp = comparisonMap.get(day) ?? { day, ...zero };
      return {
        day,
        inputTokens: curr.inputTokens,
        outputTokens: curr.outputTokens,
        cacheCreationTokens: curr.cacheCreationTokens,
        cacheReadTokens: curr.cacheReadTokens,
        cmp_inputTokens: cmp.inputTokens,
        cmp_outputTokens: cmp.outputTokens,
        cmp_cacheCreationTokens: cmp.cacheCreationTokens,
        cmp_cacheReadTokens: cmp.cacheReadTokens,
      };
    });
}
