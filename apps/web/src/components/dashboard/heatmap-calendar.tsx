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
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];
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

function buildGrid(days: DayData[]): { cells: GridCell[]; weeks: number; monthLabels: { label: string; col: number }[] } {
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

  const cells: GridCell[] = [];
  const monthLabels: { label: string; col: number }[] = [];
  const seenMonths = new Set<string>();

  const current = new Date(gridStart);
  let col = 0;

  while (current <= today) {
    const dateStr = toLocalDateStr(current);
    const isBeforeRange = current < start;

    // Advance column on each new Monday (except the first)
    if (current.getDay() === 1 && cells.length > 0 && cells.length % 7 === 0) {
      col++;
    }

    // Month labels at row 0 (Monday) — after col is incremented
    if (current.getDay() === 1) {
      const monthKey = `${current.getFullYear()}-${current.getMonth()}`;
      if (!seenMonths.has(monthKey)) {
        seenMonths.add(monthKey);
        monthLabels.push({ label: MONTH_NAMES[current.getMonth()]!, col });
      }
    }

    if (isBeforeRange) {
      cells.push({ date: null, data: null });
    } else {
      cells.push({ date: dateStr, data: lookup.get(dateStr) ?? null });
    }

    current.setDate(current.getDate() + 1);
  }

  const weeks = Math.ceil(cells.length / 7);
  return { cells, weeks, monthLabels };
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

    const maxTokens = Math.max(0, ...days.map((d) => d.totalTokens));
    const grid = buildGrid(days);

    return { days, maxTokens, ...grid };
  }, [data]);

  if (isLoading) {
    return (
      <Card size="sm" className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-4" />
            Daily Usage
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
            Daily Usage
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

  const { cells, weeks, maxTokens, monthLabels } = processed;

  return (
    <Card size="sm" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-4" />
          Daily Usage
          <span className="text-muted-foreground text-xs font-normal">Last 6 months</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div
            className="inline-grid gap-[2px]"
            style={{
              gridTemplateColumns: `auto repeat(${weeks}, 10px)`,
              gridTemplateRows: "auto repeat(7, 10px)",
            }}
          >
            {/* Month labels row */}
            <div /> {/* Empty corner */}
            {Array.from({ length: weeks }, (_, w) => {
              const ml = monthLabels.find((m) => m.col === w);
              return (
                <div key={w} className="text-muted-foreground text-[10px] leading-none px-[1px]">
                  {ml?.label ?? ""}
                </div>
              );
            })}

            {/* Day rows */}
            {Array.from({ length: 7 }, (_, row) => {
              const label = DAY_LABELS[row];
              return [
                <div
                  key={`label-${row}`}
                  className="text-muted-foreground text-[10px] leading-none pr-1 flex items-center"
                >
                  {label}
                </div>,
                ...Array.from({ length: weeks }, (_, col) => {
                  const idx = col * 7 + row;
                  const cell = cells[idx];

                  if (!cell || cell.date === null) {
                    return (
                      <div
                        key={`${row}-${col}`}
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
                    <Tooltip.Root key={`${row}-${col}`}>
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
              ];
            })}
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
