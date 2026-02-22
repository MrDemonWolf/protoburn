"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Flame, Zap } from "lucide-react";
import { Tooltip } from "@base-ui/react/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { formatNumber } from "@/lib/format";
import { calculateCost } from "@/lib/pricing";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const HEAT_LEVELS = [
  "var(--heat-1)",
  "var(--heat-2)",
  "var(--heat-3)",
  "var(--heat-4)",
] as const;

function getHeatColor(tokens: number, maxTokens: number): string | undefined {
  if (tokens === 0 || maxTokens === 0) return undefined;
  const ratio = tokens / maxTokens;
  if (ratio < 0.25) return HEAT_LEVELS[0];
  if (ratio < 0.5) return HEAT_LEVELS[1];
  if (ratio < 0.75) return HEAT_LEVELS[2];
  return HEAT_LEVELS[3];
}

function getHeatLevel(tokens: number, maxTokens: number): number {
  if (tokens === 0 || maxTokens === 0) return 0;
  const ratio = tokens / maxTokens;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface DayData {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
}

interface GridCell {
  date: string | null;
  data: DayData | null;
}

interface WeekRow {
  cells: GridCell[];
  monthLabel: string | null;
}

function buildGrid(days: DayData[]): { weeks: WeekRow[]; maxTokens: number } {
  const lookup = new Map<string, DayData>();
  for (const d of days) lookup.set(d.date, d);

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 89);

  // Align start to Monday
  const startDay = start.getDay();
  const mondayOffset = startDay === 0 ? -6 : 1 - startDay;
  const gridStart = new Date(start);
  gridStart.setDate(gridStart.getDate() + mondayOffset);

  // Build week rows (each week = 7 cells, Mon-Sun)
  const weekRows: WeekRow[] = [];
  const current = new Date(gridStart);

  while (current <= today) {
    const cells: GridCell[] = [];
    const weekMonday = new Date(current);

    for (let d = 0; d < 7; d++) {
      const dateStr = toLocalDateStr(current);
      const isBeforeRange = current < start;
      const isPastToday = current > today;

      if (isBeforeRange || isPastToday) {
        cells.push({ date: null, data: null });
      } else {
        cells.push({ date: dateStr, data: lookup.get(dateStr) ?? null });
      }
      current.setDate(current.getDate() + 1);
    }

    // Month label: show if this week's Monday starts a new month
    // or is the first week
    const monthLabel = weekRows.length === 0 ||
      weekMonday.getMonth() !== new Date(weekRows[weekRows.length - 1]!.cells[0]!.date ?? toLocalDateStr(weekMonday)).getMonth()
      ? MONTH_NAMES[weekMonday.getMonth()]!
      : null;

    weekRows.push({ cells, monthLabel });
  }

  // Reverse so newest week is at top
  weekRows.reverse();

  // Fix month labels after reversing
  const seenMonths = new Set<string>();
  for (const row of weekRows) {
    const firstDate = row.cells.find((c) => c.date !== null)?.date;
    if (!firstDate) {
      row.monthLabel = null;
      continue;
    }
    const [, m] = firstDate.split("-");
    const monthKey = firstDate.substring(0, 7);
    if (!seenMonths.has(monthKey)) {
      seenMonths.add(monthKey);
      row.monthLabel = MONTH_NAMES[parseInt(m!, 10) - 1]!;
    } else {
      row.monthLabel = null;
    }
  }

  const maxTokens = Math.max(0, ...days.map((d) => d.totalTokens));

  return { weeks: weekRows, maxTokens };
}

function computeStats(days: DayData[]) {
  const activeDays = days.filter((d) => d.totalTokens > 0).length;

  // Current streak (consecutive days ending at today or yesterday with usage)
  let streak = 0;
  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date));

  // Find the most recent day with data
  let checkDate = new Date(today);
  for (let i = 0; i < 90; i++) {
    const dateStr = toLocalDateStr(checkDate);
    const dayData = sorted.find((d) => d.date === dateStr);
    if (dayData && dayData.totalTokens > 0) {
      streak++;
    } else if (dateStr === todayStr) {
      // Today might not have data yet, skip
    } else {
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Find the peak day
  const peakDay = days.reduce(
    (max, d) => (d.totalTokens > max.totalTokens ? d : max),
    { date: "", totalTokens: 0, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 },
  );

  return { activeDays, streak, peakDay };
}

export function HeatmapCalendar({ className }: { className?: string }) {
  const { data, isLoading } = useQuery(
    trpc.tokenUsage.timeSeries.queryOptions({ days: 90 }),
  );

  const processed = useMemo(() => {
    if (!data) return null;

    const days: DayData[] = data.map((d) => ({
      ...d,
      totalTokens:
        d.inputTokens + d.outputTokens + (d.cacheCreationTokens ?? 0) + (d.cacheReadTokens ?? 0),
    }));

    const { weeks, maxTokens } = buildGrid(days);
    const stats = computeStats(days);

    return { days, maxTokens, weeks, stats };
  }, [data]);

  if (isLoading) {
    return (
      <Card size="sm" className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-4" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[120px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!processed || processed.days.length === 0) {
    return (
      <Card size="sm" className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-4" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[100px] items-center justify-center">
            <p className="text-muted-foreground text-sm">No usage data yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { weeks, maxTokens, stats } = processed;

  return (
    <Card size="sm" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-4" />
          Activity
          <span className="text-muted-foreground text-xs font-normal">Last 3 months</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Activity stats bar */}
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">{stats.activeDays} active days</span>
          </div>
          {stats.streak > 0 && (
            <div className="flex items-center gap-1.5">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-muted-foreground">{stats.streak} day streak</span>
            </div>
          )}
          {stats.peakDay.totalTokens > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">
                Peak: {formatNumber(stats.peakDay.totalTokens)} on {formatDate(stats.peakDay.date)}
              </span>
            </div>
          )}
        </div>

        <div>
          <div
            className="inline-grid gap-[3px] [--cell:11px] md:[--cell:14px]"
            style={{
              gridTemplateColumns: `auto repeat(7, var(--cell))`,
              gridTemplateRows: `auto repeat(${weeks.length}, var(--cell))`,
            }}
          >
            {/* Day label header row */}
            <div /> {/* Empty corner */}
            {DAY_LABELS.map((label) => (
              <div key={label} className="text-muted-foreground text-[10px] md:text-[11px] leading-none text-center">
                {label.charAt(0)}
              </div>
            ))}

            {/* Week rows (newest first) */}
            {weeks.map((week, rowIdx) => [
              <div
                key={`month-${rowIdx}`}
                className="text-muted-foreground text-[10px] md:text-[11px] leading-[var(--cell)] pr-1.5 flex items-center font-medium"
              >
                {week.monthLabel ?? ""}
              </div>,
              ...week.cells.map((cell, colIdx) => {
                if (!cell || cell.date === null) {
                  return (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      className="size-[var(--cell)] rounded-[3px]"
                    />
                  );
                }

                const d = cell.data;
                const totalTokens = d?.totalTokens ?? 0;
                const bgColor = getHeatColor(totalTokens, maxTokens);
                const heatLevel = getHeatLevel(totalTokens, maxTokens);

                const tooltipText = d
                  ? `${formatDate(cell.date)}: ${formatNumber(totalTokens)} tokens ($${estimateCost(d).toFixed(2)})\nIn: ${formatNumber(d.inputTokens)} | Out: ${formatNumber(d.outputTokens)} | CW: ${formatNumber(d.cacheCreationTokens)} | CR: ${formatNumber(d.cacheReadTokens)}`
                  : `${formatDate(cell.date)}: No usage`;

                return (
                  <Tooltip.Root key={`${rowIdx}-${colIdx}`}>
                    <Tooltip.Trigger
                      className={`heatmap-cell size-[var(--cell)] rounded-[3px] bg-muted focus-visible:outline-2 focus-visible:outline-ring ${
                        heatLevel === 4 ? "heatmap-cell-hot" : ""
                      }`}
                      style={bgColor ? { backgroundColor: bgColor } : undefined}
                      aria-label={tooltipText.replace("\n", ", ")}
                      tabIndex={0}
                      render={<div />}
                    />
                    <Tooltip.Portal>
                      <Tooltip.Positioner sideOffset={4} className="z-50">
                        <Tooltip.Popup className="rounded-xl bg-card px-2.5 py-2 text-[11px] text-popover-foreground shadow-lg border border-[var(--glass-border)] backdrop-blur-xl backdrop-saturate-[180%] whitespace-pre-line max-w-[220px] leading-relaxed">
                          {tooltipText}
                        </Tooltip.Popup>
                      </Tooltip.Positioner>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                );
              }),
            ])}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-2.5 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="size-[var(--cell)] rounded-[3px] bg-muted" />
          {HEAT_LEVELS.map((color, i) => (
            <div
              key={i}
              className="size-[var(--cell)] rounded-[3px] transition-transform duration-150 hover:scale-125"
              style={{ backgroundColor: color }}
            />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  const month = MONTH_NAMES[parseInt(m!, 10) - 1];
  return `${month} ${parseInt(d!, 10)}`;
}

function estimateCost(d: DayData): number {
  return calculateCost(
    "sonnet-4-5",
    d.inputTokens,
    d.outputTokens,
    d.cacheCreationTokens,
    d.cacheReadTokens,
  );
}
