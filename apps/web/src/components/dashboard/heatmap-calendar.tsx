"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { formatNumber } from "@/lib/format";
import { calculateCost } from "@/lib/pricing";

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getHeatColor(tokens: number, maxTokens: number): string | undefined {
  if (tokens === 0 || maxTokens === 0) return undefined;
  const ratio = tokens / maxTokens;
  if (ratio < 0.25) return "hsl(200, 70%, 50%)";
  if (ratio < 0.5) return "hsl(210, 80%, 45%)";
  if (ratio < 0.75) return "hsl(30, 90%, 50%)";
  return "hsl(0, 80%, 50%)";
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
  start.setDate(start.getDate() - 89);

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
    const dateStr = current.toISOString().split("T")[0]!;
    const isBeforeRange = current < start;

    // Month labels at row 0 (Monday)
    if (current.getDay() === 1) {
      const monthKey = `${current.getFullYear()}-${current.getMonth()}`;
      if (!seenMonths.has(monthKey)) {
        seenMonths.add(monthKey);
        monthLabels.push({ label: MONTH_NAMES[current.getMonth()]!, col });
      }
    }

    if (current.getDay() === 1 && cells.length > 0 && cells.length % 7 === 0) {
      col++;
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

export function HeatmapCalendar() {
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

    const maxTokens = Math.max(0, ...days.map((d) => d.totalTokens));
    const grid = buildGrid(days);

    return { days, maxTokens, ...grid };
  }, [data]);

  if (isLoading) {
    return (
      <Card size="sm">
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
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-4" />
            Daily Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  const { cells, weeks, maxTokens, monthLabels } = processed;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-4" />
          Daily Usage
          <span className="text-muted-foreground text-xs font-normal">Last 90 days</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div
            className="inline-grid gap-[2px]"
            style={{
              gridTemplateColumns: `auto repeat(${weeks}, 1fr)`,
              gridTemplateRows: "auto repeat(7, 1fr)",
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
                        className="size-[10px] md:size-[14px] rounded-sm"
                      />
                    );
                  }

                  const d = cell.data;
                  const totalTokens = d?.totalTokens ?? 0;
                  const bgColor = getHeatColor(totalTokens, maxTokens);

                  const tooltip = d
                    ? `${formatDate(cell.date)}: ${formatNumber(totalTokens)} tokens ($${estimateCost(d).toFixed(2)})\nIn: ${formatNumber(d.inputTokens)} | Out: ${formatNumber(d.outputTokens)} | CW: ${formatNumber(d.cacheCreationTokens)} | CR: ${formatNumber(d.cacheReadTokens)}`
                    : `${formatDate(cell.date)}: No usage`;

                  return (
                    <div
                      key={`${row}-${col}`}
                      className="size-[10px] md:size-[14px] rounded-sm bg-muted"
                      style={bgColor ? { backgroundColor: bgColor } : undefined}
                      title={tooltip}
                    />
                  );
                }),
              ];
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="size-[10px] rounded-sm bg-muted" />
          <div className="size-[10px] rounded-sm" style={{ backgroundColor: "hsl(200, 70%, 50%)" }} />
          <div className="size-[10px] rounded-sm" style={{ backgroundColor: "hsl(210, 80%, 45%)" }} />
          <div className="size-[10px] rounded-sm" style={{ backgroundColor: "hsl(30, 90%, 50%)" }} />
          <div className="size-[10px] rounded-sm" style={{ backgroundColor: "hsl(0, 80%, 50%)" }} />
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
