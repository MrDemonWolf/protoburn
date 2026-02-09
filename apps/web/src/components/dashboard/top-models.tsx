"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useQuery, useIsFetching } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { trpc } from "@/utils/trpc";
import { calculateCost } from "@/lib/pricing";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function cleanModelName(model: string) {
  return model
    .replace(/^claude-/, "")
    .replace(/-\d{8}$/, "");
}

const MEDALS = [
  { emoji: "\u{1F947}", label: "1st", bg: "bg-yellow-500/10 border-yellow-500/20" },
  { emoji: "\u{1F948}", label: "2nd", bg: "bg-gray-400/10 border-gray-400/20" },
  { emoji: "\u{1F949}", label: "3rd", bg: "bg-amber-600/10 border-amber-600/20" },
];

export function TopModels() {
  const { data, isLoading } = useQuery(
    trpc.tokenUsage.byModel.queryOptions(),
  );

  // Track refetch cycles for AnimatedNumber
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

  const models = [...(data ?? [])]
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .slice(0, 3);

  // FLIP animation: track previous order and snapshot rects
  const prevOrderRef = useRef<string[]>([]);
  const cardRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const rectsSnapshot = useRef<Map<string, DOMRect>>(new Map());

  // Snapshot current positions before DOM updates
  useEffect(() => {
    if (!isLoading && models.length > 0) {
      const snap = new Map<string, DOMRect>();
      for (const m of models) {
        const el = cardRefsMap.current.get(m.model);
        if (el) snap.set(m.model, el.getBoundingClientRect());
      }
      rectsSnapshot.current = snap;
    }
  });

  // After render: compute FLIP if order changed
  useLayoutEffect(() => {
    if (isLoading || models.length === 0) return;

    const currentOrder = models.map((m) => m.model);
    const prevOrder = prevOrderRef.current;
    prevOrderRef.current = currentOrder;

    // Only FLIP if we had a previous order and it changed
    if (prevOrder.length === 0) return;
    if (JSON.stringify(prevOrder) === JSON.stringify(currentOrder)) return;

    const oldRects = rectsSnapshot.current;
    if (oldRects.size === 0) return;

    for (const m of models) {
      const el = cardRefsMap.current.get(m.model);
      const oldRect = oldRects.get(m.model);
      if (!el || !oldRect) continue;

      const newRect = el.getBoundingClientRect();
      const deltaX = oldRect.left - newRect.left;
      const deltaY = oldRect.top - newRect.top;

      if (deltaX === 0 && deltaY === 0) continue;

      // Invert: apply transform to old position
      el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      el.style.transition = "none";

      // Play: animate to new position
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.5s ease";
        el.style.transform = "";
        el.addEventListener(
          "transitionend",
          () => { el.style.transition = ""; },
          { once: true },
        );
      });
    }
  });

  if (isLoading) {
    return (
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <h2 className="font-heading text-sm font-semibold tracking-tight">Top Models</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-3">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (models.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-yellow-500" />
        <h2 className="font-heading text-sm font-semibold tracking-tight">Top Models</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {models.map((model, index) => {
          const cost = calculateCost(model.model, model.inputTokens, model.outputTokens);
          const medal = MEDALS[index]!;
          return (
            <Card
              key={model.model}
              className={`border ${medal.bg}`}
              ref={(el) => {
                if (el) cardRefsMap.current.set(model.model, el);
              }}
            >
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-bold tracking-tight">{cleanModelName(model.model)}</span>
                  <span className="text-base" title={medal.label}>{medal.emoji}</span>
                </div>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <AnimatedNumber
                    value={formatNumber(model.totalTokens)}
                    animateKey={animateKey}
                    className="text-xl font-bold"
                  />
                  <AnimatedNumber
                    value={`$${cost.toFixed(2)}`}
                    animateKey={animateKey}
                    className="font-heading text-sm font-bold"
                  />
                </div>
                <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                  <span className="flex">
                    In:&nbsp;
                    <AnimatedNumber
                      value={formatNumber(model.inputTokens)}
                      animateKey={animateKey}
                      className="inline-flex"
                    />
                  </span>
                  <span className="flex">
                    Out:&nbsp;
                    <AnimatedNumber
                      value={formatNumber(model.outputTokens)}
                      animateKey={animateKey}
                      className="inline-flex"
                    />
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
