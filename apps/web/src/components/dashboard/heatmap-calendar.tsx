"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
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
  start.setDate(start.getDate() - 179);

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

  // Fix month labels after reversing — label the first row of each month (reading top-to-bottom = newest-to-oldest)
  const seenMonths = new Set<string>();
  for (const row of weekRows) {
    // Find the first valid date in this week
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

export function HeatmapCalendar({ className }: { className?: string }) {
  const { data, isLoading } = useQuery(
    trpc.tokenUsage.timeSeries.queryOptions({ days: 180 }),
  );

  const processed = useMemo(() => {
    if (!data) return null;

    const days: DayData[] = data.map((d) => ({
      ...d,
      totalTokens:
        d.inputTokens + d.outputTokens + (d.cacheCreationTokens ?? 0) + (d.cacheReadTokens ?? 0),
    }));

    const { weeks, maxTokens } = buildGrid(days);

    return { days, maxTokens, weeks };
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

  const { weeks, maxTokens } = processed;

  return (
    <Card size="sm" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-4" />
          Activity
          <span className="text-muted-foreground text-xs font-normal">Last 6 months</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-y-auto">
          <div
            className="inline-grid gap-[2px]"
            style={{
              gridTemplateColumns: `auto repeat(7, 10px)`,
              gridTemplateRows: `auto repeat(${weeks.length}, 10px)`,
            }}
          >
            {/* Day label header row */}
            <div /> {/* Empty corner */}
            {DAY_LABELS.map((label) => (
              <div key={label} className="text-muted-foreground text-[10px] leading-none text-center">
                {label.charAt(0)}
              </div>
            ))}

            {/* Week rows (newest first) */}
            {weeks.map((week, rowIdx) => [
              <div
                key={`month-${rowIdx}`}
                className="text-muted-foreground text-[10px] leading-[10px] pr-1 flex items-center"
              >
                {week.monthLabel ?? ""}
              </div>,
              ...week.cells.map((cell, colIdx) => {
                if (!cell || cell.date === null) {
                  return (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      className="size-[10px] rounded-[2px]"
                    />
                  );
                }

                const d = cell.data;
                const totalTokens = d?.totalTokens ?? 0;
                const bgColor = getHeatColor(totalTokens, maxTokens);

                const tooltipText = d
                  ? `${formatDate(cell.date)}: ${formatNumber(totalTokens)} tokens ($${estimateCost(d).toFixed(2)})\nIn: ${formatNumber(d.inputTokens)} | Out: ${formatNumber(d.outputTokens)} | CW: ${formatNumber(d.cacheCreationTokens)} | CR: ${formatNumber(d.cacheReadTokens)}`
                  : `${formatDate(cell.date)}: No usage`;

                return (
                  <Tooltip.Root key={`${rowIdx}-${colIdx}`}>
                    <Tooltip.Trigger
                      className="size-[10px] rounded-[2px] bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                      style={bgColor ? { backgroundColor: bgColor } : undefined}
                      aria-label={tooltipText.replace("\n", ", ")}
                      tabIndex={0}
                      render={<div />}
                    />
                    <Tooltip.Portal>
                      <Tooltip.Positioner sideOffset={4}>
                        <Tooltip.Popup className="rounded-xl bg-card px-2 py-1.5 text-[11px] text-popover-foreground shadow-md border border-[var(--glass-border)] backdrop-blur-xl backdrop-saturate-[180%] whitespace-pre-line max-w-[220px]">
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
        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="size-[10px] rounded-[2px] bg-muted" />
          <div className="size-[10px] rounded-[2px]" style={{ backgroundColor: HEAT_LEVELS[0] }} />
          <div className="size-[10px] rounded-[2px]" style={{ backgroundColor: HEAT_LEVELS[1] }} />
          <div className="size-[10px] rounded-[2px]" style={{ backgroundColor: HEAT_LEVELS[2] }} />
          <div className="size-[10px] rounded-[2px]" style={{ backgroundColor: HEAT_LEVELS[3] }} />
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
