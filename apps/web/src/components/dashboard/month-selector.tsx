"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarRange, X } from "lucide-react";
import { trpc } from "@/utils/trpc";

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(y, m - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function MonthSelector({
  compareMonth,
  onChange,
}: {
  compareMonth: string | null;
  onChange: (month: string | null) => void;
}) {
  const { data: months } = useQuery(
    trpc.tokenUsage.availableMonths.queryOptions(),
  );

  // Exclude current month from options
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const options = (months ?? []).filter((m) => m !== currentMonth);

  if (options.length === 0) return null;

  if (compareMonth) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(null)}
          className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <CalendarRange className="h-3 w-3" />
          vs {formatMonthLabel(compareMonth)}
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <select
          value=""
          onChange={(e) => onChange(e.target.value || null)}
          className="flex h-7 cursor-pointer appearance-none items-center gap-1.5 rounded-full border border-border bg-background pl-7 pr-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Compare...</option>
          {options.map((m) => (
            <option key={m} value={m}>
              vs {formatMonthLabel(m)}
            </option>
          ))}
        </select>
        <CalendarRange className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}
