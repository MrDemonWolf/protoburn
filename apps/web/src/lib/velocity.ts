export interface DailyPoint {
  date: string;
  totalTokens: number;
}

export type Trend = "up" | "down" | "flat";

export interface VelocityResult {
  tokensPerHour: number;
  tokensPerDay: number;
  projectedMonthEnd: number;
  remainingDays: number;
  sparkData: number[];
  trend: Trend;
  hasEnoughData: boolean;
}

export function calculateVelocity(
  dailyPoints: DailyPoint[],
  monthlyTotal: number,
  now: Date,
): VelocityResult {
  const empty: VelocityResult = {
    tokensPerHour: 0,
    tokensPerDay: 0,
    projectedMonthEnd: monthlyTotal,
    remainingDays: 0,
    sparkData: [],
    trend: "flat",
    hasEnoughData: false,
  };

  // Calculate remaining days in month (including partial today)
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  const hoursLeftToday = (24 - now.getHours()) / 24;
  const remainingDays = lastDay - currentDay + hoursLeftToday;

  empty.remainingDays = remainingDays;

  // Filter to non-zero days
  const nonZeroDays = dailyPoints.filter((d) => d.totalTokens > 0);
  if (nonZeroDays.length < 2) {
    empty.sparkData = dailyPoints.slice(-7).map((d) => d.totalTokens);
    return empty;
  }

  // Sort by date descending for weighting
  const sorted = [...dailyPoints].sort(
    (a, b) => b.date.localeCompare(a.date),
  );

  // Take last 7 days for weighted average
  const last7 = sorted.slice(0, 7);

  // Exponentially weighted average: most recent day gets weight 2^6, oldest gets 2^0
  let weightedSum = 0;
  let totalWeight = 0;
  for (let i = 0; i < last7.length; i++) {
    const weight = Math.pow(2, last7.length - 1 - i);
    weightedSum += last7[i]!.totalTokens * weight;
    totalWeight += weight;
  }

  const tokensPerDay = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const tokensPerHour = tokensPerDay / 24;
  const projectedMonthEnd = monthlyTotal + tokensPerDay * remainingDays;

  // Spark data: last 7 daily totals in chronological order
  const sparkData = sorted
    .slice(0, 7)
    .reverse()
    .map((d) => d.totalTokens);

  // Trend: compare recent 3-day avg vs prior 4-day avg
  let trend: Trend = "flat";
  if (last7.length >= 4) {
    const recent3 = last7.slice(0, Math.min(3, last7.length));
    const prior4 = last7.slice(Math.min(3, last7.length));

    const recentAvg =
      recent3.reduce((s, d) => s + d.totalTokens, 0) / recent3.length;
    const priorAvg =
      prior4.length > 0
        ? prior4.reduce((s, d) => s + d.totalTokens, 0) / prior4.length
        : recentAvg;

    const ratio = priorAvg > 0 ? recentAvg / priorAvg : 1;
    if (ratio > 1.1) trend = "up";
    else if (ratio < 0.9) trend = "down";
  }

  return {
    tokensPerHour,
    tokensPerDay,
    projectedMonthEnd,
    remainingDays,
    sparkData,
    trend,
    hasEnoughData: true,
  };
}
