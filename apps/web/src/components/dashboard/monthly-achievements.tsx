"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { Tooltip } from "@base-ui/react/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { trpc } from "@/utils/trpc";
import { BADGE_DEFINITIONS, evaluateBadges, getEarnedCount } from "@/lib/achievements";
import { cn } from "@/lib/utils";

export function MonthlyAchievements({ className }: { className?: string }) {
  const { data: modelData, isLoading } = useQuery(
    trpc.tokenUsage.byModelMonthly.queryOptions(),
  );

  const isFetching = useIsFetching();
  const wasFetchingRef = useRef(false);
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    if (isFetching > 0) {
      wasFetchingRef.current = true;
    } else if (wasFetchingRef.current) {
      wasFetchingRef.current = false;
      setAnimateKey((k) => k + 1);
    }
  }, [isFetching]);

  const earned = useMemo(() => {
    if (!modelData) return new Set<string>();
    const models = modelData.models.map((m) => ({
      model: m.model,
      inputTokens: m.inputTokens,
      outputTokens: m.outputTokens,
      cacheCreationTokens: m.cacheCreationTokens,
      cacheReadTokens: m.cacheReadTokens,
    }));
    const totalTokens = modelData.models.reduce(
      (s, m) => s + m.totalTokens,
      0,
    );
    return evaluateBadges({ totalTokens, models });
  }, [modelData]);

  const earnedCount = getEarnedCount(earned);

  if (isLoading) {
    return (
      <Card size="sm" className={cn(className)}>
        <CardContent className="py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-heading font-semibold">Achievements</span>
          </div>
          <Skeleton className="h-5 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm" className={className}>
      <CardContent className="py-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-heading font-semibold">Achievements</span>
          </div>
          <AnimatedNumber
            value={`${earnedCount}/${BADGE_DEFINITIONS.length} earned`}
            animateKey={animateKey}
            className="text-sm font-bold"
          />
          <div className="grid grid-cols-4 gap-1 md:grid-cols-9">
            {BADGE_DEFINITIONS.map((badge) => {
              const isEarned = earned.has(badge.id);
              return (
                <Tooltip.Root key={badge.id}>
                  <Tooltip.Trigger
                    className={`flex h-7 w-7 items-center justify-center rounded text-base ${
                      isEarned ? "" : "grayscale opacity-25"
                    }`}
                  >
                    {badge.emoji}
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Positioner sideOffset={4}>
                      <Tooltip.Popup className="max-w-[200px] rounded-md bg-popover px-2 py-1.5 text-[11px] text-popover-foreground shadow-md ring-1 ring-border">
                        <p className="font-semibold">{badge.name}</p>
                        <p className="text-muted-foreground">
                          {badge.requirement}
                        </p>
                      </Tooltip.Popup>
                    </Tooltip.Positioner>
                  </Tooltip.Portal>
                </Tooltip.Root>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
